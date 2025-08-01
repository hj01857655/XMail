-- MySQL 版本的数据库表结构

-- 创建数据库
CREATE DATABASE IF NOT EXISTS email_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE email_manager;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 邮箱账户表
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  imap_host VARCHAR(255) NOT NULL,
  imap_port INT NOT NULL,
  imap_secure BOOLEAN NOT NULL DEFAULT TRUE,
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INT NOT NULL,
  smtp_secure BOOLEAN NOT NULL DEFAULT TRUE,
  username VARCHAR(255) NOT NULL,
  password_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 文件夹表
CREATE TABLE IF NOT EXISTS folders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('inbox', 'sent', 'drafts', 'trash', 'custom') NOT NULL,
  parent_id VARCHAR(36) NULL,
  color VARCHAR(7),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- 邮件表
CREATE TABLE IF NOT EXISTS emails (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_id VARCHAR(36) NOT NULL,
  folder_id VARCHAR(36) NOT NULL,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  thread_id VARCHAR(255),
  subject TEXT,
  from_address JSON NOT NULL,
  to_addresses JSON NOT NULL,
  cc_addresses JSON,
  bcc_addresses JSON,
  reply_to JSON,
  body_text LONGTEXT,
  body_html LONGTEXT,
  headers JSON,
  date_received TIMESTAMP NOT NULL,
  date_sent TIMESTAMP NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  has_attachments BOOLEAN DEFAULT FALSE,
  size_bytes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- 附件表
CREATE TABLE IF NOT EXISTS attachments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email_id VARCHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size_bytes INT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  content_id VARCHAR(255),
  is_inline BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

-- 联系人表
CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(100),
  notes TEXT,
  avatar_url VARCHAR(500),
  is_favorite BOOLEAN DEFAULT FALSE,
  frequency_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_email (user_id, email)
);

-- 联系人群组表
CREATE TABLE IF NOT EXISTS contact_groups (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_group_name (user_id, name)
);

-- 联系人群组关联表
CREATE TABLE IF NOT EXISTS contact_group_members (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  group_id VARCHAR(36) NOT NULL,
  contact_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES contact_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_group_contact (group_id, contact_id)
);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_setting (user_id, setting_key)
);

-- 创建索引
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_folders_account_id ON folders(account_id);
CREATE INDEX idx_folders_type ON folders(type);
CREATE INDEX idx_emails_account_id ON emails(account_id);
CREATE INDEX idx_emails_folder_id ON emails(folder_id);
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_emails_date_received ON emails(date_received DESC);
CREATE INDEX idx_emails_is_read ON emails(is_read);
CREATE INDEX idx_emails_is_starred ON emails(is_starred);
CREATE INDEX idx_emails_is_deleted ON emails(is_deleted);
CREATE INDEX idx_attachments_email_id ON attachments(email_id);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contact_groups_user_id ON contact_groups(user_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
