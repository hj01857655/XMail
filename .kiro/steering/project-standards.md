---
inclusion: always
---

# XMail 项目开发标准

## 项目概述
XMail 是一个基于 Tauri + Vue.js + Rust 构建的现代化跨平台桌面邮件管理应用。

## 技术栈标准

### 前端 (Vue.js)
- **框架**: Vue.js 3 + Composition API
- **构建工具**: Vite
- **样式**: 原生 CSS，遵循 BEM 命名规范
- **组件结构**: 单文件组件 (.vue)
- **状态管理**: 使用 Vue 3 reactive API

### 后端 (Rust + Tauri)
- **框架**: Tauri 2.0
- **数据库**: SQLite with rusqlite
- **错误处理**: anyhow crate
- **序列化**: serde
- **异步**: tokio

## 代码规范

### Rust 代码规范
- 使用 `cargo fmt` 格式化代码
- 遵循 Rust 官方命名规范
- 所有公共 API 必须有文档注释
- 使用 `Result<T, E>` 进行错误处理
- 模块结构：
  ```
  src-tauri/src/
  ├── commands/     # Tauri 命令
  ├── models/       # 数据模型
  ├── services/     # 业务逻辑
  └── database/     # 数据访问层
  ```

### Vue.js 代码规范
- 使用 PascalCase 命名组件
- 使用 kebab-case 命名 props 和 events
- 组件结构顺序：template → script → style
- 使用 scoped 样式避免样式污染

### 数据库规范
- 表名使用复数形式 (emails, accounts)
- 字段名使用 snake_case
- 必须字段：id, created_at, updated_at
- 使用外键约束保证数据完整性

## 功能开发流程

### 1. 新功能开发
1. 在 `models/` 中定义数据模型
2. 在 `database/` 中实现数据访问
3. 在 `services/` 中实现业务逻辑
4. 在 `commands/` 中暴露 Tauri 命令
5. 在前端创建对应的 Vue 组件
6. 更新文档和测试

### 2. 邮件服务商集成
- 支持的服务商：Gmail, QQ, 163, 126, Outlook
- 使用 IMAP 协议同步邮件
- 使用 SMTP 协议发送邮件
- 支持 SSL/TLS 加密连接
- 提供连接测试功能

### 3. 安全考虑
- 邮件密码使用加密存储
- 敏感信息不记录到日志
- 网络连接使用 TLS 加密
- 输入验证和 SQL 注入防护

## 构建和发布

### 开发环境
```bash
# 安装依赖
npm install

# 开发模式
npm run tauri:dev

# 构建
npm run tauri:build
```

### 版本发布
- 使用语义化版本控制 (semver)
- 通过 GitHub Actions 自动构建和发布
- 支持自动发布：在提交消息中添加 `[auto-release:v1.0.x]`
- 生成 Windows (.msi, .exe) 和 macOS (.dmg) 安装包

## 测试标准
- 单元测试覆盖核心业务逻辑
- 集成测试验证 Tauri 命令
- 手动测试验证用户界面
- 邮件服务商连接测试

## 文档要求
- README.md 包含完整的安装和使用说明
- API 文档描述所有 Tauri 命令
- 代码注释解释复杂的业务逻辑
- 更新日志记录每个版本的变更