# 发布指南

## 如何创建正式版本

### 方法一：使用 GitHub Actions (推荐)

1. 访问 GitHub 仓库的 Actions 页面
2. 选择 "Create Release" 工作流
3. 点击 "Run workflow"
4. 填写版本号 (格式: v1.0.1) 和发布说明
5. 点击 "Run workflow" 开始创建发布

### 方法二：手动创建

1. 更新版本号：
   ```bash
   # 更新 package.json
   npm version 1.0.1 --no-git-tag-version
   
   # 更新 src-tauri/tauri.conf.json 中的 version
   # 更新 src-tauri/Cargo.toml 中的 version
   ```

2. 提交更改：
   ```bash
   git add .
   git commit -m "chore: bump version to v1.0.1"
   git push
   ```

3. 创建标签：
   ```bash
   git tag -a v1.0.1 -m "Release v1.0.1"
   git push origin v1.0.1
   ```

4. 在 GitHub 上创建 Release，构建将自动开始

## 版本号规范

使用语义化版本控制 (Semantic Versioning):
- `v1.0.0` - 主版本号.次版本号.修订号
- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

## 发布类型

### 正式版本 (Release)
- 通过 GitHub Release 创建
- 生成稳定的安装包 (.msi 和 .dmg)
- 在 GitHub Releases 页面提供下载
- 版本格式：`v1.0.0` (语义化版本控制)

## 构建产物

每次发布会生成以下安装包：
- **Windows**: `.msi` 安装包
- **macOS**: `.dmg` 安装包 (支持 Intel 和 Apple Silicon)

## 注意事项

1. 确保所有测试通过后再创建正式版本
2. 发布说明应该包含新功能、改进和修复的详细信息
3. 正式版本应该经过充分测试，避免发布不稳定的代码
4. 创建 Release 后，GitHub Actions 会自动构建并上传安装包
5. 如果需要撤回发布，可以在 GitHub Releases 页面删除对应的发布

## 首次发布

如果这是项目的首次发布，建议：

1. 使用 GitHub Actions 创建 v1.0.0 版本
2. 等待构建完成后，检查 Releases 页面是否有安装包
3. 测试下载的安装包是否正常工作