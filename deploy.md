# 🚀 XMail 部署指南

## 📦 自动构建状态

项目已配置 GitHub Actions 自动构建，支持以下平台：

- ✅ **Windows** (x64)
- ✅ **macOS** (Intel & Apple Silicon)
- ✅ **Linux** (Ubuntu 22.04)

## 🔄 构建触发条件

### 自动构建
- 推送到 `master` 分支
- 创建 Pull Request
- 创建新的 tag (格式: `v*`)

### 手动触发
可以在 GitHub Actions 页面手动触发构建

## 📋 构建流程

1. **环境准备**
   - Node.js 20 (LTS)
   - Rust 工具链
   - 平台特定依赖

2. **依赖安装**
   - 前端依赖: `npm install`
   - Rust 依赖: 自动处理

3. **构建应用**
   - 前端构建: `npm run build`
   - Tauri 打包: `tauri build`

4. **发布 Release**
   - 自动创建 GitHub Release
   - 上传构建产物

## 📥 下载安装包

访问 [Releases](https://github.com/hj01857655/XMail/releases) 页面下载：

### Windows
- `XMail_0.1.0_x64_en-US.msi` - MSI 安装包
- `XMail_0.1.0_x64-setup.exe` - EXE 安装程序

### macOS
- `XMail_0.1.0_aarch64.dmg` - Apple Silicon (M1/M2)
- `XMail_0.1.0_x64.dmg` - Intel 处理器

### Linux
- `xmail_0.1.0_amd64.deb` - Debian/Ubuntu 包
- `xmail_0.1.0_amd64.AppImage` - 通用 AppImage

## 🛠️ 本地开发

### 环境要求
- Node.js 16+
- Rust 1.70+
- 平台特定工具链

### 开发命令
```bash
# 安装依赖
npm install

# 开发模式
npm run tauri:dev

# 构建应用
npm run tauri:build
```

## 🔧 配置说明

### package.json
```json
{
  "name": "email-manager-tauri",
  "version": "0.1.0",
  "scripts": {
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

### tauri.conf.json
```json
{
  "productName": "邮件管理系统",
  "version": "0.1.0",
  "identifier": "com.email.manager"
}
```

## 📊 构建状态

| 平台 | 状态 | 最新版本 |
|------|------|----------|
| Windows | ✅ | v0.1.0 |
| macOS (Intel) | ✅ | v0.1.0 |
| macOS (Apple Silicon) | ✅ | v0.1.0 |
| Linux | ✅ | v0.1.0 |

## 🐛 问题排查

### 常见问题

1. **构建失败**
   - 检查 Rust 工具链版本
   - 确认依赖安装完整
   - 查看 Actions 日志

2. **依赖问题**
   - 删除 `node_modules` 重新安装
   - 更新 `package-lock.json`

3. **平台特定问题**
   - Windows: 确保有 Visual Studio Build Tools
   - macOS: 确保 Xcode Command Line Tools
   - Linux: 安装 webkit2gtk 等依赖

### 调试命令
```bash
# 检查 Tauri 环境
npx tauri info

# 清理构建缓存
cargo clean
rm -rf node_modules
npm install

# 详细构建日志
npm run tauri:build -- --verbose
```

## 🚀 发布新版本

1. **更新版本号**
   ```bash
   # 更新 package.json 和 tauri.conf.json 中的版本号
   npm version patch  # 或 minor, major
   ```

2. **创建 tag**
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

3. **自动构建**
   - GitHub Actions 自动触发
   - 构建完成后自动创建 Release

## 📞 支持

- 🐛 [报告问题](https://github.com/hj01857655/XMail/issues)
- 💡 [功能建议](https://github.com/hj01857655/XMail/discussions)
- 📖 [项目文档](https://github.com/hj01857655/XMail)

---

**最后更新**: 2025-08-10
**构建版本**: v0.1.0