use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Email {
    pub id: String,
    pub sender: String,
    pub recipient: String,
    pub subject: String,
    pub body: String,
    pub category: String,
    pub is_read: bool,
    pub is_important: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Email {
    pub fn new(
        sender: String,
        recipient: String,
        subject: String,
        body: String,
        category: String,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            sender,
            recipient,
            subject,
            body,
            category,
            is_read: false,
            is_important: false,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn mark_as_read(&mut self) {
        self.is_read = true;
        self.updated_at = Utc::now();
    }

    #[allow(dead_code)]
    pub fn mark_as_important(&mut self) {
        self.is_important = true;
        self.updated_at = Utc::now();
    }

    pub fn update_category(&mut self, category: String) {
        self.category = category;
        self.updated_at = Utc::now();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailFilter {
    pub sender: Option<String>,
    pub recipient: Option<String>,
    pub category: Option<String>,
    pub is_read: Option<bool>,
    pub is_important: Option<bool>,
    pub keyword: Option<String>,
}

impl Default for EmailFilter {
    fn default() -> Self {
        Self {
            sender: None,
            recipient: None,
            category: None,
            is_read: None,
            is_important: None,
            keyword: None,
        }
    }
}

impl EmailFilter {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn category(mut self, category: String) -> Self {
        self.category = Some(category);
        self
    }

    pub fn keyword(mut self, keyword: String) -> Self {
        self.keyword = Some(keyword);
        self
    }

    pub fn unread_only(mut self) -> Self {
        self.is_read = Some(false);
        self
    }

    pub fn important_only(mut self) -> Self {
        self.is_important = Some(true);
        self
    }

    pub fn matches(&self, email: &Email) -> bool {
        // 发件人过滤
        if let Some(sender) = &self.sender {
            if !email.sender.contains(sender) {
                return false;
            }
        }

        // 收件人过滤
        if let Some(recipient) = &self.recipient {
            if !email.recipient.contains(recipient) {
                return false;
            }
        }

        // 分类过滤
        if let Some(category) = &self.category {
            if email.category != *category {
                return false;
            }
        }

        // 已读状态过滤
        if let Some(is_read) = self.is_read {
            if email.is_read != is_read {
                return false;
            }
        }

        // 重要状态过滤
        if let Some(is_important) = self.is_important {
            if email.is_important != is_important {
                return false;
            }
        }

        // 关键词过滤
        if let Some(keyword) = &self.keyword {
            let keyword_lower = keyword.to_lowercase();
            if !email.subject.to_lowercase().contains(&keyword_lower)
                && !email.body.to_lowercase().contains(&keyword_lower)
                && !email.sender.to_lowercase().contains(&keyword_lower)
                && !email.recipient.to_lowercase().contains(&keyword_lower)
            {
                return false;
            }
        }

        true
    }
}