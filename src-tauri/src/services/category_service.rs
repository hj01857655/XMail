use crate::database::Database;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub color: Option<String>,
    pub description: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl Category {
    pub fn new(name: String, parent_id: Option<String>) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            parent_id,
            color: None,
            description: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn set_color(&mut self, color: String) {
        self.color = Some(color);
        self.updated_at = chrono::Utc::now();
    }

    pub fn set_description(&mut self, description: String) {
        self.description = Some(description);
        self.updated_at = chrono::Utc::now();
    }
}

#[derive(Debug, Clone)]
pub struct CategoryTree {
    pub categories: Vec<CategoryNode>,
}

#[derive(Debug, Clone)]
pub struct CategoryNode {
    pub category: Category,
    pub children: Vec<CategoryNode>,
    pub email_count: usize,
}

pub struct CategoryService {
    db: Database,
}

impl CategoryService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// 创建新分类
    pub fn create_category(&self, name: String, parent_id: Option<String>) -> Result<String> {
        let category = Category::new(name, parent_id);
        let id = category.id.clone();
        
        // 这里需要在数据库中实现分类表的操作
        // 暂时返回 ID，实际实现需要数据库支持
        Ok(id)
    }

    /// 获取所有分类
    pub fn get_all_categories(&self) -> Result<Vec<Category>> {
        // 从邮件中提取所有使用过的分类
        let emails = self.db.get_all_emails()?;
        let mut categories = HashMap::new();
        
        for email in emails {
            if !categories.contains_key(&email.category) {
                let category = Category::new(email.category.clone(), None);
                categories.insert(email.category.clone(), category);
            }
        }
        
        Ok(categories.into_values().collect())
    }

    /// 获取分类树
    pub fn get_category_tree(&self) -> Result<CategoryTree> {
        let categories = self.get_all_categories()?;
        let emails = self.db.get_all_emails()?;
        
        // 计算每个分类的邮件数量
        let mut category_counts = HashMap::new();
        for email in emails {
            *category_counts.entry(email.category).or_insert(0) += 1;
        }
        
        // 构建分类节点
        let nodes: Vec<CategoryNode> = categories
            .into_iter()
            .map(|category| {
                let email_count = category_counts.get(&category.name).unwrap_or(&0);
                CategoryNode {
                    category,
                    children: Vec::new(), // 暂时不支持层级结构
                    email_count: *email_count,
                }
            })
            .collect();
        
        Ok(CategoryTree { categories: nodes })
    }

    /// 更新分类
    pub fn update_category(&self, _id: &str, _name: String) -> Result<()> {
        // 需要数据库支持分类表
        // 暂时不实现
        Ok(())
    }

    /// 删除分类
    pub fn delete_category(&self, _id: &str) -> Result<()> {
        // 需要数据库支持分类表
        // 暂时不实现
        Ok(())
    }

    /// 移动分类
    pub fn move_category(&self, _id: &str, _new_parent_id: Option<String>) -> Result<()> {
        // 需要数据库支持分类表
        // 暂时不实现
        Ok(())
    }

    /// 获取分类统计信息
    pub fn get_category_statistics(&self) -> Result<HashMap<String, usize>> {
        let emails = self.db.get_all_emails()?;
        let mut stats = HashMap::new();
        
        for email in emails {
            *stats.entry(email.category).or_insert(0) += 1;
        }
        
        Ok(stats)
    }

    /// 重命名分类（更新所有使用该分类的邮件）
    pub fn rename_category(&self, old_name: &str, new_name: String) -> Result<()> {
        let emails = self.db.get_all_emails()?;
        
        for mut email in emails {
            if email.category == old_name {
                email.category = new_name.clone();
                email.updated_at = chrono::Utc::now();
                self.db.update_email(&email)?;
            }
        }
        
        Ok(())
    }

    /// 合并分类
    pub fn merge_categories(&self, source_category: &str, target_category: &str) -> Result<()> {
        let emails = self.db.get_all_emails()?;
        
        for mut email in emails {
            if email.category == source_category {
                email.category = target_category.to_string();
                email.updated_at = chrono::Utc::now();
                self.db.update_email(&email)?;
            }
        }
        
        Ok(())
    }

    /// 获取未分类的邮件数量
    pub fn get_uncategorized_count(&self) -> Result<usize> {
        let emails = self.db.get_all_emails()?;
        let count = emails
            .iter()
            .filter(|email| email.category.is_empty() || email.category == "未分类")
            .count();
        
        Ok(count)
    }

    /// 自动分类建议（基于发件人）
    pub fn suggest_category_by_sender(&self, sender: &str) -> Result<Option<String>> {
        let emails = self.db.get_all_emails()?;
        let mut category_counts = HashMap::new();
        
        // 统计该发件人的邮件分类
        for email in emails {
            if email.sender == sender && !email.category.is_empty() {
                *category_counts.entry(email.category).or_insert(0) += 1;
            }
        }
        
        // 返回最常用的分类
        let most_common = category_counts
            .into_iter()
            .max_by_key(|(_, count)| *count)
            .map(|(category, _)| category);
        
        Ok(most_common)
    }

    /// 获取热门分类（按邮件数量排序）
    pub fn get_popular_categories(&self, limit: usize) -> Result<Vec<(String, usize)>> {
        let stats = self.get_category_statistics()?;
        let mut categories: Vec<(String, usize)> = stats.into_iter().collect();
        
        categories.sort_by(|a, b| b.1.cmp(&a.1));
        categories.truncate(limit);
        
        Ok(categories)
    }
}
