use anyhow::Result;
use rusqlite::{Connection, params};
use crate::models::email::{Email, EmailFilter};

pub struct Database {
    pub conn: Connection,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Self { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        // 邮件表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS emails (
                id TEXT PRIMARY KEY,
                sender TEXT NOT NULL,
                recipient TEXT NOT NULL,
                subject TEXT NOT NULL,
                body TEXT NOT NULL,
                category TEXT NOT NULL,
                is_read BOOLEAN NOT NULL DEFAULT 0,
                is_important BOOLEAN NOT NULL DEFAULT 0,
                account_id INTEGER,
                message_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (account_id) REFERENCES email_accounts (id)
            )",
            [],
        )?;

        // 邮件服务商表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS email_providers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                provider_type TEXT NOT NULL UNIQUE,
                imap_server TEXT NOT NULL,
                imap_port INTEGER NOT NULL,
                smtp_server TEXT NOT NULL,
                smtp_port INTEGER NOT NULL,
                use_ssl BOOLEAN NOT NULL DEFAULT 1,
                use_tls BOOLEAN NOT NULL DEFAULT 1
            )",
            [],
        )?;

        // 邮件账户表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS email_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_id INTEGER NOT NULL,
                email_address TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                last_sync TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (provider_id) REFERENCES email_providers (id)
            )",
            [],
        )?;

        // 邮件分类表
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS email_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                color TEXT NOT NULL DEFAULT '#007bff',
                description TEXT,
                is_system BOOLEAN NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )",
            [],
        )?;

        // 创建索引以提高查询性能
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_emails_sender ON emails(sender)",
            [],
        )?;
        
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient)",
            [],
        )?;
        
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(category)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_emails_account ON emails(account_id)",
            [],
        )?;

        // 初始化默认数据
        self.init_default_data()?;

        Ok(())
    }

    fn init_default_data(&self) -> Result<()> {
        // 插入预设的邮件服务商
        use crate::models::email_provider::EmailProvider;
        
        let providers = EmailProvider::get_predefined_providers();
        for provider in providers {
            self.conn.execute(
                "INSERT OR IGNORE INTO email_providers 
                 (id, name, provider_type, imap_server, imap_port, smtp_server, smtp_port, use_ssl, use_tls)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    provider.id,
                    provider.name,
                    provider.provider_type,
                    provider.imap_server,
                    provider.imap_port,
                    provider.smtp_server,
                    provider.smtp_port,
                    provider.use_ssl,
                    provider.use_tls
                ],
            )?;
        }

        // 插入默认分类
        let default_categories = vec![
            ("收件箱", "#007bff", "接收的邮件", true),
            ("发件箱", "#28a745", "发送的邮件", true),
            ("草稿箱", "#ffc107", "草稿邮件", true),
            ("垃圾箱", "#dc3545", "已删除的邮件", true),
            ("工作", "#6f42c1", "工作相关邮件", false),
            ("个人", "#fd7e14", "个人邮件", false),
            ("重要", "#e83e8c", "重要邮件", false),
        ];

        for (name, color, desc, is_system) in default_categories {
            self.conn.execute(
                "INSERT OR IGNORE INTO email_categories (name, color, description, is_system, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    name,
                    color,
                    desc,
                    is_system,
                    chrono::Utc::now().to_rfc3339()
                ],
            )?;
        }

        Ok(())
    }

    fn row_to_email(row: &rusqlite::Row) -> rusqlite::Result<Email> {
        Ok(Email {
            id: row.get(0)?,
            sender: row.get(1)?,
            recipient: row.get(2)?,
            subject: row.get(3)?,
            body: row.get(4)?,
            category: row.get(5)?,
            is_read: row.get(6)?,
            is_important: row.get(7)?,
            created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?)
                .unwrap()
                .with_timezone(&chrono::Utc),
            updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?)
                .unwrap()
                .with_timezone(&chrono::Utc),
        })
    }

    pub fn insert_email(&self, email: &Email) -> Result<()> {
        self.conn.execute(
            "INSERT INTO emails (id, sender, recipient, subject, body, category, is_read, is_important, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                email.id,
                email.sender,
                email.recipient,
                email.subject,
                email.body,
                email.category,
                email.is_read,
                email.is_important,
                email.created_at.to_rfc3339(),
                email.updated_at.to_rfc3339()
            ],
        )?;
        Ok(())
    }

    pub fn get_email_by_id(&self, id: &str) -> Result<Option<Email>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, sender, recipient, subject, body, category, is_read, is_important, created_at, updated_at
             FROM emails WHERE id = ?1"
        )?;

        let email_iter = stmt.query_map([id], Self::row_to_email)?;

        for email in email_iter {
            return Ok(Some(email?));
        }
        Ok(None)
    }

    pub fn update_email(&self, email: &Email) -> Result<()> {
        self.conn.execute(
            "UPDATE emails SET sender = ?2, recipient = ?3, subject = ?4, body = ?5, 
             category = ?6, is_read = ?7, is_important = ?8, updated_at = ?9 WHERE id = ?1",
            params![
                email.id,
                email.sender,
                email.recipient,
                email.subject,
                email.body,
                email.category,
                email.is_read,
                email.is_important,
                email.updated_at.to_rfc3339()
            ],
        )?;
        Ok(())
    }

    pub fn delete_email(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM emails WHERE id = ?1", [id])?;
        Ok(())
    }

    pub fn get_all_emails(&self) -> Result<Vec<Email>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, sender, recipient, subject, body, category, is_read, is_important, created_at, updated_at
             FROM emails ORDER BY created_at DESC"
        )?;

        let email_iter = stmt.query_map([], Self::row_to_email)?;

        let mut emails = Vec::new();
        for email in email_iter {
            emails.push(email?);
        }
        Ok(emails)
    }

    pub fn search_emails(&self, filter: &EmailFilter) -> Result<Vec<Email>> {
        let mut query = String::from(
            "SELECT id, sender, recipient, subject, body, category, is_read, is_important, created_at, updated_at
             FROM emails WHERE 1=1"
        );
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(sender) = &filter.sender {
            query.push_str(" AND sender LIKE ?");
            params.push(Box::new(format!("%{}%", sender)));
        }

        if let Some(recipient) = &filter.recipient {
            query.push_str(" AND recipient LIKE ?");
            params.push(Box::new(format!("%{}%", recipient)));
        }

        if let Some(category) = &filter.category {
            query.push_str(" AND category = ?");
            params.push(Box::new(category.clone()));
        }

        if let Some(is_read) = filter.is_read {
            query.push_str(" AND is_read = ?");
            params.push(Box::new(is_read));
        }

        if let Some(is_important) = filter.is_important {
            query.push_str(" AND is_important = ?");
            params.push(Box::new(is_important));
        }

        if let Some(keyword) = &filter.keyword {
            query.push_str(" AND (subject LIKE ? OR body LIKE ?)");
            let keyword_pattern = format!("%{}%", keyword);
            params.push(Box::new(keyword_pattern.clone()));
            params.push(Box::new(keyword_pattern));
        }

        query.push_str(" ORDER BY created_at DESC");

        let mut stmt = self.conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        
        let email_iter = stmt.query_map(&param_refs[..], Self::row_to_email)?;

        let mut emails = Vec::new();
        for email in email_iter {
            emails.push(email?);
        }
        Ok(emails)
    }

    pub fn get_categories(&self) -> Result<Vec<String>> {
        let mut stmt = self.conn.prepare("SELECT DISTINCT category FROM emails ORDER BY category")?;
        let category_iter = stmt.query_map([], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        let mut categories = Vec::new();
        for category in category_iter {
            categories.push(category?);
        }
        Ok(categories)
    }

    pub fn get_email_count(&self) -> Result<usize> {
        let mut stmt = self.conn.prepare("SELECT COUNT(*) FROM emails")?;
        let count: i64 = stmt.query_row([], |row| row.get(0))?;
        Ok(count as usize)
    }

    pub fn get_unread_count(&self) -> Result<usize> {
        let mut stmt = self.conn.prepare("SELECT COUNT(*) FROM emails WHERE is_read = 0")?;
        let count: i64 = stmt.query_row([], |row| row.get(0))?;
        Ok(count as usize)
    }

    pub fn get_important_count(&self) -> Result<usize> {
        let mut stmt = self.conn.prepare("SELECT COUNT(*) FROM emails WHERE is_important = 1")?;
        let count: i64 = stmt.query_row([], |row| row.get(0))?;
        Ok(count as usize)
    }
}