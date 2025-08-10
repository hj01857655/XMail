use crate::database::connection::Database;
use crate::models::email_provider::{EmailProvider, EmailAccount, EmailCategory};
use crate::services::provider_service::ProviderService;
use crate::services::sync_service::{EmailSyncService, SyncManager};
use anyhow::Result;
use tauri::State;
use std::sync::Mutex;

#[tauri::command]
pub async fn get_email_providers(
    db: State<'_, Mutex<Database>>
) -> Result<Vec<EmailProvider>, String> {
    let db = db.lock().unwrap();
    let service = ProviderService::new(&db.conn);
    
    service.get_all_providers()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_email_account(
    provider_id: i32,
    email_address: String,
    display_name: String,
    username: String,
    password: String,
    db: State<'_, Mutex<Database>>
) -> Result<i64, String> {
    let db = db.lock().unwrap();
    let service = ProviderService::new(&db.conn);
    
    let account = EmailAccount {
        id: 0, // 将由数据库自动生成
        provider_id,
        email_address,
        display_name,
        username,
        password,
        is_active: true,
        last_sync: None,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    
    service.add_email_account(&account)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_email_accounts(
    db: State<'_, Mutex<Database>>
) -> Result<Vec<EmailAccount>, String> {
    let db = db.lock().unwrap();
    let service = ProviderService::new(&db.conn);
    
    service.get_all_accounts()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_email_connection(
    provider_id: i32,
    username: String,
    password: String,
    db: State<'_, Mutex<Database>>
) -> Result<bool, String> {
    let db = db.lock().unwrap();
    let service = ProviderService::new(&db.conn);
    
    // 获取服务商信息
    let providers = service.get_all_providers().map_err(|e| e.to_string())?;
    let provider = providers.into_iter()
        .find(|p| p.id == provider_id)
        .ok_or("未找到邮件服务商")?;
    
    // 创建临时账户用于测试
    let test_account = EmailAccount {
        id: 0,
        provider_id,
        email_address: username.clone(),
        display_name: "Test".to_string(),
        username,
        password,
        is_active: true,
        last_sync: None,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    
    let sync_service = EmailSyncService::new(provider, test_account);
    sync_service.test_connection().await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn sync_account_emails(
    account_id: i32,
    db: State<'_, Mutex<Database>>
) -> Result<Vec<crate::models::email::Email>, String> {
    let db = db.lock().unwrap();
    let service = ProviderService::new(&db.conn);
    
    // 获取账户信息
    let accounts = service.get_all_accounts().map_err(|e| e.to_string())?;
    let account = accounts.into_iter()
        .find(|a| a.id == account_id)
        .ok_or("未找到邮件账户")?;
    
    // 获取服务商信息
    let providers = service.get_all_providers().map_err(|e| e.to_string())?;
    let provider = providers.into_iter()
        .find(|p| p.id == account.provider_id)
        .ok_or("未找到邮件服务商")?;
    
    // 同步邮件
    let sync_manager = SyncManager::new();
    let emails = sync_manager.sync_account_emails(provider, account)
        .await
        .map_err(|e| e.to_string())?;
    
    // 更新同步时间
    service.update_account_sync_time(account_id)
        .map_err(|e| e.to_string())?;
    
    Ok(emails)
}

#[tauri::command]
pub async fn toggle_account_status(
    account_id: i32,
    db: State<'_, Mutex<Database>>
) -> Result<(), String> {
    let db = db.lock().unwrap();
    let service = ProviderService::new(&db.conn);
    
    service.toggle_account_status(account_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_email_account(
    account_id: i32,
    db: State<'_, Mutex<Database>>
) -> Result<(), String> {
    let db = db.lock().unwrap();
    let service = ProviderService::new(&db.conn);
    
    service.delete_account(account_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_email_categories(
    db: State<'_, Mutex<Database>>
) -> Result<Vec<EmailCategory>, String> {
    let db = db.lock().unwrap();
    let service = ProviderService::new(&db.conn);
    
    service.get_all_categories()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_email_category(
    name: String,
    color: String,
    description: Option<String>,
    db: State<'_, Mutex<Database>>
) -> Result<i64, String> {
    let db = db.lock().unwrap();
    let service = ProviderService::new(&db.conn);
    
    service.add_custom_category(&name, &color, description.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_email_category(
    category_id: i32,
    db: State<'_, Mutex<Database>>
) -> Result<(), String> {
    let db = db.lock().unwrap();
    let service = ProviderService::new(&db.conn);
    
    service.delete_custom_category(category_id)
        .map_err(|e| e.to_string())
}