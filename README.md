# XMail - 邮箱管理系统

一个现代化的Web邮箱管理应用，支持多账户管理、邮件收发、智能分类等功能。

## 🚀 项目状态

**当前版本**: v1.0.0 (开发中)
**状态**: ✅ 可运行 - 基础功能已实现

## 🛠 技术栈

### 前端
- React 18 + TypeScript
- Ant Design UI组件库
- Vite 构建工具
- Zustand 状态管理
- React Router 路由管理
- Axios HTTP客户端

### 后端
- Node.js + Express
- JavaScript (简化版本)
- MySQL 数据库
- CORS 跨域支持
- dotenv 环境配置

### 邮件协议 (计划中)
- IMAP (邮件接收)
- SMTP (邮件发送)
- 支持SSL/TLS加密

## ✨ 功能特性

### 已实现
- ✅ 基础项目架构
- ✅ MySQL数据库集成
- ✅ RESTful API设计
- ✅ 前端React应用框架
- ✅ 账户管理API
- ✅ 文件夹管理API
- ✅ 邮件列表API (支持分页)
- ✅ 联系人管理API
- ✅ 健康检查端点

### 开发中
- 🔄 前端UI组件完善
- 🔄 前后端API集成
- 🔄 用户认证系统

### 计划中
- 📋 IMAP邮件同步
- 📋 邮件发送功能
- 📋 全文搜索
- 📋 实时通知
- 📋 主题切换
- 📋 响应式设计优化

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- MySQL >= 5.7 或 8.0
- npm 或 yarn

### 1. 克隆项目

```bash
git clone <repository-url>
cd xmail
```

### 2. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..
```

### 3. 数据库设置

**创建MySQL数据库:**
```bash
# 连接到MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE email_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**导入数据库结构:**
```bash
# 使用提供的简化架构文件
mysql -u root -p email_manager < server/simple-schema.sql

# 导入测试数据
mysql -u root -p email_manager < server/src/database/simple-seed.sql
```

### 4. 环境配置

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑环境变量，确保数据库配置正确
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=email_manager
```

### 5. 启动开发服务器

```bash
# 启动前端和后端开发服务器
npm run dev

# 或者分别启动
npm run dev:client  # 前端开发服务器 (端口 3000)
npm run dev:server  # 后端开发服务器 (端口 5000)
```

### 6. 访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:5000/api
- **健康检查**: http://localhost:5000/api/health

## 📁 项目结构

```
xmail/
├── src/                    # 前端源码
│   ├── components/         # React组件
│   │   └── Layout/         # 布局组件
│   ├── pages/             # 页面组件
│   │   ├── EmailList.tsx   # 邮件列表页
│   │   ├── EmailDetail.tsx # 邮件详情页
│   │   ├── Compose.tsx     # 撰写邮件页
│   │   └── Settings.tsx    # 设置页
│   ├── types/             # TypeScript类型定义
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 应用入口
├── server/                # 后端源码
│   ├── src/               # TypeScript版本 (高级功能)
│   │   ├── routes/        # API路由
│   │   ├── database/      # 数据库相关
│   │   ├── services/      # 业务逻辑
│   │   └── utils/         # 工具函数
│   ├── server.js          # 简化版服务器 (当前使用)
│   ├── simple-schema.sql  # 数据库架构文件
│   └── package.json       # 后端依赖
├── public/                # 静态资源
├── .env                   # 环境变量配置
├── .env.example           # 环境变量模板
├── package.json           # 前端依赖和脚本
└── README.md              # 项目文档
```

## 📡 API文档

### 系统状态
- `GET /api/health` - 健康检查，返回服务器和数据库状态

### 账户管理
- `GET /api/accounts` - 获取账户列表 ✅
- `POST /api/accounts` - 添加账户 (计划中)
- `PUT /api/accounts/:id` - 更新账户 (计划中)
- `DELETE /api/accounts/:id` - 删除账户 (计划中)

### 邮件管理
- `GET /api/emails` - 获取邮件列表 ✅
  - 查询参数: `folderId`, `page`, `limit`
  - 支持分页和文件夹筛选
- `GET /api/emails/:id` - 获取邮件详情 (计划中)
- `POST /api/emails` - 发送邮件 (计划中)
- `PUT /api/emails/:id` - 更新邮件状态 (计划中)
- `DELETE /api/emails/:id` - 删除邮件 (计划中)

### 文件夹管理
- `GET /api/folders` - 获取文件夹列表 ✅
- `POST /api/folders` - 创建文件夹 (计划中)
- `PUT /api/folders/:id` - 更新文件夹 (计划中)
- `DELETE /api/folders/:id` - 删除文件夹 (计划中)

### 联系人管理
- `GET /api/contacts` - 获取联系人列表 ✅
- `POST /api/contacts` - 添加联系人 (计划中)
- `PUT /api/contacts/:id` - 更新联系人 (计划中)
- `DELETE /api/contacts/:id` - 删除联系人 (计划中)

### API使用示例

```bash
# 健康检查
curl http://localhost:5000/api/health

# 获取账户列表
curl http://localhost:5000/api/accounts

# 获取邮件列表 (分页)
curl "http://localhost:5000/api/emails?page=1&limit=20"

# 获取特定文件夹的邮件
curl "http://localhost:5000/api/emails?folderId=folder-001&page=1&limit=10"
```

## 🛠 开发指南

### 数据库结构

项目使用MySQL数据库，主要表结构：

- `users` - 用户表
- `accounts` - 邮箱账户表
- `folders` - 文件夹表
- `emails` - 邮件表
- `contacts` - 联系人表
- `attachments` - 附件表

### 代码规范

项目使用 ESLint 和 Prettier 进行代码规范检查：

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范问题
npm run lint:fix

# 格式化代码
npm run format
```

### 测试

```bash
# 运行前端测试
npm test

# 运行测试UI
npm run test:ui

# 运行后端测试
cd server && npm test
```

### 开发模式

```bash
# 同时启动前端和后端
npm run dev

# 仅启动前端 (端口 3000)
npm run dev:client

# 仅启动后端 (端口 5000)
npm run dev:server
```

## 🚀 部署

### 构建生产版本

```bash
# 构建前端
npm run build:client

# 构建后端 (TypeScript版本)
npm run build:server

# 启动生产服务器
npm start
```

### 环境配置

生产环境需要配置以下环境变量：

```bash
NODE_ENV=production
PORT=5000
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=email_manager
```

## 🐛 故障排除

### 常见问题

**1. 端口被占用错误**
```bash
Error: listen EADDRINUSE: address already in use :::5000
```
解决方案：检查是否有其他进程占用端口，或修改 `.env` 文件中的 `PORT` 配置。

**2. 数据库连接失败**
```bash
❌ 数据库连接失败
```
解决方案：
- 确保MySQL服务正在运行
- 检查 `.env` 文件中的数据库配置
- 确保数据库 `email_manager` 已创建

**3. 前端无法访问后端API**
解决方案：
- 确保后端服务器在端口5000运行
- 检查 `vite.config.ts` 中的代理配置
- 确认CORS设置正确

### 重置项目

如果遇到问题，可以重置项目：

```bash
# 清理依赖
rm -rf node_modules server/node_modules
npm install
cd server && npm install && cd ..

# 重置数据库
mysql -u root -p -e "DROP DATABASE IF EXISTS email_manager;"
mysql -u root -p < server/simple-schema.sql
mysql -u root -p < server/src/database/simple-seed.sql

# 重新启动
npm run dev
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请提交Issue或联系开发团队。

---

**项目状态**: 🚧 开发中 | **最后更新**: 2024年12月