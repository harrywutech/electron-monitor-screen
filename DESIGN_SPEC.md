# ScreenWatcher - macOS屏幕监听软件设计规范文档

## 1. 设计概述

### 1.1 设计理念
ScreenWatcher采用现代Glassmorphism设计语言，以半透明毛玻璃效果为核心，打造轻量级、非干扰性的桌面监听工具。设计重点强调与macOS系统的深度融合和原生体验。

### 1.2 目标用户
- macOS用户
- 需要屏幕内容监听和OCR处理的专业用户
- 追求简洁高效桌面工具的用户

### 1.3 设计原则
- **极简主义**：界面元素精简，避免视觉干扰
- **原生融合**：深度集成macOS设计语言和交互规范
- **透明优雅**：利用毛玻璃效果营造轻盈感
- **功能直达**：通过快捷键实现快速访问
- **响应迅速**：界面反馈即时，动画流畅

### 1.4 平台策略
- **主平台**：macOS 11.0+
- **适配策略**：优先适配最新macOS版本特性
- **性能优化**：针对Electron应用特点进行视觉优化

## 2. 设计系统基础

### 2.1 色彩系统

#### 深色主题色板（Primary Theme）
```css
/* 主要色彩 */
--primary-color: #007AFF;           /* 系统蓝 - 主操作色 */
--primary-hover: #0056CC;           /* 主色悬停态 */
--primary-active: #004499;          /* 主色激活态 */

/* 背景色系 */
--bg-primary: rgba(30, 30, 30, 0.85);    /* 主背景 - 85%透明度 */
--bg-secondary: rgba(45, 45, 45, 0.9);   /* 次级背景 - 90%透明度 */
--bg-tertiary: rgba(60, 60, 60, 0.8);    /* 第三级背景 */
--bg-overlay: rgba(0, 0, 0, 0.6);        /* 遮罩背景 */

/* 表面色系 */
--surface-1: rgba(255, 255, 255, 0.1);   /* 一级表面 */
--surface-2: rgba(255, 255, 255, 0.15);  /* 二级表面 */
--surface-3: rgba(255, 255, 255, 0.2);   /* 三级表面 */

/* 文字色系 */
--text-primary: rgba(255, 255, 255, 0.9);    /* 主要文字 */
--text-secondary: rgba(255, 255, 255, 0.7);  /* 次要文字 */
--text-tertiary: rgba(255, 255, 255, 0.5);   /* 辅助文字 */
--text-disabled: rgba(255, 255, 255, 0.3);   /* 禁用文字 */

/* 边框色系 */
--border-1: rgba(255, 255, 255, 0.1);        /* 一级边框 */
--border-2: rgba(255, 255, 255, 0.15);       /* 二级边框 */
--border-3: rgba(255, 255, 255, 0.2);        /* 三级边框 */

/* 状态色系 */
--success: #30D158;               /* 成功 */
--warning: #FF9F0A;               /* 警告 */
--error: #FF453A;                 /* 错误 */
--info: #64D2FF;                  /* 信息 */
```

#### 明亮主题色板（Light Theme）
```css
/* 主要色彩 */
--primary-color: #007AFF;
--primary-hover: #0056CC;
--primary-active: #004499;

/* 背景色系 */
--bg-primary: rgba(255, 255, 255, 0.85);
--bg-secondary: rgba(250, 250, 250, 0.9);
--bg-tertiary: rgba(245, 245, 245, 0.8);
--bg-overlay: rgba(0, 0, 0, 0.3);

/* 表面色系 */
--surface-1: rgba(0, 0, 0, 0.05);
--surface-2: rgba(0, 0, 0, 0.08);
--surface-3: rgba(0, 0, 0, 0.1);

/* 文字色系 */
--text-primary: rgba(0, 0, 0, 0.9);
--text-secondary: rgba(0, 0, 0, 0.7);
--text-tertiary: rgba(0, 0, 0, 0.5);
--text-disabled: rgba(0, 0, 0, 0.3);

/* 边框色系 */
--border-1: rgba(0, 0, 0, 0.1);
--border-2: rgba(0, 0, 0, 0.15);
--border-3: rgba(0, 0, 0, 0.2);
```

### 2.2 字体规范

