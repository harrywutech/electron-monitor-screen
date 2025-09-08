# ScreenWatcher Electron 应用部署配置方案

## 项目概述
ScreenWatcher是一个专业的macOS屏幕监听与智能分析工具，基于Electron框架开发。本文档提供了从开发到生产环境的完整部署配置方案。

## 目录
- [环境准备](#环境准备)
- [构建和打包配置](#构建和打包配置)
- [代码签名与公证](#代码签名与公证)
- [自动更新机制](#自动更新机制)
- [CI/CD配置](#cicd配置)
- [分发和部署](#分发和部署)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 环境准备

### 开发环境要求
- macOS 10.15+
- Node.js 18.0+
- Xcode Command Line Tools
- Apple Developer Account（用于代码签名）

### 依赖安装
```bash
# 安装项目依赖
npm install

# 安装全局工具
npm install -g electron-builder
```

## 构建和打包配置

### 1. electron-builder 完整配置

更新 `package.json` 中的build配置：

```json
{
  "build": {
    "productName": "ScreenWatcher",
    "appId": "com.screenwatcher.app",
    "artifactName": "${productName}-${version}-${arch}.${ext}",
    "directories": {
      "output": "dist",
      "buildResources": "build"
    },
    "files": [
      "dist/**/*",
      "assets/**/*",
      "package.json",
      "!src/**/*",
      "!**/*.ts",
      "!**/*.tsx"
    ],
    "extraResources": [
      {
        "from": "assets/",
        "to": "assets/",
        "filter": ["**/*"]
      }
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        },
        {
          "target": "zip",
          "arch": ["x64", "arm64"]
        }
      ],
      "icon": "build/icon.icns",
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "notarize": {
        "teamId": "YOUR_TEAM_ID"
      },
      "type": "distribution",
      "minimumSystemVersion": "10.15.0"
    },
    "dmg": {
      "title": "${productName} ${version}",
      "icon": "build/icon.icns",
      "iconSize": 128,
      "window": {
        "width": 580,
        "height": 400
      },
      "contents": [
        {
          "x": 144,
          "y": 180,
          "type": "file"
        },
        {
          "x": 436,
          "y": 180,
          "type": "link",
          "path": "/Applications"
        }
      ],
      "background": "build/dmg-background.png"
    },
    "publish": {
      "provider": "github",
      "releaseType": "release",
      "publishAutoUpdate": true
    },
    "afterSign": "scripts/notarize.js",
    "compression": "maximum"
  }
}
```

### 2. 权限配置文件

创建 `build/entitlements.mac.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.debugger</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.files.downloads.read-write</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <true/>
    <key>com.apple.security.device.microphone</key>
    <true/>
    <key>com.apple.security.device.usb</key>
    <true/>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
    <key>com.apple.security.temporary-exception.apple-events</key>
    <array>
        <string>com.apple.systemevents</string>
        <string>com.apple.finder</string>
    </array>
</dict>
</plist>
```

### 3. 构建脚本

更新 `package.json` scripts：

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:renderer\"",
    "dev:main": "cross-env NODE_ENV=development webpack --config webpack.main.config.js --watch",
    "dev:renderer": "cross-env NODE_ENV=development webpack serve --config webpack.renderer.config.js",
    "build": "npm run clean && npm run build:main && npm run build:renderer",
    "build:main": "cross-env NODE_ENV=production webpack --config webpack.main.config.js",
    "build:renderer": "cross-env NODE_ENV=production webpack --config webpack.renderer.config.js",
    "start": "electron .",
    "pack": "npm run build && electron-builder",
    "dist": "npm run build && electron-builder --publish=never",
    "dist:mac": "npm run build && electron-builder --mac --publish=never",
    "dist:mac-universal": "npm run build && electron-builder --mac --universal --publish=never",
    "release": "npm run build && electron-builder --publish=always",
    "release:draft": "npm run build && electron-builder --publish=onTagOrDraft",
    "clean": "rimraf dist build",
    "postinstall": "electron-builder install-app-deps",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "test": "jest",
    "test:e2e": "playwright test"
  }
}
```

## 代码签名与公证

### 1. Apple Developer 证书配置

#### 获取证书
1. 登录 [Apple Developer Portal](https://developer.apple.com)
2. 创建 Developer ID Application 证书
3. 下载并安装到 Keychain

#### 环境变量配置
```bash
# ~/.zshrc 或 ~/.bash_profile
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
export CSC_IDENTITY_AUTO_DISCOVERY=true
```

### 2. 公证脚本

创建 `scripts/notarize.js`：

```javascript
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log(`开始公证 ${appName}.app...`);

  return await notarize({
    tool: 'notarytool',
    appBundleId: 'com.screenwatcher.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

### 3. 代码签名验证

```bash
# 验证签名
codesign --verify --verbose=2 dist/mac/ScreenWatcher.app

# 检查公证状态
spctl --assess --verbose=2 dist/mac/ScreenWatcher.app
```

## 自动更新机制

### 1. electron-updater 集成

在主进程中添加自动更新逻辑 `src/main/updater.js`：

```javascript
const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const log = require('electron-log');

// 配置日志
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// 配置更新服务器
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-username',
  repo: 'screen-watcher',
  private: false
});

class AppUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupEvents();
  }

  setupEvents() {
    // 检查更新错误
    autoUpdater.on('error', (error) => {
      log.error('更新错误:', error);
      this.showUpdateError(error);
    });

    // 检查到更新
    autoUpdater.on('update-available', (info) => {
      log.info('发现更新:', info);
      this.showUpdateAvailable(info);
    });

    // 没有更新
    autoUpdater.on('update-not-available', (info) => {
      log.info('当前版本是最新的:', info);
    });

    // 下载进度
    autoUpdater.on('download-progress', (progressObj) => {
      let message = `下载速度: ${progressObj.bytesPerSecond}`;
      message += ` - 已下载 ${progressObj.percent}%`;
      message += ` (${progressObj.transferred}/${progressObj.total})`;
      log.info(message);
      
      // 发送进度到渲染进程
      this.mainWindow.webContents.send('download-progress', progressObj);
    });

    // 下载完成
    autoUpdater.on('update-downloaded', (info) => {
      log.info('更新下载完成:', info);
      this.showUpdateDownloaded();
    });
  }

  checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
  }

  showUpdateAvailable(info) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}`,
      detail: '是否立即下载更新？',
      buttons: ['立即下载', '稍后提醒'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  }

  showUpdateDownloaded() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '更新就绪',
      message: '更新已下载完成',
      detail: '应用将重启以应用更新',
      buttons: ['立即重启', '稍后重启'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }

  showUpdateError(error) {
    dialog.showErrorBox('更新错误', '检查更新时发生错误: ' + error.message);
  }
}

module.exports = AppUpdater;
```

### 2. 版本管理策略

#### 语义化版本控制
- `1.0.0` - 主要版本，重大功能更新
- `1.1.0` - 次要版本，新功能添加
- `1.1.1` - 补丁版本，bug修复

#### 预发布版本
```bash
# 发布测试版本
npm version prerelease --preid=beta
npm run release

# 发布候选版本
npm version prerelease --preid=rc
npm run release
```

## CI/CD配置

### 1. GitHub Actions 工作流

创建 `.github/workflows/release.yml`：

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-and-release:
    runs-on: macos-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Type check
      run: npm run type-check

    - name: Lint
      run: npm run lint

    - name: Import Apple certificate
      env:
        BUILD_CERTIFICATE_BASE64: ${{ secrets.BUILD_CERTIFICATE_BASE64 }}
        P12_PASSWORD: ${{ secrets.P12_PASSWORD }}
        KEYCHAIN_PASSWORD: ${{ secrets.KEYCHAIN_PASSWORD }}
      run: |
        # 创建临时keychain
        security create-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
        security default-keychain -s build.keychain
        security unlock-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
        
        # 导入证书
        echo $BUILD_CERTIFICATE_BASE64 | base64 --decode > certificate.p12
        security import certificate.p12 -k build.keychain -P "$P12_PASSWORD" -T /usr/bin/codesign
        security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" build.keychain
        
        # 清理
        rm certificate.p12

    - name: Build and Release
      env:
        GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        APPLE_ID: ${{ secrets.APPLE_ID }}
        APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
        APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
      run: |
        npm run build
        npm run release

    - name: Upload Release Assets
      uses: softprops/action-gh-release@v1
      with:
        files: |
          dist/*.dmg
          dist/*.zip
          dist/latest-mac.yml
        draft: false
        prerelease: false
        generate_release_notes: true
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

    - name: Cleanup keychain
      if: always()
      run: |
        security delete-keychain build.keychain || true
```

### 2. 开发环境工作流

创建 `.github/workflows/test.yml`：

```yaml
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: macos-latest
    
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run type check
      run: npm run type-check

    - name: Run tests
      run: npm test

    - name: Test build
      run: npm run build
```

### 3. 自动版本管理

创建 `.github/workflows/version.yml`：

```yaml
name: Version Management

on:
  workflow_dispatch:
    inputs:
      version-type:
        description: 'Version type (patch, minor, major, prerelease)'
        required: true
        default: 'patch'
        type: choice
        options:
        - patch
        - minor
        - major
        - prerelease

jobs:
  version:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        token: ${{ secrets.PAT_TOKEN }}

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Configure Git
      run: |
        git config user.name "github-actions[bot]"
        git config user.email "github-actions[bot]@users.noreply.github.com"

    - name: Bump version
      run: |
        npm version ${{ github.event.inputs.version-type }} --no-git-tag-version
        
    - name: Commit changes
      run: |
        git add package.json package-lock.json
        git commit -m "chore: bump version to $(node -p "require('./package.json').version")"
        
    - name: Create tag
      run: |
        VERSION=$(node -p "require('./package.json').version")
        git tag -a "v$VERSION" -m "Release v$VERSION"
        
    - name: Push changes
      run: |
        git push origin main
        git push origin --tags
```

## 分发和部署

### 1. 官网部署方案

#### 静态网站结构
```
website/
├── index.html
├── download/
│   ├── index.html
│   └── latest/
├── docs/
├── assets/
└── releases/
```

#### 下载页面模板 `website/download/index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>下载 ScreenWatcher</title>
    <style>
        /* 下载页面样式 */
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container { 
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 20px;
            text-align: center;
        }
        .hero {
            background: white;
            border-radius: 20px;
            padding: 60px 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            margin-bottom: 40px;
        }
        .download-btn {
            display: inline-block;
            padding: 16px 32px;
            background: #007AFF;
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            margin: 10px;
            transition: all 0.3s ease;
        }
        .download-btn:hover {
            background: #0056CC;
            transform: translateY(-2px);
        }
        .system-requirements {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 12px;
            margin: 40px 0;
            text-align: left;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin: 50px 0;
        }
        .feature {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>ScreenWatcher</h1>
            <p>专业的 macOS 屏幕监听与智能分析工具</p>
            
            <div id="download-section">
                <a href="#" id="download-intel" class="download-btn">
                    下载 Intel 版本
                </a>
                <a href="#" id="download-apple" class="download-btn">
                    下载 Apple Silicon 版本
                </a>
                <a href="#" id="download-universal" class="download-btn">
                    下载通用版本
                </a>
            </div>
            
            <p>版本: <span id="version">加载中...</span> | 更新日期: <span id="release-date">加载中...</span></p>
        </div>
        
        <div class="system-requirements">
            <h3>系统要求</h3>
            <ul>
                <li>macOS 10.15 (Catalina) 或更高版本</li>
                <li>至少 100MB 可用存储空间</li>
                <li>屏幕录制权限（首次运行时会提示授权）</li>
            </ul>
        </div>
        
        <div class="features">
            <div class="feature">
                <h3>实时监控</h3>
                <p>智能监控屏幕变化，捕获重要信息</p>
            </div>
            <div class="feature">
                <h3>数据分析</h3>
                <p>智能分析截图内容，提取关键数据</p>
            </div>
            <div class="feature">
                <h3>隐私安全</h3>
                <p>所有数据本地处理，保护用户隐私</p>
            </div>
        </div>
    </div>

    <script>
        // 自动检测发布信息
        async function loadReleaseInfo() {
            try {
                const response = await fetch('https://api.github.com/repos/your-username/screen-watcher/releases/latest');
                const data = await response.json();
                
                document.getElementById('version').textContent = data.tag_name;
                document.getElementById('release-date').textContent = new Date(data.published_at).toLocaleDateString('zh-CN');
                
                // 设置下载链接
                const assets = data.assets;
                const intelAsset = assets.find(asset => asset.name.includes('x64'));
                const appleAsset = assets.find(asset => asset.name.includes('arm64'));
                const universalAsset = assets.find(asset => asset.name.includes('universal'));
                
                if (intelAsset) {
                    document.getElementById('download-intel').href = intelAsset.browser_download_url;
                }
                if (appleAsset) {
                    document.getElementById('download-apple').href = appleAsset.browser_download_url;
                }
                if (universalAsset) {
                    document.getElementById('download-universal').href = universalAsset.browser_download_url;
                }
                
            } catch (error) {
                console.error('加载发布信息失败:', error);
                document.getElementById('version').textContent = '加载失败';
                document.getElementById('release-date').textContent = '加载失败';
            }
        }
        
        loadReleaseInfo();
    </script>
</body>
</html>
```

### 2. CDN配置建议

#### Cloudflare 配置
```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 重定向到最新版本
  if (url.pathname === '/download/latest') {
    const response = await fetch('https://api.github.com/repos/your-username/screen-watcher/releases/latest')
    const data = await response.json()
    const dmgAsset = data.assets.find(asset => asset.name.endsWith('.dmg'))
    
    return Response.redirect(dmgAsset.browser_download_url, 302)
  }
  
  return fetch(request)
}
```

### 3. 用户安装指南

创建 `INSTALL_GUIDE.md`：

```markdown
# ScreenWatcher 安装指南

## 系统要求
- macOS 10.15 (Catalina) 或更高版本
- 至少 100MB 可用存储空间

## 安装步骤

### 1. 下载应用
访问 [官方下载页面](https://screenwatcher.app/download) 下载适合您系统的版本：
- Intel 处理器：下载 x64 版本
- Apple Silicon (M1/M2/M3)：下载 arm64 版本
- 不确定：下载通用版本

### 2. 安装应用
1. 双击下载的 `.dmg` 文件
2. 将 ScreenWatcher 拖拽到 Applications 文件夹
3. 弹出安装盘映像

### 3. 首次启动
1. 在应用程序文件夹中找到 ScreenWatcher
2. 右键点击，选择"打开"
3. 在安全提示中点击"打开"

### 4. 权限设置
首次运行时，ScreenWatcher 需要以下权限：

#### 屏幕录制权限
1. 系统会弹出权限请求对话框
2. 点击"打开系统偏好设置"
3. 在"安全性与隐私" > "隐私" > "屏幕录制"中勾选 ScreenWatcher
4. 重启应用生效

#### 辅助功能权限（可选）
1. 系统偏好设置 > 安全性与隐私 > 隐私 > 辅助功能
2. 点击锁图标并输入密码
3. 勾选 ScreenWatcher

## 常见问题

### Q: 应用无法打开，提示"无法验证开发者"
A: 这是macOS的安全机制。解决方法：
1. 右键点击应用，选择"打开"
2. 或在系统偏好设置 > 安全性与隐私 > 通用中点击"仍要打开"

### Q: 应用运行但无法截图
A: 请检查屏幕录制权限是否已开启，并重启应用。

### Q: 应用占用内存过高
A: 这是正常现象，可以在设置中调整监控频率或启用节能模式。

## 卸载应用
1. 退出 ScreenWatcher 应用
2. 将应用程序文件夹中的 ScreenWatcher 移到废纸篓
3. 清理残留文件：
   ```bash
   rm -rf ~/Library/Application\ Support/ScreenWatcher
   rm -rf ~/Library/Preferences/com.screenwatcher.app.plist
   rm -rf ~/Library/Logs/ScreenWatcher
   ```

## 技术支持
- 官方网站：https://screenwatcher.app
- GitHub Issues：https://github.com/your-username/screen-watcher/issues
- 邮箱支持：support@screenwatcher.app
```

## 监控和维护

### 1. 错误报告收集

集成 Sentry 进行错误监控 `src/main/sentry.js`：

```javascript
const Sentry = require('@sentry/electron/main');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  beforeSend(event) {
    // 过滤敏感信息
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  }
});

module.exports = Sentry;
```

### 2. 使用统计分析

集成 Google Analytics `src/renderer/analytics.js`：

```javascript
import { gtag } from 'ga-gtag';

class Analytics {
  constructor() {
    this.isEnabled = false;
    this.init();
  }

  init() {
    // 检查用户是否同意统计
    const consent = localStorage.getItem('analytics-consent');
    if (consent === 'true') {
      this.enable();
    }
  }

  enable() {
    gtag('config', 'GA_MEASUREMENT_ID', {
      anonymize_ip: true,
      app_name: 'ScreenWatcher',
      app_version: process.env.REACT_APP_VERSION
    });
    this.isEnabled = true;
  }

  trackEvent(action, category = 'General', label = '', value = 0) {
    if (!this.isEnabled) return;
    
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }

  trackScreenView(screenName) {
    if (!this.isEnabled) return;
    
    gtag('event', 'screen_view', {
      screen_name: screenName
    });
  }

  trackError(error, fatal = false) {
    if (!this.isEnabled) return;
    
    gtag('event', 'exception', {
      description: error.message,
      fatal: fatal
    });
  }
}

export default new Analytics();
```

### 3. 性能监控

创建性能监控模块 `src/main/performance.js`：

```javascript
const os = require('os');
const { app } = require('electron');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: Date.now(),
      memoryUsage: [],
      cpuUsage: []
    };
    
    this.startMonitoring();
  }

  startMonitoring() {
    // 每30秒收集一次性能数据
    setInterval(() => {
      this.collectMetrics();
    }, 30000);
  }

  collectMetrics() {
    const metrics = {
      timestamp: Date.now(),
      memory: {
        used: process.memoryUsage(),
        system: {
          total: os.totalmem(),
          free: os.freemem()
        }
      },
      cpu: {
        usage: process.cpuUsage(),
        load: os.loadavg()
      },
      uptime: process.uptime()
    };

    // 保存最近100条记录
    this.metrics.memoryUsage.push(metrics.memory);
    this.metrics.cpuUsage.push(metrics.cpu);
    
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }
    if (this.metrics.cpuUsage.length > 100) {
      this.metrics.cpuUsage.shift();
    }

    // 检查异常情况
    this.checkPerformanceIssues(metrics);
  }

  checkPerformanceIssues(metrics) {
    const memoryUsageMB = metrics.memory.used.heapUsed / 1024 / 1024;
    
    // 内存使用超过500MB时警告
    if (memoryUsageMB > 500) {
      console.warn(`High memory usage detected: ${memoryUsageMB.toFixed(2)}MB`);
      
      // 发送到监控服务
      this.reportPerformanceIssue('high_memory_usage', {
        usage: memoryUsageMB,
        threshold: 500
      });
    }
  }

  reportPerformanceIssue(type, data) {
    // 发送到监控服务（如Sentry）
    if (global.sentry) {
      global.sentry.addBreadcrumb({
        category: 'performance',
        message: `Performance issue: ${type}`,
        level: 'warning',
        data: data
      });
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      currentUsage: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      }
    };
  }
}

