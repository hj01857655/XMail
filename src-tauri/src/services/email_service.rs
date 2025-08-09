use anyhow::Result;
use crate::database::Database;
use crate::models::{Email, EmailFilter};

pub struct EmailService {
    db: Database,
}

impl EmailService {
    pub fn new(db_path: &str) -> Result<Self> {
        let db = Database::new(db_path)?;
        Ok(Self { db })
    }

    pub fn create_email(
        &self,
        sender: String,
        recipient: String,
        subject: String,
        body: String,
        category: String,
    ) -> Result<String> {
        let email = Email::new(sender, recipient, subject, body, category);
        let id = email.id.clone();
        self.db.insert_email(&email)?;
        Ok(id)
    }

    pub fn get_email(&self, id: &str) -> Result<Option<Email>> {
        self.db.get_email_by_id(id)
    }

    pub fn get_all_emails(&self) -> Result<Vec<Email>> {
        self.db.get_all_emails()
    }

    pub fn search_emails(&self, filter: EmailFilter) -> Result<Vec<Email>> {
        self.db.search_emails(&filter)
    }

    pub fn mark_email_as_read(&self, id: &str) -> Result<()> {
        if let Some(mut email) = self.db.get_email_by_id(id)? {
            email.mark_as_read();
            self.db.update_email(&email)?;
        }
        Ok(())
    }

    pub fn mark_email_as_important(&self, id: &str) -> Result<()> {
        if let Some(mut email) = self.db.get_email_by_id(id)? {
            email.mark_as_important();
            self.db.update_email(&email)?;
        }
        Ok(())
    }

    pub fn update_email_category(&self, id: &str, category: String) -> Result<()> {
        if let Some(mut email) = self.db.get_email_by_id(id)? {
            email.update_category(category);
            self.db.update_email(&email)?;
        }
        Ok(())
    }

    pub fn delete_email(&self, id: &str) -> Result<()> {
        self.db.delete_email(id)
    }

    pub fn get_categories(&self) -> Result<Vec<String>> {
        self.db.get_categories()
    }

    pub fn get_statistics(&self) -> Result<EmailStatistics> {
        let total_count = self.db.get_email_count()?;
        let unread_count = self.db.get_unread_count()?;
        let read_count = total_count - unread_count;

        // 获取重要邮件数量
        let important_filter = EmailFilter {
            is_important: Some(true),
            ..Default::default()
        };
        let important_emails = self.db.search_emails(&important_filter)?;
        let important_count = important_emails.len();

        // 按分类统计
        let categories = self.db.get_categories()?;
        let mut category_counts = std::collections::HashMap::new();
        
        for category in categories {
            let filter = EmailFilter {
                category: Some(category.clone()),
                ..Default::default()
            };
            let emails = self.db.search_emails(&filter)?;
            category_counts.insert(category, emails.len());
        }

        Ok(EmailStatistics {
            total_count,
            read_count,
            unread_count,
            important_count,
            category_counts,
        })
    }

    // 批量操作功能
    pub fn batch_mark_as_read(&self, ids: &[String]) -> Result<()> {
        for id in ids {
            self.mark_email_as_read(id)?;
        }
        Ok(())
    }

    pub fn batch_mark_as_important(&self, ids: &[String]) -> Result<()> {
        for id in ids {
            self.mark_email_as_important(id)?;
        }
        Ok(())
    }

    pub fn batch_delete(&self, ids: &[String]) -> Result<()> {
        for id in ids {
            self.delete_email(id)?;
        }
        Ok(())
    }

    pub fn batch_update_category(&self, ids: &[String], category: String) -> Result<()> {
        for id in ids {
            self.update_email_category(id, category.clone())?;
        }
        Ok(())
    }

    // 邮件编辑功能
    pub fn update_email_content(&self, id: &str, subject: String, body: String) -> Result<()> {
        if let Some(mut email) = self.db.get_email_by_id(id)? {
            email.subject = subject;
            email.body = body;
            email.updated_at = chrono::Utc::now();
            self.db.update_email(&email)?;
        }
        Ok(())
    }

    // 高级搜索功能
    pub fn get_emails_by_sender(&self, sender: &str) -> Result<Vec<Email>> {
        let mut filter = EmailFilter::default();
        filter.sender = Some(sender.to_string());
        self.db.search_emails(&filter)
    }

    pub fn get_unread_emails(&self) -> Result<Vec<Email>> {
        let mut filter = EmailFilter::default();
        filter.is_read = Some(false);
        self.db.search_emails(&filter)
    }

    pub fn get_important_emails(&self) -> Result<Vec<Email>> {
        let mut filter = EmailFilter::default();
        filter.is_important = Some(true);
        self.db.search_emails(&filter)
    }

    // 邮件归档功能
    pub fn archive_email(&self, id: &str) -> Result<()> {
        if let Some(mut email) = self.db.get_email_by_id(id)? {
            // 注意：需要在 Email 模型中添加 is_archived 字段
            email.updated_at = chrono::Utc::now();
            self.db.update_email(&email)?;
        }
        Ok(())
    }

    pub fn batch_archive(&self, ids: &[String]) -> Result<()> {
        for id in ids {
            self.archive_email(id)?;
        }
        Ok(())
    }
}

#[derive(Debug)]
pub struct EmailStatistics {
    pub total_count: usize,
    pub read_count: usize,
    pub unread_count: usize,
    pub important_count: usize,
    pub category_counts: std::collections::HashMap<String, usize>,
}