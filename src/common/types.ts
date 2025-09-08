// 公共类型定义

export interface Screenshot {
  id: number;
  timestamp: Date;
  windowTitle?: string;
  appName?: string;
  imagePath?: string;
  contentHash: string;
  createdAt: Date;
}

export interface TextContent {
  id: number;
  screenshotId: number;
  content: string;
  boundingBox?: BoundingBox;
  confidence: number;
  language: string;
  createdAt: Date;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRResult {
  text: string;
  boundingBoxes: BoundingBox[];
  confidence: number;
  language: string;
}

export interface CaptureOptions {
  mode: 'window' | 'fullscreen' | 'selection';
  windowId?: number;
  interval?: number;
}

export interface AppSettings {
  autoStart: boolean;
  minimizeToTray: boolean;
  autoUpdate: boolean;
  captureInterval: number;
  ocrLanguages: string[];
  ocrQuality: 'fast' | 'balanced' | 'high';
  storageRetention: number; // days
  maxStorageSize: number; // MB
  shortcuts: {
    toggleWindow: string;
    openSettings: string;
  };
}

export interface WindowInfo {
  id: number;
  title: string;
  appName: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface MonitorStatus {
  isActive: boolean;
  lastCapture?: Date;
  captureCount: number;
  errorCount: number;
  ocrSuccessRate: number;
}

export interface Statistics {
  todayCaptures: number;
  todayTexts: number;
  totalTexts: number;
  averageConfidence: number;
  topApps: Array<{
    appName: string;
    count: number;
  }>;
}

// IPC频道定义
export const IPC_CHANNELS = {
  // 窗口管理
  WINDOW_TOGGLE: 'window:toggle',
  WINDOW_SHOW: 'window:show',
  WINDOW_HIDE: 'window:hide',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_CLOSE: 'window:close',
  
  // 屏幕捕获
  CAPTURE_START: 'capture:start',
  CAPTURE_STOP: 'capture:stop',
  CAPTURE_STATUS: 'capture:status',
  CAPTURE_SCREENSHOT: 'capture:screenshot',
  
  // OCR
  OCR_PROCESS: 'ocr:process',
  OCR_RESULT: 'ocr:result',
  
  // 数据管理
  DATA_SAVE_SCREENSHOT: 'data:save-screenshot',
  DATA_SAVE_TEXT: 'data:save-text',
  DATA_SEARCH: 'data:search',
  DATA_STATISTICS: 'data:statistics',
  DATA_EXPORT: 'data:export',
  
  // 设置管理
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',
  
  // 权限管理
  PERMISSIONS_CHECK: 'permissions:check',
  PERMISSIONS_REQUEST: 'permissions:request',
  PERMISSIONS_OPEN_SETTINGS: 'permissions:open-settings',
  
  // 系统集成
  TRAY_UPDATE: 'tray:update',
  SHORTCUT_REGISTER: 'shortcut:register',
  
  // 通知
  NOTIFICATION_SHOW: 'notification:show',
  
  // 应用控制
  APP_QUIT: 'app:quit',
  APP_RESTART: 'app:restart',
  APP_VERSION: 'app:version',
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class PermissionError extends Error {
  constructor(permission: string) {
    super(`Missing permission: ${permission}`);
    this.name = 'PermissionError';
  }
}

export class CaptureError extends Error {
  constructor(message: string) {
    super(`Screen capture failed: ${message}`);
    this.name = 'CaptureError';
  }
}

export class OCRError extends Error {
  constructor(message: string) {
    super(`OCR processing failed: ${message}`);
    this.name = 'OCRError';
  }
}