# 发布指南

## 如何创建正式版本

### 自动发布 (推荐)

在提交消息中添加自动发布标记：
```bash
git commit -m "feat: 添加新功能 [auto-release:v1.0.1]"
git push
```

CI 构建成功后会自动创建 GitHub Release 并构建安装包。

### 手动发布

直接在 GitHub 仓库页面创建 Release：
1. 访问 GitHub 仓库页面
2. 点击 "Releases" → "Create a new release"
3. 输入标签 (如 v1.0.1) 和发布说明
4. 点击 "Publish release"
5. 系统会自动构建并上传安装包



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

## 自动发布说明

### 触发条件
- CI 构建成功
- 提交消息包含 `[auto-release:v1.0.1]` 格式的标记

### 标记格式
```
[auto-release:v主版本.次版本.修订号]
```

### 示例
```bash
# 修复 bug 并发布补丁版本
git commit -m "fix: 修复邮件删除问题 [auto-release:v1.0.1]"

# 添加新功能并发布次版本
git commit -m "feat: 添加邮件导出功能 [auto-release:v1.1.0]"

# 重大更新并发布主版本
git commit -m "feat!: 重构邮件存储架构 [auto-release:v2.0.0]"
```

## 首次发布

如果这是项目的首次发布，建议：

1. 使用自动发布: `git commit -m "chore: 首次发布 [auto-release:v1.0.0]"`
2. 或使用 GitHub Actions 手动创建 v1.0.0 版本
3. 等待构建完成后，检查 Releases 页面是否有安装包
4. 测试下载的安装包是否正常工作