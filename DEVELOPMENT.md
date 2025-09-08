# ScreenWatcher 开发指南

## 🚀 快速开始

### 1. 环境准备

确保你的开发环境包含以下工具：

```bash
# Node.js 版本要求
node --version  # >= 18.0.0
npm --version   # >= 9.0.0

# macOS 开发工具
xcode-select --install

# 可选：OCR 备选方案
brew install tesseract tesseract-lang
```

### 2. 项目设置

```bash
# 克隆项目
git clone <repository-url>
cd screen-watcher

# 安装依赖
npm install

# 首次运行前检查类型
npm run type-check
```

### 3. 开发模式启动

```bash
# 方式1：同时启动主进程和渲染进程
npm run dev

# 方式2：分别启动（推荐调试时使用）
npm run dev:main      # 终端1：启动主进程
npm run dev:renderer  # 终端2：启动渲染进程
```

### 4. 权限设置

首次运行时，需要授予以下权限：

1. **屏幕录制权限**（必需）
   - 系统偏好设置 → 安全性与隐私 → 隐私 → 屏幕录制
   - 添加 Electron 应用到允许列表

2. **辅助功能权限**（可选）
   - 系统偏好设置 → 安全性与隐私 → 隐私 → 辅助功能
   - 添加 Electron 应用到允许列表

## 🏗 架构设计

### 主进程 (Main Process)

```
src/main/
├── main.ts              # 应用程序入口点
├── window-manager.ts    # 窗口生命周期管理
├── tray-manager.ts      # 系统托盘集成
├── permission-manager.ts # macOS 权限处理
├── screen-capture.ts    # 屏幕捕获核心逻辑
├── ocr-service.ts      # OCR 文字识别
└── database.ts         # SQLite 数据库操作
```

### 渲染进程 (Renderer Process)

```
src/renderer/
├── components/         # 可复用 UI 组件
│   ├── Button/        # 按钮组件
│   ├── Panel/         # 面板组件
│   └── StatusIndicator/ # 状态指示器
├── pages/             # 页面组件
│   └── MainPanel.tsx  # 主控制面板
├── hooks/             # 自定义 React Hooks
│   └── useElectron.ts # Electron API 封装
├── styles/            # 样式系统
│   ├── variables.scss # 设计变量
│   ├── themes.scss    # 主题系统
│   └── main.scss      # 全局样式
└── index.tsx          # 渲染进程入口
```

### 进程间通信 (IPC)

```typescript
// 定义在 src/common/types.ts
export const IPC_CHANNELS = {
  // 窗口管理
  WINDOW_TOGGLE: 'window:toggle',
  WINDOW_SHOW: 'window:show',
  
  // 屏幕捕获
  CAPTURE_START: 'capture:start',
  CAPTURE_STOP: 'capture:stop',
  
  // 权限管理
  PERMISSIONS_CHECK: 'permissions:check',
  PERMISSIONS_REQUEST: 'permissions:request',
  
  // 数据操作
  DATA_SEARCH: 'data:search',
  DATA_STATISTICS: 'data:statistics',
} as const;
```

## 🎨 样式系统

### 设计令牌 (Design Tokens)

```scss
// src/renderer/styles/variables.scss

// 间距系统 (4px 基础单位)
$space-1: 4px;   // 微小间距
$space-2: 8px;   // 小间距
$space-3: 12px;  // 标准间距
$space-4: 16px;  // 中等间距

// 毛玻璃效果
$glass-blur: blur(20px) saturate(180%);
$glass-light: blur(15px) saturate(160%);

// 阴影层次
$shadow-1: 0 1px 3px rgba(0, 0, 0, 0.1);
$shadow-2: 0 2px 8px rgba(0, 0, 0, 0.15);
```

### 主题系统

```scss
// 深色主题（默认）
:root {
  --primary-color: #007AFF;
  --bg-primary: rgba(30, 30, 30, 0.85);
  --text-primary: rgba(255, 255, 255, 0.9);
}

// 明亮主题
[data-theme="light"] {
  --bg-primary: rgba(255, 255, 255, 0.85);
  --text-primary: rgba(0, 0, 0, 0.9);
}
```

### 组件开发规范

```typescript
// 组件结构示例
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(
        styles.button,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        { [styles.loading]: loading }
      )}
      disabled={loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};
```

## 🔧 核心服务开发

### 屏幕捕获服务

```typescript
// src/main/screen-capture.ts
export class ScreenCaptureService {
  async startContinuousCapture(
    options: CaptureOptions,
    callback: (result: CaptureResult) => void
  ): Promise<void> {
    // 实现连续屏幕捕获逻辑
  }
}
```