#### 字体族
```css
/* macOS系统字体栈 */
--font-system: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-mono: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
```

#### 字体规格
| 级别 | 字号 | 字重 | 行高 | 字间距 | 使用场景 |
|:----:|:----:|:----:|:----:|:----:|:----:|
| Display | 28px | 600 | 1.2 | -0.5px | 主标题、品牌标识 |
| Title 1 | 22px | 600 | 1.3 | -0.3px | 页面标题 |
| Title 2 | 18px | 600 | 1.4 | -0.2px | 区域标题 |
| Title 3 | 16px | 600 | 1.4 | -0.1px | 组件标题 |
| Body | 14px | 400 | 1.5 | 0px | 正文内容 |
| Caption | 12px | 400 | 1.4 | 0px | 辅助信息 |
| Label | 11px | 500 | 1.3 | 0.1px | 标签、按钮 |

### 2.3 间距和栅格系统

#### 间距规范
```css
/* 基础间距单位：4px */
--space-1: 4px;    /* 微小间距 */
--space-2: 8px;    /* 小间距 */
--space-3: 12px;   /* 标准间距 */
--space-4: 16px;   /* 中等间距 */
--space-5: 20px;   /* 大间距 */
--space-6: 24px;   /* 很大间距 */
--space-8: 32px;   /* 超大间距 */
--space-10: 40px;  /* 巨大间距 */
--space-12: 48px;  /* 特大间距 */
```

#### 组件间距应用
- **组件内部padding**：12px, 16px, 20px
- **组件间margin**：8px, 16px, 24px
- **页面边距**：20px（紧凑），24px（标准）
- **内容区域间距**：32px, 40px

### 2.4 阴影和层次系统

#### 阴影级别
```css
/* 毛玻璃背景滤镜 */
--glass-blur: blur(20px) saturate(180%);
--glass-light: blur(15px) saturate(160%);
--glass-subtle: blur(10px) saturate(140%);

/* 阴影系统 */
--shadow-1: 0 1px 3px rgba(0, 0, 0, 0.1);                    /* 轻微提升 */
--shadow-2: 0 2px 8px rgba(0, 0, 0, 0.15);                   /* 标准提升 */
--shadow-3: 0 4px 16px rgba(0, 0, 0, 0.2);                   /* 明显提升 */
--shadow-4: 0 8px 32px rgba(0, 0, 0, 0.25);                  /* 强烈提升 */
--shadow-focus: 0 0 0 3px rgba(0, 122, 255, 0.3);            /* 焦点阴影 */

/* 内阴影（毛玻璃内发光） */
--inner-glow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
--inner-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
```

#### 层次z-index
```css
--z-base: 0;           /* 基础层 */
--z-elevated: 10;      /* 提升元素 */
--z-overlay: 100;      /* 覆盖层 */
--z-modal: 1000;       /* 模态框 */
--z-toast: 2000;       /* 通知提示 */
--z-tooltip: 3000;     /* 工具提示 */
```

### 2.5 透明度和毛玻璃效果规范

#### 毛玻璃效果实现
```css
/* 主面板毛玻璃效果 */
.glass-panel {
  background: var(--bg-primary);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border-1);
  box-shadow: var(--shadow-2), var(--inner-glow);
}

/* 弹出层毛玻璃效果 */
.glass-popup {
  background: var(--bg-secondary);
  backdrop-filter: var(--glass-light);
  -webkit-backdrop-filter: var(--glass-light);
  border: 1px solid var(--border-2);
  box-shadow: var(--shadow-3), var(--inner-glow);
}

/* 悬浮元素毛玻璃效果 */
.glass-float {
  background: var(--bg-tertiary);
  backdrop-filter: var(--glass-subtle);
  -webkit-backdrop-filter: var(--glass-subtle);
  border: 1px solid var(--border-3);
  box-shadow: var(--shadow-4);
}
```

## 3. 组件库规范

### 3.1 按钮组件

#### Primary Button（主要按钮）
```css
.btn-primary {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-1);
}

.btn-primary:hover {
  background: var(--primary-hover);
  box-shadow: var(--shadow-2);
  transform: translateY(-1px);
}

.btn-primary:active {
  background: var(--primary-active);
  transform: translateY(0);
}
```

