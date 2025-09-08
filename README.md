# ScreenWatcher

**ScreenWatcher** 是一款专为 macOS 设计的屏幕监听与智能分析工具，基于 Electron + React + TypeScript 技术栈开发，提供透明化的屏幕内容捕获、OCR 文字识别和本地数据存储功能。

## 🌟 核心特性

- **🎯 屏幕监听**: 实时监控活动窗口内容变化，智能识别重要信息
- **🔍 OCR 识别**: 集成 Apple Vision Framework，支持中英文混合识别
- **💾 本地存储**: 使用 SQLite 数据库，所有数据完全本地化，保护隐私安全
- **🎨 毛玻璃界面**: 85% 透明度的优雅界面设计，与 macOS 完美融合
- **⌨️ 快捷键控制**: Command + \ 快捷键快速唤起控制面板
- **📊 智能统计**: 提供详细的使用统计和数据可视化
- **🔐 权限管理**: 完整的 macOS 系统权限管理和用户引导

## 📋 系统要求

- macOS 11.0+ (Big Sur 或更新版本)
- 支持 Intel 和 Apple Silicon (M1/M2) 处理器
- 屏幕录制权限
- 辅助功能权限（可选）

## 🛠 技术架构

```
┌─────────────────────────────────────┐
│           前端界面层                   │
│     React + TypeScript + SCSS      │
├─────────────────────────────────────┤
│           Electron 主进程             │
│    窗口管理 | 系统集成 | IPC 通信      │
├─────────────────────────────────────┤
│           核心服务层                   │
│  屏幕捕获 | OCR识别 | 数据存储 | 权限   │
├─────────────────────────────────────┤
│           系统集成层                   │
│  macOS APIs | SQLite | Vision Kit   │
└─────────────────────────────────────┘
```

## 📁 项目结构

```
screen-watcher/
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── main.ts          # 主进程入口
│   │   ├── window-manager.ts # 窗口管理器
│   │   ├── tray-manager.ts   # 系统托盘管理
│   │   ├── permission-manager.ts # 权限管理
│   │   ├── screen-capture.ts # 屏幕捕获服务
│   │   ├── ocr-service.ts   # OCR 识别服务
│   │   └── database.ts      # 数据库服务
│   ├── renderer/             # React 渲染进程
│   │   ├── components/      # UI 组件库
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # React Hooks
│   │   ├── styles/          # 样式系统
│   │   └── index.tsx        # 渲染进程入口
│   ├── preload/             # 预加载脚本
│   │   └── preload.ts       # IPC 桥接
│   └── common/              # 公共类型定义
│       └── types.ts         # TypeScript 类型
├── assets/                  # 静态资源
├── build/                   # 构建配置
└── dist/                    # 编译输出
```

## 🚀 开发指南

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd screen-watcher

# 安装依赖
npm install

# 可选：安装 Tesseract OCR (备选方案)
brew install tesseract tesseract-lang
```

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 分别启动主进程和渲染进程
npm run dev:main    # 主进程
npm run dev:renderer # 渲染进程
```

### 构建打包

```bash
# 编译项目
npm run build

# 打包应用 (macOS)
npm run dist:mac

# 生成 DMG 安装包
npm run pack
```

### 代码检查

```bash
# TypeScript 类型检查
npm run type-check

# ESLint 代码检查
npm run lint
npm run lint:fix
```

## 🎨 界面设计

ScreenWatcher 采用现代 Glassmorphism 设计语言：

- **主窗口**: 320×288px，85% 透明度毛玻璃效果
- **设计系统**: 基于 macOS Human Interface Guidelines
- **主题支持**: 自动跟随系统明暗主题切换
- **响应式**: 支持不同分辨率和显示器配置

## 🔧 核心功能模块

### 屏幕捕获
- 基于 Electron desktopCapturer API
- 支持全屏幕和指定窗口捕获
- 智能内容变化检测，避免重复处理

### OCR 文字识别
- 优先使用 macOS Vision Framework
- Tesseract 作为备选方案
- 支持中英文混合识别，准确率 >95%

### 数据存储
- SQLite 数据库，支持全文搜索
- 完整的数据模型设计
- 自动数据清理和优化

### 权限管理
- 完整的 macOS 权限检查
- 用户友好的权限引导界面
- 动态权限状态监听

## ⌨️ 快捷键

- `Command + \` - 显示/隐藏主控制面板
- `Command + ,` - 打开设置界面
- `Command + Q` - 退出应用
- `Escape` - 关闭当前窗口

## 📊 数据模型

### 截图表 (screenshots)
```sql
CREATE TABLE screenshots (
  id INTEGER PRIMARY KEY,
  timestamp DATETIME NOT NULL,
  window_title TEXT,
  app_name TEXT,
  content_hash TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 文本内容表 (text_contents)
```sql
CREATE TABLE text_contents (
  id INTEGER PRIMARY KEY,
  screenshot_id INTEGER,
  content TEXT NOT NULL,
  bounding_box TEXT,
  confidence REAL,
  language TEXT,
  FOREIGN KEY (screenshot_id) REFERENCES screenshots(id)
);
```

## 🛡️ 隐私与安全

- **本地优先**: 所有数据完全存储在本地，不上传云端
- **权限控制**: 严格按需申请系统权限，透明度高
- **数据加密**: 敏感数据采用加密存储
- **用户控制**: 用户完全控制数据的保留和删除

## 🤝 开发贡献

### 代码规范
- TypeScript 严格模式
- ESLint + Prettier 代码格式化
- 遵循 Conventional Commits 规范

### 测试
```bash
# 单元测试
npm test

# 端到端测试
npm run test:e2e
```

### 提交规范
```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 📝 更新日志

### v1.0.0 (2025-01-08)
- ✨ 初始版本发布
- 🎯 实现核心屏幕监听功能
- 🔍 集成 OCR 文字识别
- 💾 完善本地数据存储
- 🎨 毛玻璃界面设计
- 🔐 完整的权限管理系统

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙋‍♂️ 支持与反馈

- 📧 Email: support@screenwatcher.app
- 🐛 Issue: [GitHub Issues](https://github.com/screenwatcher/issues)
- 💬 讨论: [GitHub Discussions](https://github.com/screenwatcher/discussions)

---

**开发团队**: ScreenWatcher Team  
**最后更新**: 2025年1月8日