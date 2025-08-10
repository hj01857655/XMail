use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailProvider {
    pub id: i32,
    pub name: String,
    pub provider_type: String, // gmail, qq, 163, outlook, etc.
    pub imap_server: String,
    pub imap_port: u16,
    pub smtp_server: String,
    pub smtp_port: u16,
    pub use_ssl: bool,
    pub use_tls: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAccount {
    pub id: i32,
    pub provider_id: i32,
    pub email_address: String,
    pub display_name: String,
    pub username: String,
    pub password: String, // 应该加密存储
    pub is_active: bool,
    pub last_sync: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailCategory {
    pub id: i32,
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    pub is_system: bool, // 系统预设分类
    pub created_at: String,
}

// 预设的邮件服务商配置
impl EmailProvider {
    pub fn get_predefined_providers() -> Vec<EmailProvider> {
        vec![
            EmailProvider {
                id: 1,
                name: "Gmail".to_string(),
                provider_type: "gmail".to_string(),
                imap_server: "imap.gmail.com".to_string(),
                imap_port: 993,
                smtp_server: "smtp.gmail.com".to_string(),
                smtp_port: 587,
                use_ssl: true,
                use_tls: true,
            },
            EmailProvider {
                id: 2,
                name: "QQ邮箱".to_string(),
                provider_type: "qq".to_string(),
                imap_server: "imap.qq.com".to_string(),
                imap_port: 993,
                smtp_server: "smtp.qq.com".to_string(),
                smtp_port: 587,
                use_ssl: true,
                use_tls: true,
            },
            EmailProvider {
                id: 3,
                name: "163邮箱".to_string(),
                provider_type: "163".to_string(),
                imap_server: "imap.163.com".to_string(),
                imap_port: 993,
                smtp_server: "smtp.163.com".to_string(),
                smtp_port: 994,
                use_ssl: true,
                use_tls: false,
            },
            EmailProvider {
                id: 4,
                name: "126邮箱".to_string(),
                provider_type: "126".to_string(),
                imap_server: "imap.126.com".to_string(),
                imap_port: 993,
                smtp_server: "smtp.126.com".to_string(),
                smtp_port: 994,
                use_ssl: true,
                use_tls: false,
            },
            EmailProvider {
                id: 5,
                name: "Outlook".to_string(),
                provider_type: "outlook".to_string(),
                imap_server: "outlook.office365.com".to_string(),
                imap_port: 993,
                smtp_server: "smtp-mail.outlook.com".to_string(),
                smtp_port: 587,
                use_ssl: true,
                use_tls: true,
            },
        ]
    }
}