#### Secondary Button（次要按钮）
```css
.btn-secondary {
  padding: 8px 16px;
  background: var(--surface-2);
  color: var(--text-primary);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  backdrop-filter: var(--glass-subtle);
}

.btn-secondary:hover {
  background: var(--surface-3);
  border-color: var(--border-2);
}
```

#### Ghost Button（幽灵按钮）
```css
.btn-ghost {
  padding: 8px 16px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--surface-1);
  color: var(--text-primary);
  border-color: var(--border-1);
}
```

#### Icon Button（图标按钮）
```css
.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--surface-1);
}

.btn-icon:active {
  background: var(--surface-2);
}
```

### 3.2 输入组件

#### Text Input（文本输入框）
```css
.input-text {
  width: 100%;
  padding: 10px 12px;
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
  backdrop-filter: var(--glass-subtle);
}

.input-text::placeholder {
  color: var(--text-tertiary);
}

.input-text:focus {
  outline: none;
  border-color: var(--primary-color);
  background: var(--surface-2);
  box-shadow: var(--shadow-focus);
}
```

#### Toggle Switch（开关）
```css
.toggle-switch {
  width: 44px;
  height: 24px;
  background: var(--surface-2);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-1);
}

.toggle-switch::after {
  content: '';
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-1);
}

.toggle-switch.active {
  background: var(--primary-color);
}

.toggle-switch.active::after {
  left: 21px;
}
```

#### Select Dropdown（下拉选择器）
```css
.select-dropdown {
  width: 100%;
  padding: 10px 32px 10px 12px;
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  backdrop-filter: var(--glass-subtle);
  background-image: url("data:image/svg+xml;charset=UTF-8,..."); /* 下拉箭头 */
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.select-dropdown:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-focus);
}
```

### 3.3 卡片和面板组件

#### Main Panel（主面板）
```css
.main-panel {
  background: var(--bg-primary);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-3), var(--inner-glow);
  transition: all 0.3s ease;
}
```

#### Settings Panel（设置面板）
```css
.settings-panel {
  background: var(--bg-secondary);
  backdrop-filter: var(--glass-light);
  -webkit-backdrop-filter: var(--glass-light);
  border: 1px solid var(--border-2);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-2);
}
```

#### Info Card（信息卡片）
```css
.info-card {
  background: var(--surface-1);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  padding: 16px;
  backdrop-filter: var(--glass-subtle);
  transition: all 0.2s ease;
}

.info-card:hover {
  background: var(--surface-2);
  border-color: var(--border-2);
  transform: translateY(-2px);
  box-shadow: var(--shadow-2);
}
```

### 3.4 图标系统

#### 图标规格
- **尺寸标准**：12px, 16px, 20px, 24px, 32px
- **线条宽度**：1.5px（小图标），2px（大图标）
- **风格**：线性图标，圆角端点
- **色彩**：遵循文字色彩规范

#### 系统图标映射
```css
/* 常用图标 */
.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  flex-shrink: 0;
}

.icon-sm { width: 12px; height: 12px; }
.icon-md { width: 20px; height: 20px; }
.icon-lg { width: 24px; height: 24px; }
.icon-xl { width: 32px; height: 32px; }
```

### 3.5 状态指示器

#### Status Indicator（状态指示器）
```css
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
}

.status-active { background: var(--success); }
.status-inactive { background: var(--text-tertiary); }
.status-error { background: var(--error); }
.status-warning { background: var(--warning); }
```

#### Progress Bar（进度条）
```css
.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--surface-1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
  border-radius: 2px;
}
```

### 3.6 系统托盘图标设计

#### 托盘图标规格
- **尺寸**：22×22px（macOS标准）
- **线条宽度**：1.5px
- **风格**：单色线性，适配系统主题
- **状态变化**：通过透明度和颜色变化表示

#### 图标状态
```css
/* 托盘图标CSS（如果使用HTML实现） */
.tray-icon {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

.tray-icon.active { opacity: 1; }
.tray-icon.inactive { opacity: 0.6; }
.tray-icon.error { fill: #FF453A; }
```

## 4. 界面布局设计

### 4.1 主控制面板布局

