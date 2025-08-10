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
    db: State<'_, Mutex<Database>>,
    keyword: Option<String>,
    category: Option<String>,
    unread_only: Option<bool>,
    important_only: Option<bool>,
) -> Result<Vec<Email>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    
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
    
    db.search_emails(&filter).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_email(
    db: State<'_, Mutex<Database>>,
    id: String,
) -> Result<Option<Email>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_email_by_id(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mark_email_as_read(
    db: State<'_, Mutex<Database>>,
    id: String,
) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    
    if let Some(mut email) = db.get_email_by_id(&id).map_err(|e| e.to_string())? {
        email.is_read = true;
        email.updated_at = chrono::Utc::now();
        db.update_email(&email).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn mark_email_as_important(
    db: State<'_, Mutex<Database>>,
    id: String,
) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    
    if let Some(mut email) = db.get_email_by_id(&id).map_err(|e| e.to_string())? {
        email.is_important = !email.is_important;
        email.updated_at = chrono::Utc::now();
        db.update_email(&email).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn delete_email(
    db: State<'_, Mutex<Database>>,
    id: String,
) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.delete_email(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_categories(
    db: State<'_, Mutex<Database>>
) -> Result<Vec<String>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_categories().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_statistics(
    db: State<'_, Mutex<Database>>
) -> Result<serde_json::Value, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    
    let total_count = db.get_email_count().map_err(|e| e.to_string())?;
    let unread_count = db.get_unread_count().map_err(|e| e.to_string())?;
    let important_count = db.get_important_count().map_err(|e| e.to_string())?;
    
    let json = serde_json::json!({
        "total_count": total_count,
        "unread_count": unread_count,
        "important_count": important_count
    });
    
    Ok(json)
}