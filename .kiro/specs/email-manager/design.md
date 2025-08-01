# 设计文档

## 概述

邮箱管理系统是一个现代化的Web应用程序，采用React + TypeScript构建前端界面，Node.js + Express处理后端API，PostgreSQL作为主数据库，Redis用于缓存和会话管理。系统通过IMAP/SMTP协议与邮件服务器通信，为用户提供统一的邮件管理体验。

## 架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端应用 (React)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  邮件列表   │  │  邮件编辑器  │  │    设置界面     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  状态管理   │  │  路由管理   │  │    API客户端    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   后端API (Node.js + Express)          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  邮件服务   │  │  账户管理   │  │    用户认证     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  文件上传   │  │  实时通知   │  │    数据访问     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                      数据存储层                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ PostgreSQL  │  │    Redis    │  │    文件系统     │  │
│  │  (邮件数据)  │  │ (缓存/会话)  │  │   (附件存储)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 技术栈选择

**前端框架：** React 18 + TypeScript
- 组件化开发，易于维护
- TypeScript提供类型安全
- 丰富的UI组件库支持

**构建工具：** Vite + TypeScript
- 快速的开发服务器和构建
- 现代化的模块打包
- 优秀的开发体验

**后端服务：** Node.js + Express
- JavaScript全栈开发
- 丰富的邮件处理库
- 异步I/O适合邮件同步

**数据存储：**
- PostgreSQL：主数据库存储
- Redis：缓存和会话管理
- 文件系统：附件和配置文件

**邮件协议库：**
- node-imap：IMAP协议实现
- nodemailer：SMTP邮件发送
- mailparser：邮件解析

## 组件和接口

### 核心组件架构

#### 1. 主进程组件 (Main Process)

**WindowManager**
```typescript
interface WindowManager {
  createMainWindow(): BrowserWindow;
  createComposeWindow(): BrowserWindow;
  handleWindowEvents(): void;
}
```

**IPCHandler**
```typescript
interface IPCHandler {
  registerHandlers(): void;
  handleEmailSync(accountId: string): Promise<void>;
  handleEmailSend(emailData: EmailData): Promise<boolean>;
}
```

#### 2. 渲染进程组件 (Renderer Process)

**邮件列表组件**
```typescript
interface EmailListProps {
  folderId: string;
  searchQuery?: string;
  onEmailSelect: (email: Email) => void;
}

interface EmailListState {
  emails: Email[];
  loading: boolean;
  selectedEmailId?: string;
}
```

**邮件编辑器组件**
```typescript
interface ComposeEditorProps {
  mode: 'new' | 'reply' | 'forward';
  initialData?: Partial<EmailData>;
  onSend: (emailData: EmailData) => Promise<void>;
}

interface EmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: Attachment[];
}
```

#### 3. 服务层组件

**邮件同步服务**
```typescript
interface EmailSyncService {
  syncAccount(accountId: string): Promise<SyncResult>;
  syncFolder(accountId: string, folderId: string): Promise<Email[]>;
  handleIncomingEmail(email: RawEmail): Promise<void>;
}
```

**账户管理服务**
```typescript
interface AccountService {
  addAccount(config: AccountConfig): Promise<string>;
  validateConnection(config: AccountConfig): Promise<boolean>;
  updateAccount(accountId: string, config: Partial<AccountConfig>): Promise<void>;
  deleteAccount(accountId: string): Promise<void>;
}
```

### API接口设计

#### REST API端点

```typescript
// 账户管理
POST   /api/accounts              // 添加账户
GET    /api/accounts              // 获取账户列表
PUT    /api/accounts/:id          // 更新账户
DELETE /api/accounts/:id          // 删除账户
POST   /api/accounts/:id/test     // 测试连接

// 邮件操作
GET    /api/emails                // 获取邮件列表
GET    /api/emails/:id            // 获取邮件详情
POST   /api/emails                // 发送邮件
PUT    /api/emails/:id            // 更新邮件状态
DELETE /api/emails/:id            // 删除邮件

// 文件夹管理
GET    /api/folders               // 获取文件夹列表
POST   /api/folders               // 创建文件夹
PUT    /api/folders/:id           // 更新文件夹
DELETE /api/folders/:id           // 删除文件夹

// 搜索功能
GET    /api/search                // 搜索邮件
POST   /api/search/index          // 重建搜索索引

// 联系人管理
GET    /api/contacts              // 获取联系人
POST   /api/contacts              // 添加联系人
PUT    /api/contacts/:id          // 更新联系人
DELETE /api/contacts/:id          // 删除联系人
```

#### IPC通信接口

```typescript
// 主进程到渲染进程
interface MainToRendererEvents {
  'email-received': (email: Email) => void;
  'sync-progress': (progress: SyncProgress) => void;
  'notification': (notification: Notification) => void;
}

// 渲染进程到主进程
interface RendererToMainEvents {
  'sync-emails': (accountId: string) => Promise<void>;
  'send-email': (emailData: EmailData) => Promise<boolean>;
  'show-notification': (message: string) => void;
}
```

