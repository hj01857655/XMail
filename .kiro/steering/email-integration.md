---
inclusion: fileMatch
fileMatchPattern: '**/email*'
---

# 邮件集成开发指南

## 邮件服务商配置

### 支持的服务商
- **Gmail**: 需要应用专用密码，启用 2FA
- **QQ邮箱**: 需要开启 IMAP/SMTP 服务，获取授权码
- **163邮箱**: 需要开启客户端授权密码
- **126邮箱**: 需要开启客户端授权密码
- **Outlook**: 支持 OAuth2 和应用密码

### 连接参数
```rust
// Gmail 配置示例
EmailProvider {
    imap_server: "imap.gmail.com",
    imap_port: 993,
    smtp_server: "smtp.gmail.com", 
    smtp_port: 587,
    use_ssl: true,
    use_tls: true,
}
```

## 邮件同步策略

### 同步频率
- 手动同步：用户主动触发
- 定时同步：每 15 分钟检查一次
- 实时同步：IMAP IDLE 支持（未来版本）

### 同步范围
- 默认同步最近 100 封邮件
- 支持按文件夹同步（收件箱、发件箱、草稿箱）
- 支持增量同步，避免重复下载

### 错误处理
- 网络连接失败：重试 3 次，指数退避
- 认证失败：提示用户检查密码
- 服务器错误：记录日志，稍后重试

## 安全实现

### 密码存储
```rust
// 使用简单的 base64 编码（开发阶段）
// 生产环境应使用系统密钥链或加密存储
fn encrypt_password(password: &str) -> String {
    base64::encode(password)
}

fn decrypt_password(encrypted: &str) -> Result<String> {
    let decoded = base64::decode(encrypted)?;
    Ok(String::from_utf8(decoded)?)
}
```

### 连接安全
- 强制使用 TLS/SSL 连接
- 验证服务器证书
- 超时设置：连接 30s，读取 60s

## API 设计

### Tauri 命令规范
```rust
#[tauri::command]
pub async fn sync_account_emails(
    account_id: i32,
    db: State<'_, Mutex<Database>>
) -> Result<Vec<Email>, String>
```

### 错误处理
- 统一错误类型：`Result<T, String>`
- 用户友好的错误消息
- 详细的日志记录用于调试