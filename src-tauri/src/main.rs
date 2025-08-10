// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod services;
mod database;

use commands::email::*;
use commands::provider::*;
use database::connection::Database;
use std::sync::Mutex;

fn main() {
    // 初始化数据库
    let database = Database::new("emails.db")
        .expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(Mutex::new(database))
        .invoke_handler(tauri::generate_handler![
            // 邮件相关命令
            get_all_emails,
            create_email,
            search_emails,
            get_email,
            mark_email_as_read,
            mark_email_as_important,
            delete_email,
            get_categories,
            get_statistics,
            // 邮件服务商和账户相关命令
            get_email_providers,
            add_email_account,
            get_email_accounts,
            test_email_connection,
            sync_account_emails,
            toggle_account_status,
            delete_email_account,
            get_email_categories,
            add_email_category,
            delete_email_category
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}