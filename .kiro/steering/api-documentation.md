---
inclusion: fileMatch
fileMatchPattern: '**/commands/**'
---

# XMail API 文档

## Tauri 命令接口

### 邮件管理命令

#### `get_all_emails()`
获取所有邮件列表

**返回值**: `Result<Vec<Email>, String>`

#### `create_email(sender, recipient, subject, body, category)`
创建新邮件

**参数**:
- `sender: String` - 发件人邮箱
- `recipient: String` - 收件人邮箱  
- `subject: String` - 邮件主题
- `body: String` - 邮件内容
- `category: String` - 邮件分类

**返回值**: `Result<String, String>` - 邮件ID

#### `search_emails(filter)`
搜索邮件

**参数**:
- `filter: EmailFilter` - 搜索条件

**返回值**: `Result<Vec<Email>, String>`

### 邮件服务商管理命令

#### `get_email_providers()`
获取所有邮件服务商

**返回值**: `Result<Vec<EmailProvider>, String>`

#### `add_email_account(provider_id, email_address, display_name, username, password)`
添加邮件账户

**参数**:
- `provider_id: i32` - 服务商ID
- `email_address: String` - 邮箱地址
- `display_name: String` - 显示名称
- `username: String` - 用户名
- `password: String` - 密码（将被加密存储）

**返回值**: `Result<i64, String>` - 账户ID

#### `test_email_connection(provider_id, username, password)`
测试邮件连接

**参数**:
- `provider_id: i32` - 服务商ID
- `username: String` - 用户名
- `password: String` - 密码

**返回值**: `Result<bool, String>` - 连接是否成功

#### `sync_account_emails(account_id)`
同步账户邮件

**参数**:
- `account_id: i32` - 账户ID

**返回值**: `Result<Vec<Email>, String>` - 同步的邮件列表

### 分类管理命令

#### `get_email_categories()`
获取所有邮件分类

**返回值**: `Result<Vec<EmailCategory>, String>`

#### `add_email_category(name, color, description)`
添加自定义分类

**参数**:
- `name: String` - 分类名称
- `color: String` - 分类颜色 (hex格式)
- `description: Option<String>` - 分类描述

**返回值**: `Result<i64, String>` - 分类ID

## 数据模型

### Email
```rust
pub struct Email {
    pub id: String,
    pub sender: String,
    pub recipient: String,
    pub subject: String,
    pub body: String,
    pub category: String,
    pub is_read: bool,
    pub is_important: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

### EmailProvider
```rust
pub struct EmailProvider {
    pub id: i32,
    pub name: String,
    pub provider_type: String,
    pub imap_server: String,
    pub imap_port: u16,
    pub smtp_server: String,
    pub smtp_port: u16,
    pub use_ssl: bool,
    pub use_tls: bool,
}
```

### EmailAccount
```rust
pub struct EmailAccount {
    pub id: i32,
    pub provider_id: i32,
    pub email_address: String,
    pub display_name: String,
    pub username: String,
    pub password: String, // 加密存储
    pub is_active: bool,
    pub last_sync: Option<String>,
    pub created_at: String,
}
```

### EmailCategory
```rust
pub struct EmailCategory {
    pub id: i32,
    pub name: String,
    pub color: String,
    pub description: Option<String>,
    pub is_system: bool,
    pub created_at: String,
}
```