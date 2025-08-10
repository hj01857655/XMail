# 邮件服务商集成功能规范

## 概述
为 XMail 邮件管理系统添加多邮件服务商集成功能，支持 Gmail、QQ、163、126、Outlook 等主流邮件服务商的 IMAP/SMTP 连接。

## 需求分析

### 功能需求
1. **邮件服务商管理**
   - 预设主流邮件服务商配置
   - 支持自定义邮件服务商
   - 服务商连接参数配置

2. **邮件账户管理**
   - 添加/删除邮件账户
   - 账户连接测试
   - 账户启用/禁用
   - 密码安全存储

3. **邮件同步功能**
   - IMAP 邮件同步
   - 增量同步支持
   - 多文件夹同步（收件箱、发件箱、草稿箱）
   - 同步状态显示

4. **邮件发送功能**
   - SMTP 邮件发送
   - 发送状态反馈
   - 发送失败重试

### 非功能需求
1. **安全性**
   - 密码加密存储
   - TLS/SSL 连接
   - 输入验证

2. **性能**
   - 异步操作
   - 连接池管理
   - 缓存机制

3. **用户体验**
   - 友好的错误提示
   - 连接状态显示
   - 同步进度显示

## 技术设计

### 数据模型
```rust
// 邮件服务商
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

// 邮件账户
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

### API 接口
```rust
// 获取邮件服务商列表
#[tauri::command]
pub async fn get_email_providers() -> Result<Vec<EmailProvider>, String>

// 添加邮件账户
#[tauri::command]
pub async fn add_email_account(
    provider_id: i32,
    email_address: String,
    display_name: String,
    username: String,
    password: String
) -> Result<i64, String>

// 测试邮件连接
#[tauri::command]
pub async fn test_email_connection(
    provider_id: i32,
    username: String,
    password: String
) -> Result<bool, String>

// 同步账户邮件
#[tauri::command]
pub async fn sync_account_emails(
    account_id: i32
) -> Result<Vec<Email>, String>
```

### 数据库设计
```sql
-- 邮件服务商表
CREATE TABLE email_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL UNIQUE,
    imap_server TEXT NOT NULL,
    imap_port INTEGER NOT NULL,
    smtp_server TEXT NOT NULL,
    smtp_port INTEGER NOT NULL,
    use_ssl BOOLEAN NOT NULL DEFAULT 1,
    use_tls BOOLEAN NOT NULL DEFAULT 1
);

-- 邮件账户表
CREATE TABLE email_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    email_address TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    last_sync TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES email_providers (id)
);
```

## 实现计划

### 阶段一：基础架构 ✅
- [x] 数据模型定义
- [x] 数据库表结构
- [x] 基础服务层

### 阶段二：核心功能 ✅
- [x] 邮件服务商管理
- [x] 邮件账户管理
- [x] 连接测试功能

### 阶段三：同步功能 🚧
- [x] IMAP 连接实现
- [x] 基础邮件同步
- [ ] 增量同步优化
- [ ] 错误处理完善

### 阶段四：用户界面 ✅
- [x] 账户管理界面
- [x] 服务商选择界面
- [x] 连接测试界面
- [x] 同步状态显示

### 阶段五：安全和优化 🚧
- [x] 密码加密存储
- [ ] 连接池管理
- [ ] 性能优化
- [ ] 错误日志

## 测试计划

### 单元测试
- [ ] 数据模型测试
- [ ] 服务层测试
- [ ] 加密解密测试

### 集成测试
- [ ] 数据库操作测试
- [ ] IMAP/SMTP 连接测试
- [ ] Tauri 命令测试

### 用户测试
- [ ] 账户添加流程测试
- [ ] 邮件同步功能测试
- [ ] 错误处理测试

## 风险和挑战

### 技术风险
1. **邮件服务商差异**
   - 不同服务商的 IMAP/SMTP 配置差异
   - 认证方式差异（密码 vs OAuth2）
   - 解决方案：详细的服务商配置和测试

2. **网络连接稳定性**
   - 网络中断导致同步失败
   - 服务商服务器不稳定
   - 解决方案：重试机制和错误处理

3. **安全性考虑**
   - 密码存储安全
   - 网络传输安全
   - 解决方案：加密存储和 TLS 连接

### 用户体验风险
1. **复杂的配置流程**
   - 解决方案：简化界面和自动检测

2. **同步性能问题**
   - 解决方案：异步操作和进度显示

## 成功标准

### 功能完整性
- [ ] 支持至少 5 个主流邮件服务商
- [ ] 账户管理功能完整
- [ ] 邮件同步功能稳定

### 性能指标
- [ ] 连接测试响应时间 < 10s
- [ ] 邮件同步速度 > 10 封/秒
- [ ] 界面响应时间 < 1s

### 用户体验
- [ ] 操作流程直观易懂
- [ ] 错误提示清晰有用
- [ ] 同步状态实时显示

## 参考资料

### 邮件服务商文档
- [Gmail IMAP/SMTP 设置](https://support.google.com/mail/answer/7126229)
- [QQ邮箱 IMAP/SMTP 设置](https://service.mail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256)
- [163邮箱 IMAP/SMTP 设置](https://help.mail.163.com/faqDetail.do?code=d7a5dc8471cd0c0e8b4b8f4f8e49998b374173cfe9171312)

### 技术文档
- [Rust IMAP 库文档](https://docs.rs/imap/)
- [Lettre SMTP 库文档](https://docs.rs/lettre/)
- [Tauri 命令文档](https://tauri.app/v1/guides/features/command/)