# 🚀 XMail 部署指南

## 📦 GitHub Actions 自动构建

项目已配置 GitHub Actions，会在以下情况自动构建：
- 推送到 `master` 或 `main` 分支
- 创建 Pull Request
- 发布 Release

### 构建平台
- ✅ **Windows** - `.msi` 和 `.exe` 安装包
- ✅ **macOS** - `.dmg` 安装包 (Intel + Apple Silicon)
- ✅ **Linux** - `.deb` 和 `.AppImage` 安装包

## 🔧 手动构建

### 前置要求
```bash
# 安装 Node.js (v16+)
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 Tauri CLI
npm install -g @tauri-apps/cli@latest
```

### 构建步骤
```bash
# 1. 克隆仓库
git clone https://github.com/hj01857655/XMail.git
cd XMail

# 2. 安装依赖
npm install

# 3. 开发模式运行
npm run tauri:dev

# 4. 构建生产版本
npm run tauri:build
```

## 📋 发布流程

### 1. 创建 Release
1. 前往 GitHub 仓库页面
2. 点击 "Releases" → "Create a new release"
3. 创建新标签，格式：`v1.0.0`
4. 填写发布说明
5. 点击 "Publish release"

### 2. 自动构建
- GitHub Actions 会自动开始构建
- 构建完成后，安装包会自动上传到 Release

### 3. 下载安装包
用户可以从 Releases 页面下载对应平台的安装包：
- **Windows**: `XMail_1.0.0_x64_en-US.msi`
- **macOS**: `XMail_1.0.0_x64.dmg`
- **Linux**: `xmail_1.0.0_amd64.deb`

## 🛠️ 项目结构

```
XMail/
├── src/                    # Vue.js 前端
│   ├── App.vue            # 主应用组件
│   ├── main.js            # 入口文件
│   └── style.css          # 样式文件
├── src-tauri/             # Tauri 后端
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

## 🔍 构建状态

查看构建状态：
- 前往 GitHub 仓库的 "Actions" 标签页
- 查看最新的构建日志
- 绿色 ✅ 表示构建成功
- 红色 ❌ 表示构建失败

## 📝 版本管理

### 更新版本号
1. 修改 `package.json` 中的 `version`
2. 修改 `src-tauri/Cargo.toml` 中的 `version`
3. 修改 `src-tauri/tauri.conf.json` 中的 `version`

### 发布新版本
```bash
# 1. 更新版本号
npm version patch  # 或 minor, major

# 2. 推送代码
git push origin master

# 3. 创建标签
git tag v1.0.1
git push origin v1.0.1

# 4. 在 GitHub 创建 Release
```

## 🎯 部署完成

✅ 远程仓库：https://github.com/hj01857655/XMail.git
✅ GitHub Actions 配置完成
✅ 跨平台自动构建
✅ 自动发布到 Releases

现在只需要：
1. 推送代码到 master 分支 → 自动构建
2. 创建 Release → 自动发布安装包
3. 用户下载对应平台的安装包即可使用

## 🔗 相关链接

- 仓库地址: https://github.com/hj01857655/XMail
- Actions: https://github.com/hj01857655/XMail/actions
- Releases: https://github.com/hj01857655/XMail/releases