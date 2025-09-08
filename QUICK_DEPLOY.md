# ScreenWatcher 快速部署指南

## 🚀 快速开始

### 1. 环境准备（5分钟）

```bash
# 检查 Node.js 版本（需要 18+）
node --version

# 检查是否安装 Xcode Command Line Tools
xcode-select --install

# 安装依赖
npm install
```

### 2. 本地开发测试（2分钟）

```bash
# 开发模式启动
npm run dev

# 或直接运行构建版本
npm run build
npm start
```

### 3. 构建应用包（5分钟）

```bash
# 构建 macOS 应用（不发布）
npm run dist:mac

# 生成的文件在 dist/ 目录：
# - ScreenWatcher-1.0.0-x64.dmg
# - ScreenWatcher-1.0.0-arm64.dmg
```

## 📦 生产环境部署

### 1. 配置 Apple Developer 证书

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 编辑 .env 文件，设置以下变量：
# APPLE_ID=your-apple-id@example.com
# APPLE_ID_PASSWORD=app-specific-password
# APPLE_TEAM_ID=YOUR_TEAM_ID
```

### 2. 设置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

| Secret 名称 | 描述 |
|-------------|------|
| `BUILD_CERTIFICATE_BASE64` | Base64编码的.p12证书文件 |
| `P12_PASSWORD` | 证书密码 |
| `KEYCHAIN_PASSWORD` | 临时keychain密码 |
| `APPLE_ID` | Apple ID邮箱 |
| `APPLE_ID_PASSWORD` | App专用密码 |
| `APPLE_TEAM_ID` | Apple团队ID |

### 3. 自动发布

```bash
# 创建版本标签并推送
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions 将自动：
# 1. 构建应用
# 2. 代码签名
# 3. 公证应用
# 4. 创建 GitHub Release
# 5. 上传安装包
```

## 🛠️ 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm start               # 运行构建后的应用

# 测试
npm run lint            # 代码检查
npm run type-check      # 类型检查
npm test               # 运行测试

# 构建
npm run pack           # 打包应用（不分发）
npm run dist           # 构建分发版本
npm run dist:mac       # 构建 macOS 版本
npm run dist:mac-universal  # 构建通用版本

# 发布
npm run release        # 发布到 GitHub
npm run release:draft  # 创建草稿发布
```

## 🔧 故障排除

### 构建失败

```bash
# 清理缓存重新构建
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 代码签名问题

```bash
# 检查证书
security find-identity -v -p codesigning

# 验证签名
codesign --verify --verbose=2 dist/mac/ScreenWatcher.app
```

### 权限问题

检查 `build/entitlements.mac.plist` 中的权限配置是否正确。

## 📋 发布检查清单

发布前确认：

- [ ] 版本号已更新
- [ ] 所有测试通过
- [ ] 代码已推送到 main 分支
- [ ] Apple 证书有效
- [ ] GitHub Secrets 已设置
- [ ] 更新日志已准备

## 🚀 一键部署脚本

创建 `scripts/deploy.sh`：

```bash
#!/bin/bash
set -e

echo "🚀 开始部署 ScreenWatcher..."

# 检查版本参数
if [ -z "$1" ]; then
  echo "❌ 请提供版本号: ./deploy.sh 1.0.0"
  exit 1
fi

VERSION=$1

echo "📝 更新版本号到 $VERSION..."
npm version $VERSION --no-git-tag-version

echo "🔍 运行测试..."
npm run lint
npm run type-check

echo "🏗️  构建应用..."
npm run build

echo "📦 打包应用..."
npm run dist:mac

echo "🏷️  创建 Git 标签..."
git add package.json package-lock.json
git commit -m "chore: bump version to $VERSION"
git tag "v$VERSION"
git push origin main
git push origin "v$VERSION"

echo "✅ 部署完成！GitHub Actions 将自动处理发布流程。"
echo "🔗 查看进度: https://github.com/your-username/screen-watcher/actions"
```

使用方法：

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh 1.0.0
```

---

📖 更多详细信息请参考 [完整部署文档](./DEPLOYMENT.md)