#### 面板结构
```
┌─────────────────────────────────────┐
│  ScreenWatcher              [×][○]  │  ← 标题栏（28px）
├─────────────────────────────────────┤
│                                     │
│  ●  监听状态：活跃中                   │  ← 状态区域（60px）
│     最后更新：2分钟前                  │
│                                     │
├─────────────────────────────────────┤
│  📊 今日统计                         │  ← 统计区域（120px）
│  检测次数：156    文字提取：89        │
│  成功率：94.2%    平均时长：0.3s      │
│                                     │
├─────────────────────────────────────┤
│  🔧 快捷操作                         │  ← 操作区域（80px）
│  [开始监听] [查看历史] [设置]         │
│                                     │
└─────────────────────────────────────┘
```

#### 布局CSS
```css
.main-control-panel {
  width: 320px;
  height: 288px;
  background: var(--bg-primary);
  backdrop-filter: var(--glass-blur);
  border-radius: 12px;
  border: 1px solid var(--border-1);
  box-shadow: var(--shadow-3), var(--inner-glow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  height: 28px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface-1);
  border-bottom: 1px solid var(--border-1);
}

.panel-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--surface-1);
  border-radius: 8px;
}

.stats-section {
  padding: 12px;
  background: var(--surface-1);
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.actions-section {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
```

### 4.2 设置界面布局

#### 设置面板结构
```
┌─────────────────────────────────────┐
│  ScreenWatcher 设置          [×]    │
├─────────────────────────────────────┤
│ 📋 通用  🔧 监听  🎨 界面  📊 统计  │  ← 标签栏
├─────────────────────────────────────┤
│                                     │
│  ⚡ 快捷键设置                       │
│  显示/隐藏：⌘ + \                    │
│  [更改快捷键]                       │
│                                     │
│  🎯 监听设置                        │
│  自动启动监听：[ON]                  │
│  监听间隔：[500ms ▼]                │
│  保存历史记录：[ON]                  │
│                                     │
│  🔔 通知设置                        │
│  显示桌面通知：[OFF]                 │
│  声音提醒：[OFF]                    │
│                                     │
│              [保存] [取消]           │
│                                     │
└─────────────────────────────────────┘
```

#### 设置界面CSS
```css
.settings-window {
  width: 480px;
  height: 420px;
  background: var(--bg-secondary);
  backdrop-filter: var(--glass-light);
  border-radius: 12px;
  border: 1px solid var(--border-2);
  box-shadow: var(--shadow-4);
  display: flex;
  flex-direction: column;
}

.settings-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-1);
}

.settings-tab {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-tab.active {
  color: var(--text-primary);
  background: var(--surface-1);
}

.settings-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-group h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-1);
}

.setting-item:last-child {
  border-bottom: none;
}
```

### 4.3 权限引导界面设计

#### 权限引导布局
```
┌─────────────────────────────────────┐
│            权限设置向导               │
├─────────────────────────────────────┤
│                                     │
│         🔒                          │
│                                     │
│    ScreenWatcher需要以下权限         │
│         来正常工作                   │
│                                     │
│  ✅ 屏幕录制权限                     │
│     允许应用捕获屏幕内容              │
│                                     │
│  ⏳ 辅助功能权限                     │
│     允许应用监听系统事件              │
│                                     │
│           [打开系统设置]              │
│                                     │
│      权限设置完成后应用将自动重启        │
│                                     │
└─────────────────────────────────────┘
```

### 4.4 数据展示界面

#### OCR结果展示
```css
.ocr-result-panel {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  border: 1px solid var(--border-1);
  backdrop-filter: var(--glass-light);
}

.ocr-text {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
  background: var(--surface-1);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-1);
  max-height: 200px;
  overflow-y: auto;
}

.ocr-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}
```

### 4.5 悬浮状态指示器设计

#### 迷你状态指示器
```css
.float-indicator {
  position: fixed;
  top: 50px;
  right: 20px;
  width: 60px;
  height: 24px;
  background: var(--bg-tertiary);
  backdrop-filter: var(--glass-subtle);
  border-radius: 12px;
  border: 1px solid var(--border-3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-2);
  z-index: var(--z-overlay);
  transition: all 0.3s ease;
}

.float-indicator:hover {
  width: 120px;
  box-shadow: var(--shadow-3);
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  margin-right: 6px;
}

.indicator-text {
  font-size: 10px;
  color: var(--text-primary);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.float-indicator:hover .indicator-text {
  opacity: 1;
}
```