## 数据模型

### 数据库表结构

**accounts 表**
```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL,
  imap_secure BOOLEAN NOT NULL,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_secure BOOLEAN NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL, -- 加密存储
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**emails 表**
```sql
CREATE TABLE emails (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  message_id TEXT UNIQUE NOT NULL,
  subject TEXT,
  from_address TEXT NOT NULL,
  to_addresses TEXT NOT NULL, -- JSON数组
  cc_addresses TEXT, -- JSON数组
  bcc_addresses TEXT, -- JSON数组
  body_text TEXT,
  body_html TEXT,
  date_received DATETIME NOT NULL,
  date_sent DATETIME,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  has_attachments BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

**folders 表**
```sql
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'inbox', 'sent', 'drafts', 'trash', 'custom'
  parent_id TEXT,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (parent_id) REFERENCES folders(id)
);
```

**attachments 表**
```sql
CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_id) REFERENCES emails(id)
);
```

**contacts 表**
```sql
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### TypeScript类型定义

```typescript
interface Account {
  id: string;
  name: string;
  email: string;
  imapConfig: IMAPConfig;
  smtpConfig: SMTPConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

interface Email {
  id: string;
  accountId: string;
  folderId: string;
  messageId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  bodyText?: string;
  bodyHtml?: string;
  dateReceived: Date;
  dateSent?: Date;
  isRead: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
}

interface EmailAddress {
  name?: string;
  address: string;
}

interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  filePath: string;
}

interface Folder {
  id: string;
  accountId: string;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'custom';
  parentId?: string;
  color?: string;
  children?: Folder[];
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}
```

## 错误处理

### 错误分类和处理策略

**网络连接错误**
```typescript
class NetworkError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// 处理策略：自动重试 + 用户通知
const handleNetworkError = async (error: NetworkError, retryCount = 0) => {
  if (retryCount < 3) {
    await delay(1000 * Math.pow(2, retryCount)); // 指数退避
    return retry(retryCount + 1);
  }
  showNotification('网络连接失败，请检查网络设置');
};
```

**邮件服务器错误**
```typescript
class EmailServerError extends Error {
  constructor(message: string, public serverResponse: string) {
    super(message);
    this.name = 'EmailServerError';
  }
}

// 处理策略：记录日志 + 用户友好提示
const handleServerError = (error: EmailServerError) => {
  logger.error('邮件服务器错误', { error: error.serverResponse });
  showErrorDialog('邮件服务器暂时不可用，请稍后重试');
};
```

**数据验证错误**
```typescript
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 处理策略：表单验证提示
const handleValidationError = (error: ValidationError) => {
  showFieldError(error.field, error.message);
};
```

### 全局错误处理器

```typescript
class ErrorHandler {
  static handle(error: Error, context?: string) {
    logger.error('应用错误', { error, context });
    
    if (error instanceof NetworkError) {
      return this.handleNetworkError(error);
    }
    
    if (error instanceof EmailServerError) {
      return this.handleServerError(error);
    }
    
    if (error instanceof ValidationError) {
      return this.handleValidationError(error);
    }
    
    // 未知错误
    showErrorDialog('发生未知错误，请重启应用');
  }
}
```

## 测试策略

### 测试金字塔

**单元测试 (70%)**
- 工具函数测试
- 数据模型验证
- 业务逻辑测试
- 使用Jest + TypeScript

**集成测试 (20%)**
- API接口测试
- 数据库操作测试
- 邮件协议通信测试
- 使用Supertest + 测试数据库

**端到端测试 (10%)**
- 用户界面交互测试
- 完整邮件收发流程测试
- 使用Playwright

### 测试环境配置

**测试数据库**
```typescript
// 使用内存SQLite数据库
const testDb = new Database(':memory:');

beforeEach(async () => {
  await setupTestDatabase(testDb);
  await seedTestData(testDb);
});

afterEach(async () => {
  await cleanupTestDatabase(testDb);
});
```

**Mock邮件服务器**
```typescript
// 使用smtp-server和imap-server创建测试服务器
const mockIMAPServer = new IMAPServer({
  port: 1143,
  secure: false
});

const mockSMTPServer = new SMTPServer({
  port: 1587,
  secure: false
});
```

### 性能测试

**邮件同步性能**
- 测试大量邮件同步的内存使用
- 测试并发同步的性能表现
- 测试搜索索引的构建速度

**UI响应性测试**
- 测试大邮件列表的渲染性能
- 测试邮件编辑器的输入延迟
- 测试文件上传的进度反馈

这个设计文档涵盖了系统的整体架构、核心组件、数据模型、错误处理和测试策略。基于Electron + React + Node.js的技术栈能够很好地支持跨平台的桌面邮件管理需求。