### OCR 识别服务

```typescript
// src/main/ocr-service.ts
export class OCRService {
  // macOS Vision Framework 优先
  async recognizeTextMacOS(imageDataURL: string): Promise<OCRResult>
  
  // Tesseract 备选方案
  async recognizeTextTesseract(imageDataURL: string): Promise<OCRResult>
}
```

### 数据库服务

```typescript
// src/main/database.ts
export class Database {
  async initialize(): Promise<void>
  async saveScreenshot(screenshot: Screenshot): Promise<number>
  async saveTextContent(content: TextContent): Promise<number>
  async searchTextContent(query: string): Promise<SearchResult[]>
}
```

## 🧪 测试策略

### 单元测试

```bash
# 运行单元测试
npm test

# 测试覆盖率
npm run test:coverage
```

### 集成测试

```bash
# 端到端测试
npm run test:e2e
```

### 测试文件结构

```
tests/
├── unit/              # 单元测试
│   ├── main/         # 主进程测试
│   └── renderer/     # 渲染进程测试
├── integration/      # 集成测试
└── e2e/              # 端到端测试
```

## 🚀 构建与发布

### 开发构建

```bash
# 编译 TypeScript
npm run build

# 编译主进程
npm run build:main

# 编译渲染进程  
npm run build:renderer
```

### 生产构建

```bash
# 完整构建并打包
npm run dist

# 仅生成 macOS 包
npm run dist:mac

# 生成开发版本包（用于测试）
npm run pack
```

### 构建输出

```
dist/
├── main/             # 主进程编译输出
│   └── main.js
├── renderer/         # 渲染进程编译输出
│   ├── index.html
│   ├── renderer.js
│   └── styles/
└── ScreenWatcher-1.0.0.dmg  # 最终安装包
```

## 🐛 调试技巧

### 主进程调试

```bash
# 启用 DevTools
export ELECTRON_IS_DEV=1
npm run dev:main
```

### 渲染进程调试

渲染进程可以直接在浏览器开发者工具中调试：

```typescript
// 开发模式下自动打开 DevTools
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools({ mode: 'detach' });
}
```

### 日志调试

```typescript
// 使用 console 对象进行日志输出
console.log('Debug info');
console.error('Error occurred');

// 生产环境下禁用 console
if (process.env.NODE_ENV !== 'development') {
  console.log = () => {};
}
```

## 📝 代码规范

### TypeScript 规范

```typescript
// 使用严格类型定义
interface User {
  id: number;
  name: string;
  email?: string;  // 可选属性
}

// 使用泛型
function createArray<T>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

// 使用联合类型
type Status = 'loading' | 'success' | 'error';
```

### React 组件规范

```typescript
// 使用函数组件和 Hooks
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<State>(initialState);
  
  useEffect(() => {
    // 副作用处理
  }, [dependencies]);
  
  return <div>{/* JSX */}</div>;
};
```

### 样式命名规范

```scss
// BEM 命名方式
.component {
  &__element {
    // 元素样式
  }
  
  &--modifier {
    // 修饰符样式
  }
  
  &:hover {
    // 状态样式
  }
}
```

## 🔄 Git 工作流

### 分支策略

```bash
main        # 主分支，用于发布
develop     # 开发分支
feature/*   # 功能分支
bugfix/*    # 修复分支
hotfix/*    # 热修复分支
```

### 提交规范

```bash
# 提交消息格式
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动

# 示例
git commit -m "feat: 添加OCR文字识别功能"
git commit -m "fix: 修复窗口显示位置问题"
```

## 🚨 常见问题

### Q: 应用启动时权限提示不显示？
A: 检查系统偏好设置中的权限状态，可能需要手动添加应用到权限列表。

### Q: OCR 识别准确率低？
A: 确保屏幕截图清晰度足够，可以调整捕获间隔和图像质量设置。

### Q: 应用占用内存过高？
A: 检查数据库大小，定期执行数据清理，优化图像处理流程。

### Q: 构建失败？
A: 检查 Node.js 版本，确保所有依赖正确安装，清除 node_modules 重新安装。

## 📚 学习资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [React 官方文档](https://reactjs.org/docs)
- [TypeScript 手册](https://www.typescriptlang.org/docs)
- [macOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple Vision Framework](https://developer.apple.com/documentation/vision)

---

**开发团队**: ScreenWatcher Team  
**最后更新**: 2025年1月8日