## 5. 交互设计规范

### 5.1 快捷键交互流程

#### 主要快捷键
- **Command + \\**：显示/隐藏主面板
- **Command + ,**：打开设置界面
- **Escape**：关闭当前窗口
- **Command + Q**：退出应用

#### 快捷键反馈设计
```css
@keyframes shortcut-flash {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.shortcut-triggered {
  animation: shortcut-flash 0.3s ease;
}
```

### 5.2 动画和过渡效果

#### 窗口显示/隐藏动画
```css
@keyframes panel-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes panel-slide-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
}

.panel-enter {
  animation: panel-slide-in 0.3s ease-out;
}

.panel-exit {
  animation: panel-slide-out 0.2s ease-in;
}
```

#### 毛玻璃变化动画
```css
.glass-transition {
  transition: backdrop-filter 0.3s ease,
              background 0.3s ease,
              border 0.3s ease;
}
```

#### 悬停效果
```css
.interactive-element {
  transition: all 0.2s ease;
}

.interactive-element:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-2);
}

.interactive-element:active {
  transform: translateY(0);
  transition: all 0.1s ease;
}
```

### 5.3 响应式设计考虑

#### 窗口尺寸适配
```css
/* 标准尺寸 */
.main-panel {
  width: 320px;
  height: 288px;
}

/* 紧凑模式 */
.main-panel.compact {
  width: 280px;
  height: 240px;
  padding: 12px;
}

/* 扩展模式 */
.main-panel.expanded {
  width: 400px;
  height: 360px;
}

@media (max-height: 600px) {
  .main-panel {
    height: auto;
    max-height: 500px;
  }
}
```

### 5.4 触控和鼠标交互

#### 触控优化
```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  touch-action: manipulation;
}

.scrollable-area {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

#### 鼠标交互反馈
```css
.clickable {
  cursor: pointer;
  user-select: none;
}

.draggable {
  cursor: grab;
}

.draggable:active {
  cursor: grabbing;
}

.resizable {
  cursor: nw-resize;
}
```

### 5.5 无障碍设计规范

#### 焦点管理
```css
.focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

*:focus:not(.focus-visible) {
  outline: none;
}

.skip-link {
  position: absolute;
  left: -9999px;
  z-index: var(--z-modal);
}

.skip-link:focus {
  left: 0;
  top: 0;
  background: var(--bg-primary);
  padding: 8px 16px;
}
```

#### 语义化标记
```html
<!-- 主面板结构 -->
<main class="main-control-panel" role="application" aria-label="ScreenWatcher控制面板">
  <header class="panel-header">
    <h1>ScreenWatcher</h1>
    <div class="panel-controls" role="toolbar">
      <button aria-label="最小化窗口"></button>
      <button aria-label="关闭窗口"></button>
    </div>
  </header>
  
  <section class="status-section" aria-labelledby="status-title">
    <h2 id="status-title" class="sr-only">监听状态</h2>
    <div class="status-indicator" aria-live="polite"></div>
  </section>
</main>
```

## 6. Electron特定设计

### 6.1 主进程窗口设计

#### BrowserWindow配置
```javascript
// 主窗口配置
const mainWindow = new BrowserWindow({
  width: 320,
  height: 288,
  minWidth: 280,
  minHeight: 240,
  maxWidth: 400,
  maxHeight: 360,
  
  // 窗口样式
  frame: false,                    // 无边框窗口
  titleBarStyle: 'hidden',         // 隐藏标题栏
  transparent: true,               // 支持透明
  backgroundColor: 'rgba(0,0,0,0)', // 透明背景
  
  // 窗口行为
  alwaysOnTop: false,             // 不总在最前
  resizable: true,                // 可调整大小
  minimizable: true,              // 可最小化
  maximizable: false,             // 不可最大化
  closable: true,                 // 可关闭
  
  // 显示设置
  show: false,                    // 创建时不显示
  center: true,                   // 居中显示
  skipTaskbar: false,             // 显示在任务栏
  
  // Web偏好设置
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    preload: path.join(__dirname, 'preload.js')
  }
});

