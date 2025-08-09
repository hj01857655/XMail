use crate::database::Database;
use crate::models::email::{Email, EmailFilter};
use anyhow::Result;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SearchField {
    Subject,
    Body,
    Sender,
    Recipient,
    All,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvancedSearchCriteria {
    pub query: String,
    pub field: SearchField,
    pub use_regex: bool,
    pub case_sensitive: bool,
    pub filter: EmailFilter,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedSearch {
    pub id: String,
    pub name: String,
    pub criteria: AdvancedSearchCriteria,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub struct SearchResult {
    pub emails: Vec<Email>,
    pub total_count: usize,
    pub search_time_ms: u128,
    pub highlights: HashMap<String, Vec<String>>, // email_id -> highlighted_snippets
}

pub struct SearchService {
    db: Database,
    saved_searches: Vec<SavedSearch>, // 在实际应用中应该持久化到数据库
}

impl SearchService {
    pub fn new(db: Database) -> Result<Self> {
        Ok(Self {
            db,
            saved_searches: Vec::new(),
        })
    }

    /// 全文搜索
    pub fn full_text_search(&self, query: &str) -> Result<Vec<Email>> {
        let _start_time = std::time::Instant::now();
        let emails = self.db.get_all_emails()?;
        let query_lower = query.to_lowercase();
        
        let results: Vec<Email> = emails
            .into_iter()
            .filter(|email| {
                email.subject.to_lowercase().contains(&query_lower)
                    || email.body.to_lowercase().contains(&query_lower)
                    || email.sender.to_lowercase().contains(&query_lower)
                    || email.recipient.to_lowercase().contains(&query_lower)
                    || email.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
            })
            .collect();
        
        Ok(results)
    }

    /// 正则表达式搜索
    pub fn regex_search(&self, pattern: &str, field: SearchField) -> Result<Vec<Email>> {
        let regex = Regex::new(pattern).map_err(|e| anyhow::anyhow!("正则表达式错误: {}", e))?;
        let emails = self.db.get_all_emails()?;
        
        let results: Vec<Email> = emails
            .into_iter()
            .filter(|email| {
                match field {
                    SearchField::Subject => regex.is_match(&email.subject),
                    SearchField::Body => regex.is_match(&email.body),
                    SearchField::Sender => regex.is_match(&email.sender),
                    SearchField::Recipient => regex.is_match(&email.recipient),
                    SearchField::All => {
                        regex.is_match(&email.subject)
                            || regex.is_match(&email.body)
                            || regex.is_match(&email.sender)
                            || regex.is_match(&email.recipient)
                    }
                }
            })
            .collect();
        
        Ok(results)
    }

    /// 高级搜索
    pub fn advanced_search(&self, criteria: AdvancedSearchCriteria) -> Result<SearchResult> {
        let start_time = std::time::Instant::now();
        let mut emails = self.db.get_all_emails()?;
        
        // 首先应用过滤器
        emails.retain(|email| criteria.filter.matches(email));
        
        // 然后应用搜索查询
        if !criteria.query.is_empty() {
            if criteria.use_regex {
                let regex = if criteria.case_sensitive {
                    Regex::new(&criteria.query)
                } else {
                    Regex::new(&format!("(?i){}", criteria.query))
                }
                .map_err(|e| anyhow::anyhow!("正则表达式错误: {}", e))?;
                
                emails.retain(|email| {
                    match criteria.field {
                        SearchField::Subject => regex.is_match(&email.subject),
                        SearchField::Body => regex.is_match(&email.body),
                        SearchField::Sender => regex.is_match(&email.sender),
                        SearchField::Recipient => regex.is_match(&email.recipient),
                        SearchField::All => {
                            regex.is_match(&email.subject)
                                || regex.is_match(&email.body)
                                || regex.is_match(&email.sender)
                                || regex.is_match(&email.recipient)
                        }
                    }
                });
            } else {
                let query = if criteria.case_sensitive {
                    criteria.query.clone()
                } else {
                    criteria.query.to_lowercase()
                };
                
                emails.retain(|email| {
                    let subject = if criteria.case_sensitive { email.subject.clone() } else { email.subject.to_lowercase() };
                    let body = if criteria.case_sensitive { email.body.clone() } else { email.body.to_lowercase() };
                    let sender = if criteria.case_sensitive { email.sender.clone() } else { email.sender.to_lowercase() };
                    let recipient = if criteria.case_sensitive { email.recipient.clone() } else { email.recipient.to_lowercase() };
                    
                    match criteria.field {
                        SearchField::Subject => subject.contains(&query),
                        SearchField::Body => body.contains(&query),
                        SearchField::Sender => sender.contains(&query),
                        SearchField::Recipient => recipient.contains(&query),
                        SearchField::All => {
                            subject.contains(&query)
                                || body.contains(&query)
                                || sender.contains(&query)
                                || recipient.contains(&query)
                        }
                    }
                });
            }
        }
        
        let search_time = start_time.elapsed().as_millis();
        let total_count = emails.len();
        
        // 生成高亮信息
        let highlights = self.generate_highlights(&emails, &criteria.query, &criteria.field);
        
        Ok(SearchResult {
            emails,
            total_count,
            search_time_ms: search_time,
            highlights,
        })
    }

    /// 保存搜索条件
    pub fn save_search(&mut self, name: String, criteria: AdvancedSearchCriteria) -> Result<String> {
        let saved_search = SavedSearch {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            criteria,
            created_at: chrono::Utc::now(),
        };
        
        let id = saved_search.id.clone();
        self.saved_searches.push(saved_search);
        
        Ok(id)
    }

    /// 获取保存的搜索
    pub fn get_saved_searches(&self) -> Result<Vec<SavedSearch>> {
        Ok(self.saved_searches.clone())
    }

    /// 删除保存的搜索
    pub fn delete_saved_search(&mut self, id: &str) -> Result<()> {
        self.saved_searches.retain(|search| search.id != id);
        Ok(())
    }

    /// 执行保存的搜索
    pub fn execute_saved_search(&self, id: &str) -> Result<SearchResult> {
        let saved_search = self.saved_searches
            .iter()
            .find(|search| search.id == id)
            .ok_or_else(|| anyhow::anyhow!("未找到保存的搜索"))?;
        
        self.advanced_search(saved_search.criteria.clone())
    }

    /// 搜索建议
    pub fn get_search_suggestions(&self, partial_query: &str) -> Result<Vec<String>> {
        let emails = self.db.get_all_emails()?;
        let mut suggestions = std::collections::HashSet::new();
        let partial_lower = partial_query.to_lowercase();
        
        for email in emails {
            // 从主题中提取建议
            for word in email.subject.split_whitespace() {
                if word.to_lowercase().starts_with(&partial_lower) && word.len() > partial_query.len() {
                    suggestions.insert(word.to_string());
                }
            }
            
            // 从发件人中提取建议
            if email.sender.to_lowercase().starts_with(&partial_lower) {
                suggestions.insert(email.sender.clone());
            }
            
            // 从分类中提取建议
            if email.category.to_lowercase().starts_with(&partial_lower) {
                suggestions.insert(email.category.clone());
            }
            
            // 从标签中提取建议
            for tag in &email.tags {
                if tag.to_lowercase().starts_with(&partial_lower) {
                    suggestions.insert(tag.clone());
                }
            }
        }
        
        let mut result: Vec<String> = suggestions.into_iter().collect();
        result.sort();
        result.truncate(10); // 限制建议数量
        
        Ok(result)
    }

    /// 重建搜索索引（预留接口）
    pub fn rebuild_index(&self) -> Result<()> {
        // 在实际应用中，这里会重建全文搜索索引
        // 目前使用简单的线性搜索，所以不需要索引
        Ok(())
    }

    /// 搜索统计
    pub fn get_search_statistics(&self) -> Result<HashMap<String, usize>> {
        let emails = self.db.get_all_emails()?;
        let mut stats = HashMap::new();
        
        // 统计各种字段的数据
        stats.insert("total_emails".to_string(), emails.len());
        stats.insert("unique_senders".to_string(), 
            emails.iter().map(|e| &e.sender).collect::<std::collections::HashSet<_>>().len());
        stats.insert("unique_categories".to_string(), 
            emails.iter().map(|e| &e.category).collect::<std::collections::HashSet<_>>().len());
        stats.insert("total_tags".to_string(), 
            emails.iter().flat_map(|e| &e.tags).collect::<std::collections::HashSet<_>>().len());
        
        Ok(stats)
    }

    /// 生成搜索高亮
    fn generate_highlights(&self, emails: &[Email], query: &str, field: &SearchField) -> HashMap<String, Vec<String>> {
        let mut highlights = HashMap::new();
        
        if query.is_empty() {
            return highlights;
        }
        
        for email in emails {
            let mut snippets = Vec::new();
            let query_lower = query.to_lowercase();
            
            match field {
                SearchField::Subject => {
                    if email.subject.to_lowercase().contains(&query_lower) {
                        snippets.push(self.highlight_text(&email.subject, query));
                    }
                }
                SearchField::Body => {
                    if email.body.to_lowercase().contains(&query_lower) {
                        snippets.push(self.highlight_text(&email.body, query));
                    }
                }
                SearchField::Sender => {
                    if email.sender.to_lowercase().contains(&query_lower) {
                        snippets.push(self.highlight_text(&email.sender, query));
                    }
                }
                SearchField::Recipient => {
                    if email.recipient.to_lowercase().contains(&query_lower) {
                        snippets.push(self.highlight_text(&email.recipient, query));
                    }
                }
                SearchField::All => {
                    if email.subject.to_lowercase().contains(&query_lower) {
                        snippets.push(format!("主题: {}", self.highlight_text(&email.subject, query)));
                    }
                    if email.body.to_lowercase().contains(&query_lower) {
                        snippets.push(format!("内容: {}", self.highlight_text(&email.body, query)));
                    }
                    if email.sender.to_lowercase().contains(&query_lower) {
                        snippets.push(format!("发件人: {}", self.highlight_text(&email.sender, query)));
                    }
                }
            }
            
            if !snippets.is_empty() {
                highlights.insert(email.id.clone(), snippets);
            }
        }
        
        highlights
    }

    /// 高亮文本中的匹配部分
    fn highlight_text(&self, text: &str, query: &str) -> String {
        // 简单的高亮实现，在实际应用中可以使用更复杂的算法
        let query_lower = query.to_lowercase();
        let text_lower = text.to_lowercase();
        
        if let Some(pos) = text_lower.find(&query_lower) {
            let start = pos.saturating_sub(20);
            let end = (pos + query.len() + 20).min(text.len());
            let snippet = &text[start..end];
            
            // 用 ** 标记高亮部分（在 GUI 中可以用不同颜色显示）
            snippet.replace(query, &format!("**{}**", query))
        } else {
            text.to_string()
        }
    }
}