module.exports = PerformanceMonitor;
```

### 4. 用户反馈渠道

创建反馈收集系统 `src/renderer/feedback.js`：

```javascript
class FeedbackSystem {
  constructor() {
    this.feedbackEndpoint = 'https://api.screenwatcher.app/feedback';
  }

  async submitFeedback(data) {
    const feedback = {
      ...data,
      timestamp: new Date().toISOString(),
      version: await window.electronAPI.getAppVersion(),
      platform: await window.electronAPI.getPlatform(),
      userId: this.generateAnonymousId()
    };

    try {
      const response = await fetch(this.feedbackEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedback)
      });

      if (response.ok) {
        this.showThankYouMessage();
        return true;
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      this.showErrorMessage();
      return false;
    }
  }

  generateAnonymousId() {
    let id = localStorage.getItem('anonymous-user-id');
    if (!id) {
      id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('anonymous-user-id', id);
    }
    return id;
  }

  showFeedbackDialog() {
    // 创建反馈对话框UI
    const dialog = document.createElement('div');
    dialog.className = 'feedback-dialog';
    dialog.innerHTML = `
      <div class="feedback-dialog-content">
        <h3>反馈建议</h3>
        <form id="feedback-form">
          <div class="form-group">
            <label>反馈类型</label>
            <select name="type" required>
              <option value="">请选择</option>
              <option value="bug">Bug报告</option>
              <option value="feature">功能建议</option>
              <option value="improvement">体验改进</option>
              <option value="other">其他</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>详细描述</label>
            <textarea name="description" rows="5" required 
                      placeholder="请详细描述您遇到的问题或建议..."></textarea>
          </div>
          
          <div class="form-group">
            <label>联系邮箱（可选）</label>
            <input type="email" name="email" 
                   placeholder="如需回复，请留下邮箱地址">
          </div>
          
          <div class="form-actions">
            <button type="button" onclick="this.closest('.feedback-dialog').remove()">
              取消
            </button>
            <button type="submit">提交反馈</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(dialog);

    // 处理表单提交
    const form = dialog.querySelector('#feedback-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const feedbackData = {
        type: formData.get('type'),
        description: formData.get('description'),
        email: formData.get('email')
      };

      const success = await this.submitFeedback(feedbackData);
      if (success) {
        dialog.remove();
      }
    });
  }

  showThankYouMessage() {
    // 显示感谢消息
    const notification = document.createElement('div');
    notification.className = 'feedback-notification success';
    notification.textContent = '感谢您的反馈！我们会认真考虑您的建议。';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showErrorMessage() {
    const notification = document.createElement('div');
    notification.className = 'feedback-notification error';
    notification.textContent = '提交失败，请稍后重试或发送邮件至 support@screenwatcher.app';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

export default new FeedbackSystem();
```

## 故障排除

### 1. 常见构建问题

#### 代码签名失败
```bash
# 检查证书
security find-identity -v -p codesigning

# 重新安装证书
security delete-certificate -c "Developer ID Application: Your Name"
# 重新从Apple Developer Portal下载并安装
```

#### 公证失败
```bash
# 检查公证状态
xcrun notarytool history --apple-id your-apple-id@example.com --team-id YOUR_TEAM_ID

# 查看公证日志
xcrun notarytool log SUBMISSION_ID --apple-id your-apple-id@example.com --team-id YOUR_TEAM_ID
```

#### 构建依赖问题
```bash
# 清理构建缓存
npm run clean
rm -rf node_modules package-lock.json
npm install

# 重建native模块
npm run postinstall
```

### 2. 性能优化

#### 减少应用大小
```javascript
// webpack.config.js 优化配置
module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
            drop_debugger: true
          }
        }
      })
    ]
  }
};
```

#### 启动速度优化
```javascript
// main.js 延迟加载
app.whenReady().then(async () => {
  // 优先创建窗口
  createWindow();
  
  // 延迟初始化非关键服务
  setTimeout(() => {
    initializeServices();
  }, 1000);
});
```

### 3. 调试技巧

#### 主进程调试
```bash
# 启用inspector
electron --inspect=5858 .

# Chrome DevTools
# 打开 chrome://inspect
```

#### 渲染进程调试
```javascript
// 在开发模式下自动打开DevTools
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

#### 日志配置
```javascript
const log = require('electron-log');

// 配置日志级别
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// 设置日志格式
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
```

## 最佳实践建议

### 1. 安全最佳实践
- 启用上下文隔离（contextIsolation）
- 禁用Node.js集成（nodeIntegration: false）
- 使用preload脚本安全地暴露API
- 验证所有用户输入
- 定期更新依赖包

### 2. 性能最佳实践
- 使用lazy loading延迟加载组件
- 优化图片和资源文件
- 实现内存管理和垃圾回收
- 监控应用性能指标

### 3. 用户体验最佳实践
- 提供清晰的安装指南
- 实现平滑的自动更新
- 提供详细的错误信息
- 支持用户反馈收集

---

通过以上配置，您现在拥有了一套完整的ScreenWatcher Electron应用部署方案。这套方案涵盖了从开发、构建、签名、发布到监控的全流程，确保您的应用能够安全、稳定地分发给用户。