// 设置窗口
const settingsWindow = new BrowserWindow({
  width: 480,
  height: 420,
  minWidth: 400,
  minHeight: 350,
  
  parent: mainWindow,             // 设置父窗口
  modal: true,                    // 模态窗口
  frame: false,
  titleBarStyle: 'hidden',
  transparent: true,
  backgroundColor: 'rgba(0,0,0,0)',
  
  show: false,
  center: true,
  resizable: true,
  
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
});
```

#### 窗口管理功能
```javascript
// 窗口显示/隐藏切换
function toggleMainWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

// 毛玻璃效果设置
mainWindow.setVibrancy('ultra-dark'); // macOS毛玻璃效果
```

### 6.2 渲染进程界面设计

#### 主题切换系统
```javascript
// 主题管理器
class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.init();
  }
  
  init() {
    // 监听系统主题变化
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        this.setTheme(e.matches ? 'dark' : 'light');
      });
    }
  }
  
  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    // 通知主进程主题变化
    window.electronAPI.setTheme(theme);
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }
}
```

#### CSS主题变量切换
```css
/* 根据data-theme属性切换主题 */
[data-theme="dark"] {
  --bg-primary: rgba(30, 30, 30, 0.85);
  --text-primary: rgba(255, 255, 255, 0.9);
  /* ... 其他深色主题变量 */
}

[data-theme="light"] {
  --bg-primary: rgba(255, 255, 255, 0.85);
  --text-primary: rgba(0, 0, 0, 0.9);
  /* ... 其他浅色主题变量 */
}

/* 主题切换动画 */
* {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease;
}
```

### 6.3 IPC通信界面反馈

#### 加载状态设计
```css
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--surface-2);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
}
```

#### 操作反馈
```javascript
// 操作状态反馈
class UIFeedback {
  static showSuccess(message) {
    this.showToast(message, 'success');
  }
  
  static showError(message) {
    this.showToast(message, 'error');
  }
  
  static showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 动画显示
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });
    
    // 自动隐藏
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}
```

### 6.4 性能优化的视觉设计

#### GPU加速优化
```css
/* 使用transform和opacity进行GPU加速 */
.gpu-accelerated {
  will-change: transform, opacity;
  transform: translateZ(0); /* 强制GPU层 */
}

.smooth-animation {
  backface-visibility: hidden;
  perspective: 1000px;
}

