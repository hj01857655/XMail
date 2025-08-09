// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod services;
mod database;

use commands::email::*;
use services::EmailService;
use std::sync::Mutex;

fn main() {
    // 初始化邮件服务
    let email_service = EmailService::new("emails.db")
        .expect("Failed to initialize email service");

    tauri::Builder::default()
        .manage(Mutex::new(email_service))
        .invoke_handler(tauri::generate_handler![
            get_all_emails,
            create_email,
            search_emails,
            get_email,
            mark_email_as_read,
            mark_email_as_important,
            delete_email,
            get_categories,
            get_statistics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}