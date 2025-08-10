use crate::database::connection::Database;
use crate::models::email::{Email, EmailFilter};
use tauri::State;
use std::sync::Mutex;

#[tauri::command]
pub async fn get_all_emails(
    db: State<'_, Mutex<Database>>
) -> Result<Vec<Email>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_all_emails().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_email(
    db: State<'_, Mutex<Database>>,
    sender: String,
    recipient: String,
    subject: String,
    body: String,
    category: String,
) -> Result<String, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    
    let email = Email {
        id: uuid::Uuid::new_v4().to_string(),
        sender,
        recipient,
        subject,
        body,
        category,
        is_read: false,
        is_important: false,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    db.insert_email(&email).map_err(|e| e.to_string())?;
    Ok(email.id)
}

#[tauri::command]
pub async fn search_emails(
    service: State<'_, Mutex<EmailService>>,
    keyword: Option<String>,
    category: Option<String>,
    unread_only: Option<bool>,
    important_only: Option<bool>,
) -> Result<Vec<Email>, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    
    let mut filter = EmailFilter::new();
    
    if let Some(kw) = keyword {
        filter = filter.keyword(kw);
    }
    if let Some(cat) = category {
        filter = filter.category(cat);
    }
    if let Some(true) = unread_only {
        filter = filter.unread_only();
    }
    if let Some(true) = important_only {
        filter = filter.important_only();
    }
    
    service.search_emails(filter).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_email(
    service: State<'_, Mutex<EmailService>>,
    id: String,
) -> Result<Option<Email>, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.get_email(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mark_email_as_read(
    service: State<'_, Mutex<EmailService>>,
    id: String,
) -> Result<(), String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.mark_email_as_read(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mark_email_as_important(
    service: State<'_, Mutex<EmailService>>,
    id: String,
) -> Result<(), String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.mark_email_as_important(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_email(
    service: State<'_, Mutex<EmailService>>,
    id: String,
) -> Result<(), String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.delete_email(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_categories(
    service: State<'_, Mutex<EmailService>>
) -> Result<Vec<String>, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    service.get_categories().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_statistics(
    service: State<'_, Mutex<EmailService>>
) -> Result<serde_json::Value, String> {
    let service = service.lock().map_err(|e| e.to_string())?;
    let stats = service.get_statistics().map_err(|e| e.to_string())?;
    
    let json = serde_json::json!({
        "total_count": stats.total_count,
        "read_count": stats.read_count,
        "unread_count": stats.unread_count,
        "important_count": stats.important_count,
        "category_counts": stats.category_counts
    });
    
    Ok(json)
}