/* 避免触发重排重绘的动画 */
.efficient-hover {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.efficient-hover:hover {
  transform: scale(1.02);
  opacity: 0.9;
}
```

#### 内存优化设计
```css
/* 限制毛玻璃效果的范围 */
.glass-container {
  contain: layout style paint;
  isolation: isolate;
}

/* 虚拟滚动优化 */
.virtual-scroll {
  height: 300px;
  overflow-y: auto;
  contain: strict;
}
```

### 6.5 跨平台一致性考虑

#### 平台特定样式
```css
/* macOS特有样式 */
.platform-darwin .window-controls {
  order: -1; /* 控制按钮在左侧 */
}

.platform-darwin .title-bar {
  height: 28px;
  -webkit-app-region: drag;
}

/* Windows特有样式 */
.platform-win32 .window-controls {
  order: 1; /* 控制按钮在右侧 */
}

.platform-win32 .title-bar {
  height: 32px;
}

/* Linux特有样式 */
.platform-linux .window-controls {
  /* 根据桌面环境调整 */
}
```

## 7. 实现指导

### 7.1 CSS/SCSS代码规范

#### 文件组织结构
```
src/styles/
├── base/
│   ├── reset.scss          # 重置样式
│   ├── typography.scss     # 字体规范
│   └── variables.scss      # CSS变量定义
├── components/
│   ├── buttons.scss        # 按钮组件样式
│   ├── inputs.scss         # 输入组件样式
│   ├── cards.scss          # 卡片组件样式
│   └── icons.scss          # 图标样式
├── layouts/
│   ├── main-panel.scss     # 主面板布局
│   ├── settings.scss       # 设置界面布局
│   └── modals.scss         # 模态框布局
├── themes/
│   ├── dark.scss           # 深色主题
│   ├── light.scss          # 浅色主题
│   └── variables.scss      # 主题变量
├── utilities/
│   ├── animations.scss     # 动画工具类
│   ├── spacing.scss        # 间距工具类
│   └── helpers.scss        # 辅助工具类
├── platform/
│   ├── darwin.scss         # macOS特定样式
│   ├── win32.scss          # Windows特定样式
│   └── linux.scss          # Linux特定样式
└── main.scss               # 主样式入口
```

#### SCSS编码规范
```scss
// 变量命名
$prefix: 'sw'; // ScreenWatcher缩写
$color-primary: #007AFF !default;
$spacing-unit: 4px !default;

// Mixin定义
@mixin glass-effect($opacity: 0.85) {
  background: rgba(30, 30, 30, $opacity);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// 组件样式结构
.#{$prefix}-component {
  // 布局属性
  display: flex;
  position: relative;
  
  // 尺寸属性
  width: 100%;
  height: auto;
  
  // 外观属性
  @include glass-effect();
  border-radius: 8px;
  
  // 子元素
  &__element {
    // 子元素样式
  }
  
  // 修饰符
  &--variant {
    // 变体样式
  }
  
  // 状态
  &:hover {
    // 悬停状态
  }
}
```

### 7.2 React组件设计模式

#### 组件文件结构
```
src/components/
├── ui/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.scss
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   ├── Input/
│   │   ├── Input.tsx
│   │   ├── Input.module.scss
│   │   └── index.ts
│   └── Panel/
│       ├── Panel.tsx
│       ├── Panel.module.scss
│       └── index.ts
├── layout/
│   ├── MainPanel/
│   ├── SettingsPanel/
│   └── StatusIndicator/
└── features/
    ├── MonitorStatus/
    ├── OCRResults/
    └── HistoryViewer/
```

#### 组件实现示例
```typescript
// Button.tsx
import React, { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Button.module.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          styles.button,
          styles[`button--${variant}`],
          styles[`button--${size}`],
          loading && styles['button--loading'],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <div className={styles.spinner} />}
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.content}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
```

#### 样式模块化
```scss
// Button.module.scss
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  
  &--primary {
    background: var(--primary-color);
    color: white;
    
    &:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-2);
    }
  }
  
  &--secondary {
    background: var(--surface-2);
    color: var(--text-primary);
    border: 1px solid var(--border-1);
    backdrop-filter: var(--glass-subtle);
    
    &:hover:not(:disabled) {
      background: var(--surface-3);
      border-color: var(--border-2);
    }
  }
  
  &--loading {
    pointer-events: none;
    
    .content {
      opacity: 0.7;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 7.3 Electron窗口配置

#### 主进程窗口管理
```typescript
// window-manager.ts
import { BrowserWindow, shell, screen } from 'electron';
import path from 'path';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  
  createMainWindow(): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    this.mainWindow = new BrowserWindow({
      width: 320,
      height: 288,
      x: width - 340,  // 右侧显示
      y: 60,           // 顶部偏移
      
      // 窗口样式
      frame: false,
      titleBarStyle: 'hidden',
      transparent: true,
      backgroundColor: 'rgba(0,0,0,0)',
      
      // 显示行为
      show: false,
      alwaysOnTop: false,
      skipTaskbar: false,
      
      // 毛玻璃效果
      vibrancy: 'ultra-dark',
      visualEffectState: 'active',
      
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
        backgroundThrottling: false,
      }
    });
    
    // 防止外部链接在应用内打开
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
    
    // 窗口事件处理
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
    
    return this.mainWindow;
  }
  
  toggleMainWindow(): void {
    if (!this.mainWindow) return;
    
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }
  
  createSettingsWindow(): BrowserWindow {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return this.settingsWindow;
    }
    
    this.settingsWindow = new BrowserWindow({
      width: 480,
      height: 420,
      minWidth: 400,
      minHeight: 350,
      
      parent: this.mainWindow,
      modal: true,
      frame: false,
      titleBarStyle: 'hidden',
      transparent: true,
      backgroundColor: 'rgba(0,0,0,0)',
      vibrancy: 'ultra-dark',
      
      show: false,
      center: true,
      resizable: true,
      
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
      }
    });
    
    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
    
    return this.settingsWindow;
  }
}
```

### 7.4 macOS原生API集成设计

#### 系统托盘集成
```typescript
// tray-manager.ts
import { Tray, Menu, nativeImage } from 'electron';
import path from 'path';

export class TrayManager {
  private tray: Tray | null = null;
  
  createTray(): void {
    // 创建托盘图标
    const trayIcon = nativeImage.createFromPath(
      path.join(__dirname, '../assets/tray-icon-template.png')
    );
    trayIcon.setTemplateImage(true); // macOS模板图标
    
    this.tray = new Tray(trayIcon);
    this.tray.setToolTip('ScreenWatcher');
    
    // 创建右键菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示控制面板',
        click: () => {
          // 显示主窗口
        }
      },
      { type: 'separator' },
      {
        label: '开始监听',
        type: 'checkbox',
        checked: false,
        click: (menuItem) => {
          // 切换监听状态
        }
      },
      {
        label: '设置...',
        click: () => {
          // 打开设置窗口
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        accelerator: 'Command+Q',
        click: () => {
          app.quit();
        }
      }
    ]);
    
    this.tray.setContextMenu(contextMenu);
    
    // 点击托盘图标切换窗口
    this.tray.on('click', () => {
      // 切换主窗口显示状态
    });
  }
  
  updateTrayStatus(isActive: boolean): void {
    if (!this.tray) return;
    
    const iconPath = isActive 
      ? '../assets/tray-icon-active-template.png'
      : '../assets/tray-icon-template.png';
      
    const icon = nativeImage.createFromPath(path.join(__dirname, iconPath));
    icon.setTemplateImage(true);
    this.tray.setImage(icon);
    
    // 更新工具提示
    const tooltip = isActive ? 'ScreenWatcher - 监听中' : 'ScreenWatcher - 已停止';
    this.tray.setToolTip(tooltip);
  }
}
```

#### 权限管理界面
```typescript
// permission-manager.ts
import { systemPreferences, shell } from 'electron';

export class PermissionManager {
  async checkScreenCapturePermission(): Promise<boolean> {
    const hasPermission = systemPreferences.getMediaAccessStatus('screen');
    return hasPermission === 'granted';
  }
  
  async requestScreenCapturePermission(): Promise<boolean> {
    try {
      const granted = await systemPreferences.askForMediaAccess('screen');
      return granted;
    } catch (error) {
      console.error('Failed to request screen capture permission:', error);
      return false;
    }
  }
  
  async checkAccessibilityPermission(): Promise<boolean> {
    return systemPreferences.isTrustedAccessibilityClient(false);
  }
  
  openAccessibilitySettings(): void {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
  }
  
  openScreenRecordingSettings(): void {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
  }
}
```

## 8. 开发实施建议

### 8.1 开发阶段规划
1. **基础架构搭建**（第1周）
   - Electron + React + TypeScript环境配置
   - 基础CSS变量和样式系统建立
   - 窗口管理器实现

2. **核心组件开发**（第2周）
   - UI组件库开发（Button、Input、Panel等）
   - 主控制面板界面实现
   - 毛玻璃效果调试优化

3. **功能界面实现**（第3周）
   - 设置界面开发
   - 权限引导界面实现
   - 状态指示器开发

4. **交互和动画**（第4周）
   - 快捷键系统实现
   - 动画效果优化
   - 响应式适配

5. **性能优化和测试**（第5周）
   - 内存和GPU使用优化
   - 跨平台兼容性测试
   - 用户体验优化

### 8.2 质量保证
- **代码审查**：确保代码符合设计规范
- **视觉走查**：与设计稿对比确保一致性
- **性能监控**：监控内存使用和渲染性能
- **用户测试**：实际用户使用反馈收集

### 8.3 维护和更新
- **设计系统版本管理**：使用语义化版本控制
- **组件文档维护**：保持组件使用文档更新
- **设计规范迭代**：根据用户反馈持续优化

---

**设计规范文档版本：1.0.0**  
**最后更新：2025年1月**  
**适用版本：ScreenWatcher v1.0+**

此设计规范文档为ScreenWatcher应用的完整视觉和交互设计指导，确保产品在macOS平台上提供一致、优雅的用户体验。