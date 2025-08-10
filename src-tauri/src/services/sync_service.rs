use anyhow::{Result, anyhow};
use imap::Session;
use native_tls::{TlsConnector, TlsStream};
use std::net::TcpStream;
use crate::models::email_provider::{EmailProvider, EmailAccount};
use crate::models::email::Email;

pub struct EmailSyncService {
    provider: EmailProvider,
    account: EmailAccount,
}

impl EmailSyncService {
    pub fn new(provider: EmailProvider, account: EmailAccount) -> Self {
        Self { provider, account }
    }

    pub async fn connect_imap(&self) -> Result<Session<TlsStream<TcpStream>>> {
        use crate::services::crypto_service::CryptoService;
        
        let domain = &self.provider.imap_server;
        let port = self.provider.imap_port;

        // 解密密码
        let password = CryptoService::decrypt_password(&self.account.password)?;

        // 重试连接（最多3次）
        let mut attempts = 0;
        let max_attempts = 3;
        
        while attempts < max_attempts {
            attempts += 1;
            
            match self.try_connect_imap(domain, port, &password).await {
                Ok(session) => return Ok(session),
                Err(e) => {
                    eprintln!("IMAP连接失败 (尝试 {}/{}): {}", attempts, max_attempts, e);
                    if attempts < max_attempts {
                        // 指数退避：等待 2^attempts 秒
                        let delay = std::time::Duration::from_secs(2_u64.pow(attempts));
                        tokio::time::sleep(delay).await;
                    } else {
                        return Err(e);
                    }
                }
            }
        }
        
        Err(anyhow!("IMAP连接失败，已重试 {} 次", max_attempts))
    }

    async fn try_connect_imap(&self, domain: &str, port: u16, password: &str) -> Result<Session<TlsStream<TcpStream>>> {
        // 建立TCP连接（30秒超时）
        let tcp_stream = tokio::time::timeout(
            std::time::Duration::from_secs(30),
            tokio::net::TcpStream::connect((domain, port))
        ).await??;
        
        // 转换为同步流
        let std_stream = tcp_stream.into_std()?;
        
        // 建立TLS连接
        let tls = TlsConnector::new()?;
        let tls_stream = tls.connect(domain, std_stream)?;

        // 创建IMAP会话
        let client = imap::Client::new(tls_stream);
        
        // 登录
        let session = client
            .login(&self.account.username, password)
            .map_err(|e| anyhow!("IMAP登录失败: {:?}", e.0))?;

        Ok(session)
    }

    pub async fn fetch_emails(&self, folder: &str, limit: usize) -> Result<Vec<Email>> {
        let mut session = self.connect_imap().await?;
        
        // 选择邮箱文件夹
        session.select(folder)?;

        // 搜索邮件
        let sequences = session.search("ALL")?;
        
        let mut emails = Vec::new();
        let start = if sequences.len() > limit {
            sequences.len() - limit
        } else {
            0
        };

        for seq in &sequences[start..] {
            if let Ok(messages) = session.fetch(format!("{}", seq), "RFC822") {
                for message in &messages {
                    if let Some(body) = message.body() {
                        match self.parse_email_from_raw(body) {
                            Ok(email) => emails.push(email),
                            Err(e) => eprintln!("解析邮件失败: {}", e),
                        }
                    }
                }
            }
        }

        // 登出
        session.logout()?;
        
        Ok(emails)
    }

    fn parse_email_from_raw(&self, raw_email: &[u8]) -> Result<Email> {
        let email_str = String::from_utf8_lossy(raw_email);
        
        // 简单的邮件解析（实际应用中应该使用专门的邮件解析库）
        let mut sender = String::new();
        let mut recipient = String::new();
        let mut subject = String::new();
        let mut body = String::new();
        
        let mut in_body = false;
        let mut body_lines = Vec::new();
        
        for line in email_str.lines() {
            if in_body {
                body_lines.push(line);
                continue;
            }
            
            if line.is_empty() {
                in_body = true;
                continue;
            }
            
            if line.starts_with("From: ") {
                sender = self.extract_email_address(&line[6..]);
            } else if line.starts_with("To: ") {
                recipient = self.extract_email_address(&line[4..]);
            } else if line.starts_with("Subject: ") {
                subject = line[9..].to_string();
            }
        }
        
        body = body_lines.join("\n");
        
        // 如果收件人为空，使用当前账户邮箱
        if recipient.is_empty() {
            recipient = self.account.email_address.clone();
        }
        
        Ok(Email {
            id: uuid::Uuid::new_v4().to_string(),
            sender,
            recipient,
            subject,
            body,
            category: "收件箱".to_string(),
            is_read: false,
            is_important: false,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        })
    }
    
    fn extract_email_address(&self, header_value: &str) -> String {
        // 简单的邮箱地址提取
        if let Some(start) = header_value.find('<') {
            if let Some(end) = header_value.find('>') {
                return header_value[start + 1..end].to_string();
            }
        }
        
        // 如果没有尖括号，尝试提取邮箱格式的字符串
        let re = regex::Regex::new(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}").unwrap();
        if let Some(mat) = re.find(header_value) {
            return mat.as_str().to_string();
        }
        
        header_value.trim().to_string()
    }

    pub async fn send_email(&self, email: &Email) -> Result<()> {
        use lettre::{Message, SmtpTransport, Transport};
        use lettre::transport::smtp::authentication::Credentials;

        // 构建邮件
        let message = Message::builder()
            .from(email.sender.parse()?)
            .to(email.recipient.parse()?)
            .subject(&email.subject)
            .body(email.body.clone())?;

        // 配置SMTP
        let creds = Credentials::new(
            self.account.username.clone(),
            self.account.password.clone(),
        );

        let mailer = SmtpTransport::relay(&self.provider.smtp_server)?
            .port(self.provider.smtp_port)
            .credentials(creds)
            .build();

        // 发送邮件
        mailer.send(&message)?;
        
        Ok(())
    }

    pub async fn test_connection(&self) -> Result<bool> {
        match self.connect_imap().await {
            Ok(mut session) => {
                session.logout().ok();
                Ok(true)
            }
            Err(_) => Ok(false)
        }
    }
}

// 邮件同步管理器
pub struct SyncManager {
    // 可以添加同步状态管理、定时同步等功能
}

impl SyncManager {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn sync_account_emails(
        &self, 
        provider: EmailProvider, 
        account: EmailAccount
    ) -> Result<Vec<Email>> {
        let sync_service = EmailSyncService::new(provider, account);
        
        // 同步收件箱
        let mut all_emails = Vec::new();
        
        // 尝试同步不同文件夹
        let folders = vec!["INBOX", "Sent", "Drafts"];
        
        for folder in folders {
            match sync_service.fetch_emails(folder, 50).await {
                Ok(mut emails) => {
                    // 根据文件夹设置分类
                    for email in &mut emails {
                        email.category = match folder {
                            "INBOX" => "收件箱".to_string(),
                            "Sent" => "发件箱".to_string(),
                            "Drafts" => "草稿箱".to_string(),
                            _ => "其他".to_string(),
                        };
                    }
                    all_emails.extend(emails);
                }
                Err(e) => {
                    eprintln!("同步文件夹 {} 失败: {}", folder, e);
                }
            }
        }
        
        Ok(all_emails)
    }
}