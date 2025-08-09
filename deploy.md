# 🚀 XMail 部署指南

## GitHub Actions 自动构建

项目已配置 GitHub Actions 自动构建，支持多平台打包。

### 触发构建

构建会在以下情况自动触发：

1. **推送到主分支**
   ```bash
   git push origin master
   ```

2. **创建标签发布**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **创建 Pull Request**

### 构建平台

- ✅ **Windows** - 生成 `.msi` 和 `.exe` 安装包
- ✅ **macOS** - 生成 `.dmg` 安装包 (Intel + Apple Silicon)
- ✅ **Linux** - 生成 `.deb` 和 `.AppImage` 安装包

### 构建状态

查看构建状态：[GitHub Actions](https://github.com/hj01857655/XMail/actions)

### 下载发布版本

构建完成后，可在以下位置下载：
- [Releases 页面](https://github.com/hj01857655/XMail/releases)

## 本地开发

### 环境要求

- Node.js 16+
- Rust 1.70+
- Tauri CLI

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri:dev

# 构建应用
npm run tauri:build

# 只构建前端
npm run build
```

### 项目结构

```
XMail/
├── src/                    # Vue.js 前端
│   ├── App.vue            # 主应用组件
│   ├── main.js            # 入口文件
│   └── style.css          # 样式文件
├── src-tauri/             # Tauri 后端
│   ├── src/
│   │   ├── main.rs        # 主入口
│   │   ├── commands/      # API 命令
│   │   ├── models/        # 数据模型
│   │   ├── services/      # 业务逻辑
│   │   └── database/      # 数据访问
│   └── tauri.conf.json    # Tauri 配置
├── .github/workflows/     # GitHub Actions
└── dist/                  # 构建输出
```

## 发布流程

### 1. 准备发布

```bash
# 更新版本号
# 编辑 package.json 和 src-tauri/Cargo.toml 中的版本号

# 提交更改
git add .
git commit -m "chore: bump version to v1.0.0"
```

### 2. 创建标签

```bash
# 创建标签
git tag v1.0.0

# 推送标签
git push origin v1.0.0
```

### 3. 自动构建

GitHub Actions 会自动：
1. 检测到新标签
2. 在多个平台上构建应用
3. 创建 GitHub Release
4. 上传构建产物

### 4. 发布完成

- 检查 [Actions](https://github.com/hj01857655/XMail/actions) 页面确认构建成功
- 在 [Releases](https://github.com/hj01857655/XMail/releases) 页面查看发布版本
- 下载并测试各平台安装包

## 故障排除

### 常见问题

1. **构建失败 - 缺少依赖**
   - 检查 `package.json` 中的依赖是否正确
   - 确保 `src-tauri/Cargo.toml` 中的 Rust 依赖正确

2. **前端构建失败**
   - 检查 `index.html` 中的脚本路径
   - 确保 `src/main.js` 文件存在

3. **Tauri 构建失败**
   - 检查 `src-tauri/tauri.conf.json` 配置
   - 确保 Rust 代码编译正常

### 调试步骤

1. **本地测试**
   ```bash
   npm run build
   npm run tauri:build
   ```

2. **检查日志**
   - 查看 GitHub Actions 构建日志
   - 检查具体错误信息

3. **版本兼容性**
   - 确保 Node.js、Rust、Tauri 版本兼容
   - 检查依赖版本是否匹配

## 更新记录

- **v0.1.0** - 初始版本，基础邮件管理功能
- **修复** - 解决前端构建路径问题
- **优化** - 改进 GitHub Actions 配置

---

📧 **XMail 邮件管理系统** - 现代化跨平台桌面应用