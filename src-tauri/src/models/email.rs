use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Priority {
    Low,
    Normal,
    High,
    Urgent,
}

impl Default for Priority {
    fn default() -> Self {
        Priority::Normal
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EmailStatus {
    Draft,
    Sent,
    Received,
    Failed,
    Archived,
}

impl Default for EmailStatus {
    fn default() -> Self {
        EmailStatus::Received
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Email {
    pub id: String,
    pub sender: String,
    pub recipient: String,
    pub cc: Vec<String>,           // 抄送
    pub bcc: Vec<String>,          // 密送
    pub subject: String,
    pub body: String,
    pub html_body: Option<String>, // HTML 格式内容
    pub category: String,
    pub tags: Vec<String>,         // 标签
    pub priority: Priority,        // 优先级
    pub status: EmailStatus,       // 状态
    pub attachments: Vec<String>,  // 附件 ID 列表
    pub is_read: bool,
    pub is_important: bool,
    pub is_archived: bool,         // 归档状态
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
            cc: Vec::new(),
            bcc: Vec::new(),
            subject,
            body,
            html_body: None,
            category,
            tags: Vec::new(),
            priority: Priority::default(),
            status: EmailStatus::default(),
            attachments: Vec::new(),
            is_read: false,
            is_important: false,
            is_archived: false,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn mark_as_read(&mut self) {
        self.is_read = true;
        self.updated_at = Utc::now();
    }

    pub fn mark_as_important(&mut self) {
        self.is_important = true;
        self.updated_at = Utc::now();
    }

    pub fn update_category(&mut self, category: String) {
        self.category = category;
        self.updated_at = Utc::now();
    }

    // 验证邮件数据
    pub fn validate(&self) -> Result<(), String> {
        if self.sender.is_empty() {
            return Err("发件人不能为空".to_string());
        }
        if self.recipient.is_empty() {
            return Err("收件人不能为空".to_string());
        }
        if self.subject.is_empty() {
            return Err("主题不能为空".to_string());
        }
        Ok(())
    }

    // 添加标签
    pub fn add_tag(&mut self, tag: String) {
        if !self.tags.contains(&tag) {
            self.tags.push(tag);
            self.updated_at = Utc::now();
        }
    }

    // 移除标签
    pub fn remove_tag(&mut self, tag: &str) {
        if let Some(pos) = self.tags.iter().position(|x| x == tag) {
            self.tags.remove(pos);
            self.updated_at = Utc::now();
        }
    }

    // 添加附件
    pub fn add_attachment(&mut self, attachment_id: String) {
        if !self.attachments.contains(&attachment_id) {
            self.attachments.push(attachment_id);
            self.updated_at = Utc::now();
        }
    }

    // 移除附件
    pub fn remove_attachment(&mut self, attachment_id: &str) {
        if let Some(pos) = self.attachments.iter().position(|x| x == attachment_id) {
            self.attachments.remove(pos);
            self.updated_at = Utc::now();
        }
    }

    // 归档邮件
    pub fn archive(&mut self) {
        self.is_archived = true;
        self.updated_at = Utc::now();
    }

    // 取消归档
    pub fn unarchive(&mut self) {
        self.is_archived = false;
        self.updated_at = Utc::now();
    }

    // 设置优先级
    pub fn set_priority(&mut self, priority: Priority) {
        self.priority = priority;
        self.updated_at = Utc::now();
    }

    // 设置状态
    pub fn set_status(&mut self, status: EmailStatus) {
        self.status = status;
        self.updated_at = Utc::now();
    }

    // 添加抄送
    pub fn add_cc(&mut self, email: String) {
        if !self.cc.contains(&email) {
            self.cc.push(email);
            self.updated_at = Utc::now();
        }
    }

    // 添加密送
    pub fn add_bcc(&mut self, email: String) {
        if !self.bcc.contains(&email) {
            self.bcc.push(email);
            self.updated_at = Utc::now();
        }
    }

    // 设置 HTML 内容
    pub fn set_html_body(&mut self, html_body: String) {
        self.html_body = Some(html_body);
        self.updated_at = Utc::now();
    }

    // 检查是否有附件
    pub fn has_attachments(&self) -> bool {
        !self.attachments.is_empty()
    }

    // 获取标签数量
    pub fn tag_count(&self) -> usize {
        self.tags.len()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailFilter {
    pub sender: Option<String>,
    pub recipient: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub priority: Option<Priority>,
    pub status: Option<EmailStatus>,
    pub is_read: Option<bool>,
    pub is_important: Option<bool>,
    pub is_archived: Option<bool>,
    pub keyword: Option<String>,
    pub date_range: Option<(DateTime<Utc>, DateTime<Utc>)>,
    pub has_attachments: Option<bool>,
}

impl Default for EmailFilter {
    fn default() -> Self {
        Self {
            sender: None,
            recipient: None,
            category: None,
            tags: None,
            priority: None,
            status: None,
            is_read: None,
            is_important: None,
            is_archived: None,
            keyword: None,
            date_range: None,
            has_attachments: None,
        }
    }
}

impl EmailFilter {
    pub fn new() -> Self {
        Self::default()
    }

    // 构建器模式方法
    pub fn sender(mut self, sender: String) -> Self {
        self.sender = Some(sender);
        self
    }

    pub fn recipient(mut self, recipient: String) -> Self {
        self.recipient = Some(recipient);
        self
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

    pub fn read_only(mut self) -> Self {
        self.is_read = Some(true);
        self
    }

    pub fn important_only(mut self) -> Self {
        self.is_important = Some(true);
        self
    }

    pub fn archived_only(mut self) -> Self {
        self.is_archived = Some(true);
        self
    }

    pub fn not_archived(mut self) -> Self {
        self.is_archived = Some(false);
        self
    }

    pub fn with_priority(mut self, priority: Priority) -> Self {
        self.priority = Some(priority);
        self
    }

    pub fn with_status(mut self, status: EmailStatus) -> Self {
        self.status = Some(status);
        self
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = Some(tags);
        self
    }

    pub fn with_attachments(mut self) -> Self {
        self.has_attachments = Some(true);
        self
    }

    pub fn without_attachments(mut self) -> Self {
        self.has_attachments = Some(false);
        self
    }

    pub fn date_range(mut self, start: DateTime<Utc>, end: DateTime<Utc>) -> Self {
        self.date_range = Some((start, end));
        self
    }

    // 验证过滤条件
    pub fn validate(&self) -> Result<(), String> {
        if let Some((start, end)) = &self.date_range {
            if start > end {
                return Err("开始日期不能晚于结束日期".to_string());
            }
        }
        Ok(())
    }

    // 检查邮件是否匹配过滤条件
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

        // 归档状态过滤
        if let Some(is_archived) = self.is_archived {
            if email.is_archived != is_archived {
                return false;
            }
        }

        // 优先级过滤
        if let Some(priority) = &self.priority {
            if email.priority != *priority {
                return false;
            }
        }

        // 状态过滤
        if let Some(status) = &self.status {
            if email.status != *status {
                return false;
            }
        }

        // 附件过滤
        if let Some(has_attachments) = self.has_attachments {
            if email.has_attachments() != has_attachments {
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

        // 标签过滤
        if let Some(tags) = &self.tags {
            if !tags.iter().any(|tag| email.tags.contains(tag)) {
                return false;
            }
        }

        // 日期范围过滤
        if let Some((start, end)) = &self.date_range {
            if email.created_at < *start || email.created_at > *end {
                return false;
            }
        }

        true
    }
}