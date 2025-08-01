# 邮箱管理系统

一个现代化的Web邮箱管理应用，支持多账户管理、邮件收发、智能分类等功能。

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design UI组件库
- Vite 构建工具
- Zustand 状态管理
- React Router 路由管理

### 后端
- Node.js + Express
- TypeScript
- PostgreSQL 数据库
- Redis 缓存
- Socket.io 实时通信

### 邮件协议
- IMAP (邮件接收)
- SMTP (邮件发送)
- 支持SSL/TLS加密

## 功能特性

- ✅ 多邮箱账户管理
- ✅ 邮件收发功能
- ✅ 邮件分类和文件夹管理
- ✅ 全文搜索
- ✅ 联系人管理
- ✅ 实时邮件同步
- ✅ 响应式设计
- ✅ 主题切换

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis >= 6.0

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install
```

### 环境配置

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑环境变量
vim .env
```

### 启动开发服务器

```bash
# 启动前端和后端开发服务器
npm run dev

# 或者分别启动
npm run dev:client  # 前端开发服务器 (端口 3000)
npm run dev:server  # 后端开发服务器 (端口 5000)
```

### 构建生产版本

```bash
# 构建前端和后端
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
email-manager/
├── src/                    # 前端源码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── types/             # TypeScript类型定义
│   ├── utils/             # 工具函数
│   ├── store/             # 状态管理
│   └── api/               # API客户端
├── server/                # 后端源码
│   ├── src/               # 服务器源码
│   │   ├── routes/        # API路由
│   │   ├── models/        # 数据模型
│   │   ├── services/      # 业务逻辑
│   │   └── utils/         # 工具函数
│   └── tsconfig.json      # 后端TypeScript配置
├── dist/                  # 构建输出目录
├── public/                # 静态资源
└── package.json           # 项目配置
```

## API文档

### 账户管理
- `GET /api/accounts` - 获取账户列表
- `POST /api/accounts` - 添加账户
- `PUT /api/accounts/:id` - 更新账户
- `DELETE /api/accounts/:id` - 删除账户
- `POST /api/accounts/:id/test` - 测试连接

### 邮件管理
- `GET /api/emails` - 获取邮件列表
- `GET /api/emails/:id` - 获取邮件详情
- `POST /api/emails` - 发送邮件
- `PUT /api/emails/:id` - 更新邮件状态
- `DELETE /api/emails/:id` - 删除邮件

### 文件夹管理
- `GET /api/folders` - 获取文件夹列表
- `POST /api/folders` - 创建文件夹
- `PUT /api/folders/:id` - 更新文件夹
- `DELETE /api/folders/:id` - 删除文件夹

### 联系人管理
- `GET /api/contacts` - 获取联系人列表
- `POST /api/contacts` - 添加联系人
- `PUT /api/contacts/:id` - 更新联系人
- `DELETE /api/contacts/:id` - 删除联系人

### 搜索功能
- `GET /api/search` - 搜索邮件
- `POST /api/search/index` - 重建搜索索引

## 开发指南

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
# 运行测试
npm test

# 运行测试并显示覆盖率
npm run test:coverage

# 运行测试UI
npm run test:ui
```

## 部署

### Docker部署

```bash
# 构建Docker镜像
docker build -t email-manager .

# 运行容器
docker run -p 3000:3000 -p 5000:5000 email-manager
```

### 传统部署

1. 构建生产版本：`npm run build`
2. 配置Nginx反向代理
3. 配置PostgreSQL和Redis
4. 启动应用：`npm start`

## 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交Issue或联系开发团队。