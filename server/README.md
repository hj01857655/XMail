# 邮箱管理系统 - 服务端

## 项目结构

```
server/
├── src/
│   ├── config/           # 配置文件
│   │   └── database.ts   # 数据库连接配置
│   ├── database/         # 数据访问层
│   │   ├── base-dao.ts   # 基础DAO类
│   │   ├── account-dao.ts # 账户数据访问
│   │   ├── email-dao.ts  # 邮件数据访问
│   │   ├── folder-dao.ts # 文件夹数据访问
│   │   ├── contact-dao.ts # 联系人数据访问
│   │   ├── attachment-dao.ts # 附件数据访问
│   │   ├── migrations.ts # 数据库迁移
│   │   └── index.ts      # 统一导出
│   ├── middleware/       # 中间件
│   │   └── database-middleware.ts # 数据库相关中间件
│   ├── routes/           # API路由
│   │   ├── accounts.ts   # 账户路由
│   │   ├── emails.ts     # 邮件路由
│   │   ├── folders.ts    # 文件夹路由
│   │   ├── contacts.ts   # 联系人路由
│   │   └── search.ts     # 搜索路由
│   ├── scripts/          # 脚本文件
│   │   ├── init-database.ts # 数据库初始化
│   │   └── seed-data.ts  # 测试数据填充
│   ├── test/             # 测试文件
│   │   ├── setup.ts      # 测试环境设置
│   │   ├── database.test.ts # 数据库连接测试
│   │   └── dao.test.ts   # DAO层测试
│   ├── utils/            # 工具函数
│   │   ├── database-utils.ts # 数据库工具
│   │   ├── encryption.ts # 加密工具
│   │   └── validation.ts # 数据验证
│   └── index.ts          # 服务器入口
├── jest.config.js        # Jest测试配置
├── package.json          # 项目依赖
└── tsconfig.json         # TypeScript配置
```

## 数据库设计

### 核心表结构

1. **accounts** - 邮箱账户
2. **folders** - 邮件文件夹
3. **emails** - 邮件数据
4. **attachments** - 邮件附件
5. **contacts** - 联系人
6. **email_rules** - 邮件规则
7. **user_settings** - 用户设置
8. **sync_logs** - 同步日志

### 特性

- **数据加密**: 敏感信息（如邮箱密码）使用AES加密存储
- **全文搜索**: 使用PostgreSQL的全文搜索功能
- **事务支持**: 复杂操作使用数据库事务保证一致性
- **连接池**: 使用连接池管理数据库连接
- **缓存支持**: 集成Redis缓存提高性能
- **数据验证**: 使用Joi进行数据验证
- **迁移管理**: 版本化的数据库迁移系统

## 开发指南

### 环境设置

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件配置数据库连接信息
```

3. 初始化数据库：
```bash
npm run db:init
```

4. 填充测试数据：
```bash
npm run db:seed
```

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 运行测试
npm test

# 代码检查
npm run lint

# 数据库迁移
npm run db:migrate

# 数据库回滚
npm run db:rollback
```

### API使用示例

#### 创建账户
```bash
curl -X POST http://localhost:5000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的邮箱",
    "email": "user@example.com",
    "imapHost": "imap.example.com",
    "imapPort": 993,
    "imapSecure": true,
    "smtpHost": "smtp.example.com",
    "smtpPort": 587,
    "smtpSecure": true,
    "username": "user@example.com",
    "password": "password"
  }'
```

#### 获取邮件列表
```bash
curl "http://localhost:5000/api/emails?page=1&pageSize=20&accountId=xxx"
```

#### 搜索邮件
```bash
curl "http://localhost:5000/api/search?query=重要&accountId=xxx"
```

## 测试

项目包含完整的测试套件：

- **单元测试**: 测试各个DAO类的功能
- **集成测试**: 测试数据库连接和操作
- **API测试**: 测试REST API端点

运行测试：
```bash
npm test
```

查看测试覆盖率：
```bash
npm run test:coverage
```

## 部署

### 生产环境配置

1. 设置环境变量
2. 构建项目：`npm run build`
3. 启动服务：`npm start`

### Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["npm", "start"]
```

## 性能优化

- **连接池**: 配置合适的数据库连接池大小
- **索引优化**: 为常用查询字段添加索引
- **缓存策略**: 使用Redis缓存频繁查询的数据
- **分页查询**: 大数据量查询使用分页
- **批量操作**: 批量插入和更新操作

## 安全考虑

- **数据加密**: 敏感数据加密存储
- **SQL注入防护**: 使用参数化查询
- **输入验证**: 严格的数据验证
- **错误处理**: 不暴露敏感错误信息
- **连接安全**: 使用SSL/TLS连接数据库