use anyhow::Result;
use rusqlite::{params, Connection};
use crate::models::email_provider::{EmailProvider, EmailAccount, EmailCategory};

pub struct ProviderService<'a> {
    conn: &'a Connection,
}

impl<'a> ProviderService<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    // 邮件服务商管理
    pub fn get_all_providers(&self) -> Result<Vec<EmailProvider>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, provider_type, imap_server, imap_port, smtp_server, smtp_port, use_ssl, use_tls
             FROM email_providers ORDER BY name"
        )?;

        let provider_iter = stmt.query_map([], |row| {
            Ok(EmailProvider {
                id: row.get(0)?,
                name: row.get(1)?,
                provider_type: row.get(2)?,
                imap_server: row.get(3)?,
                imap_port: row.get(4)?,
                smtp_server: row.get(5)?,
                smtp_port: row.get(6)?,
                use_ssl: row.get(7)?,
                use_tls: row.get(8)?,
            })
        })?;

        let mut providers = Vec::new();
        for provider in provider_iter {
            providers.push(provider?);
        }
        Ok(providers)
    }

    pub fn get_provider_by_type(&self, provider_type: &str) -> Result<Option<EmailProvider>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, provider_type, imap_server, imap_port, smtp_server, smtp_port, use_ssl, use_tls
             FROM email_providers WHERE provider_type = ?1"
        )?;

        let provider_iter = stmt.query_map([provider_type], |row| {
            Ok(EmailProvider {
                id: row.get(0)?,
                name: row.get(1)?,
                provider_type: row.get(2)?,
                imap_server: row.get(3)?,
                imap_port: row.get(4)?,
                smtp_server: row.get(5)?,
                smtp_port: row.get(6)?,
                use_ssl: row.get(7)?,
                use_tls: row.get(8)?,
            })
        })?;

        for provider in provider_iter {
            return Ok(Some(provider?));
        }
        Ok(None)
    }

    // 邮件账户管理
    pub fn add_email_account(&self, account: &EmailAccount) -> Result<i64> {
        use crate::services::crypto_service::CryptoService;
        
        // 加密密码
        let encrypted_password = CryptoService::encrypt_password(&account.password);
        
        let result = self.conn.execute(
            "INSERT INTO email_accounts 
             (provider_id, email_address, display_name, username, password, is_active, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                account.provider_id,
                account.email_address,
                account.display_name,
                account.username,
                encrypted_password, // 存储加密后的密码
                account.is_active,
                chrono::Utc::now().to_rfc3339()
            ],
        )?;

        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_all_accounts(&self) -> Result<Vec<EmailAccount>> {
        use crate::services::crypto_service::CryptoService;
        
        let mut stmt = self.conn.prepare(
            "SELECT a.id, a.provider_id, a.email_address, a.display_name, a.username, 
                    a.password, a.is_active, a.last_sync, a.created_at
             FROM email_accounts a
             ORDER BY a.created_at DESC"
        )?;

        let account_iter = stmt.query_map([], |row| {
            let encrypted_password: String = row.get(5)?;
            let decrypted_password = CryptoService::decrypt_password(&encrypted_password)
                .unwrap_or_else(|_| "***".to_string()); // 解密失败时显示占位符
            
            Ok(EmailAccount {
                id: row.get(0)?,
                provider_id: row.get(1)?,
                email_address: row.get(2)?,
                display_name: row.get(3)?,
                username: row.get(4)?,
                password: decrypted_password,
                is_active: row.get(6)?,
                last_sync: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;

        let mut accounts = Vec::new();
        for account in account_iter {
            accounts.push(account?);
        }
        Ok(accounts)
    }

    pub fn get_active_accounts(&self) -> Result<Vec<EmailAccount>> {
        let mut stmt = self.conn.prepare(
            "SELECT a.id, a.provider_id, a.email_address, a.display_name, a.username, 
                    a.password, a.is_active, a.last_sync, a.created_at
             FROM email_accounts a
             WHERE a.is_active = 1
             ORDER BY a.created_at DESC"
        )?;

        let account_iter = stmt.query_map([], |row| {
            Ok(EmailAccount {
                id: row.get(0)?,
                provider_id: row.get(1)?,
                email_address: row.get(2)?,
                display_name: row.get(3)?,
                username: row.get(4)?,
                password: row.get(5)?,
                is_active: row.get(6)?,
                last_sync: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;

        let mut accounts = Vec::new();
        for account in account_iter {
            accounts.push(account?);
        }
        Ok(accounts)
    }

    pub fn update_account_sync_time(&self, account_id: i32) -> Result<()> {
        self.conn.execute(
            "UPDATE email_accounts SET last_sync = ?1 WHERE id = ?2",
            params![chrono::Utc::now().to_rfc3339(), account_id],
        )?;
        Ok(())
    }

    pub fn toggle_account_status(&self, account_id: i32) -> Result<()> {
        self.conn.execute(
            "UPDATE email_accounts SET is_active = NOT is_active WHERE id = ?1",
            params![account_id],
        )?;
        Ok(())
    }

    pub fn delete_account(&self, account_id: i32) -> Result<()> {
        self.conn.execute(
            "DELETE FROM email_accounts WHERE id = ?1",
            params![account_id],
        )?;
        Ok(())
    }

    // 邮件分类管理
    pub fn get_all_categories(&self) -> Result<Vec<EmailCategory>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, color, description, is_system, created_at
             FROM email_categories ORDER BY is_system DESC, name"
        )?;

        let category_iter = stmt.query_map([], |row| {
            Ok(EmailCategory {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                description: row.get(3)?,
                is_system: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        let mut categories = Vec::new();
        for category in category_iter {
            categories.push(category?);
        }
        Ok(categories)
    }

    pub fn add_custom_category(&self, name: &str, color: &str, description: Option<&str>) -> Result<i64> {
        let result = self.conn.execute(
            "INSERT INTO email_categories (name, color, description, is_system, created_at)
             VALUES (?1, ?2, ?3, 0, ?4)",
            params![
                name,
                color,
                description,
                chrono::Utc::now().to_rfc3339()
            ],
        )?;

        Ok(self.conn.last_insert_rowid())
    }

    pub fn delete_custom_category(&self, category_id: i32) -> Result<()> {
        // 只能删除非系统分类
        self.conn.execute(
            "DELETE FROM email_categories WHERE id = ?1 AND is_system = 0",
            params![category_id],
        )?;
        Ok(())
    }
}