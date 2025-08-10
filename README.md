# 📧 邮件管理系统 (Email Manager)

一个基于 Tauri + Vue.js + Rust 构建的现代化跨平台桌面邮件管理应用。

## ✨ 特性

- 🚀 **跨平台** - 支持 Windows、macOS、Linux
- 💻 **现代化界面** - 基于 Vue.js 的响应式 UI
- ⚡ **高性能** - Rust 后端，原生性能
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🔍 **强大搜索** - 支持关键词、分类、状态筛选
- 📊 **统计信息** - 实时邮件统计
- 🎨 **现代化设计** - 简洁美观的用户界面

## 🛠️ 技术栈

### 前端
- **Vue.js 3** - 渐进式 JavaScript 框架
- **Vite** - 快速构建工具
- **CSS3** - 现代化样式

### 后端
- **Rust** - 系统编程语言
- **Tauri** - 跨平台桌面应用框架
- **SQLite** - 轻量级数据库
- **Serde** - 序列化框架

## 📦 安装

### 从 Release 下载
1. 前往 [Releases](../../releases) 页面
2. 下载最新正式版本的安装包：
   - **Windows**: `.msi` 安装包
   - **macOS**: `.dmg` 安装包 (支持 Intel 和 Apple Silicon)
3. 双击安装包按提示安装即可

### 从源码构建

#### 前置要求
- [Node.js](https://nodejs.org/) (v16+)
- [Rust](https://rustup.rs/)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

#### 构建步骤
```bash
# 克隆仓库
git clone https://github.com/hj01857655/XMail.git
cd XMail

# 安装前端依赖
npm install

# 开发模式运行
npm run tauri:dev

# 构建生产版本
npm run tauri:build
```

## 🚀 功能介绍

### 邮件管理
- ✅ 创建、查看、编辑、删除邮件
- ✅ 邮件分类管理
- ✅ 已读/未读状态
- ✅ 重要邮件标记
- ✅ 邮件搜索和过滤

### 用户界面
- ✅ 现代化设计
- ✅ 响应式布局
- ✅ 中文界面
- ✅ 直观操作

### 数据管理
- ✅ SQLite 本地存储
- ✅ 数据持久化
- ✅ 快速查询
- ✅ 统计信息

## 📸 截图

### 主界面
![主界面](screenshots/main.png)

### 邮件详情
![邮件详情](screenshots/detail.png)

### 创建邮件
![创建邮件](screenshots/create.png)

## 🔧 开发

### 项目结构
```
email-manager/
├── src/                    # Vue.js 前端源码
│   ├── App.vue            # 主应用组件
│   ├── main.js            # 入口文件
│   └── style.css          # 样式文件
├── src-tauri/             # Tauri 后端源码
│   ├── src/
│   │   ├── main.rs        # 主入口
│   │   ├── commands/      # Tauri 命令
│   │   ├── models/        # 数据模型
│   │   ├── services/      # 业务逻辑
│   │   └── database/      # 数据访问
│   ├── Cargo.toml         # Rust 依赖
│   └── tauri.conf.json    # Tauri 配置
├── .github/workflows/     # GitHub Actions
├── package.json           # 前端依赖
└── vite.config.js         # Vite 配置
```

### 开发命令
```bash
# 安装依赖
npm install

# 开发模式
npm run tauri:dev

# 构建应用
npm run tauri:build

# 前端开发服务器
npm run dev

# 构建前端
npm run build
```

### API 接口

#### 邮件操作
- `get_all_emails()` - 获取所有邮件
- `create_email(data)` - 创建邮件
- `search_emails(filter)` - 搜索邮件
- `mark_email_as_read(id)` - 标记已读
- `mark_email_as_important(id)` - 标记重要
- `delete_email(id)` - 删除邮件

#### 分类和统计
- `get_categories()` - 获取分类列表
- `get_statistics()` - 获取统计信息

## 🚀 版本发布

项目采用语义化版本控制，所有正式版本都会在 [Releases](../../releases) 页面提供安装包下载。

详细的发布流程请参考 [RELEASE.md](RELEASE.md)

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Rust](https://www.rust-lang.org/) - 系统编程语言
- [SQLite](https://www.sqlite.org/) - 轻量级数据库

## 📞 联系

- 项目链接: [https://github.com/hj01857655/XMail](https://github.com/hj01857655/XMail)
- 问题反馈: [Issues](https://github.com/hj01857655/XMail/issues)

---

⭐ 如果这个项目对你有帮助，请给个 Star！