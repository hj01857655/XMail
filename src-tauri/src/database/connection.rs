use anyhow::Result;
use rusqlite::{Connection, params};
use crate::models::email::{Email, EmailFilter};

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Self { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
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
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        // 创建索引以提高查询性能
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_sender ON emails(sender)",
            [],
        )?;
        
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_recipient ON emails(recipient)",
            [],
        )?;
        
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_category ON emails(category)",
            [],
        )?;

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
}