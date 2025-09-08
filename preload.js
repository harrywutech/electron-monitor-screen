const { contextBridge, ipcRenderer } = require('electron');

// 安全的API暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 屏幕捕获相关
  getSources: () => ipcRenderer.invoke('get-sources'),
  startCapture: () => ipcRenderer.invoke('start-capture'),
  stopCapture: () => ipcRenderer.invoke('stop-capture'),
  getCaptureStatus: () => ipcRenderer.invoke('get-capture-status'),
  
  // 窗口控制
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowTogglePin: () => ipcRenderer.invoke('window-toggle-pin'),
  
  // 应用信息
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // 事件监听
  onNewScreenshot: (callback) => {
    ipcRenderer.on('new-screenshot', (event, data) => callback(data));
  },
  
  onCaptureStatusChanged: (callback) => {
    ipcRenderer.on('capture-status-changed', (event, data) => callback(data));
  },
  
  onShowSettings: (callback) => {
    ipcRenderer.on('show-settings', () => callback());
  },
  
  // 移除事件监听
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// 数据库操作API
contextBridge.exposeInMainWorld('databaseAPI', {
  // 截图记录
  saveScreenshot: (data) => ipcRenderer.invoke('db-save-screenshot', data),
  getScreenshots: (filters) => ipcRenderer.invoke('db-get-screenshots', filters),
  deleteScreenshot: (id) => ipcRenderer.invoke('db-delete-screenshot', id),
  
  // OCR结果
  saveOcrResult: (data) => ipcRenderer.invoke('db-save-ocr-result', data),
  getOcrResults: (filters) => ipcRenderer.invoke('db-get-ocr-results', filters),
  searchOcrText: (query) => ipcRenderer.invoke('db-search-ocr-text', query),
  
  // 统计信息
  getStatistics: () => ipcRenderer.invoke('db-get-statistics'),
  
  // 数据清理
  cleanOldData: (days) => ipcRenderer.invoke('db-clean-old-data', days)
});

// OCR处理API
contextBridge.exposeInMainWorld('ocrAPI', {
  processImage: (imageData, options) => ipcRenderer.invoke('ocr-process-image', imageData, options),
  setLanguage: (language) => ipcRenderer.invoke('ocr-set-language', language),
  getSupportedLanguages: () => ipcRenderer.invoke('ocr-get-languages')
});

// 系统工具API
contextBridge.exposeInMainWorld('systemAPI', {
  // 通知
  showNotification: (title, body, options) => 
    ipcRenderer.invoke('system-show-notification', title, body, options),
  
  // 文件操作
  openPath: (path) => ipcRenderer.invoke('system-open-path', path),
  showInFinder: (path) => ipcRenderer.invoke('system-show-in-finder', path),
  
  // 系统信息
  getSystemInfo: () => ipcRenderer.invoke('system-get-info'),
  
  // 权限检查
  checkPermissions: () => ipcRenderer.invoke('system-check-permissions'),
  requestPermissions: () => ipcRenderer.invoke('system-request-permissions')
});

// 设置和配置API
contextBridge.exposeInMainWorld('configAPI', {
  // 获取配置
  get: (key) => ipcRenderer.invoke('config-get', key),
  
  // 设置配置
  set: (key, value) => ipcRenderer.invoke('config-set', key, value),
  
  // 重置配置
  reset: () => ipcRenderer.invoke('config-reset'),
  
  // 获取所有配置
  getAll: () => ipcRenderer.invoke('config-get-all')
});

// 开发工具API（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('devAPI', {
    openDevTools: () => ipcRenderer.invoke('dev-open-devtools'),
    reload: () => ipcRenderer.invoke('dev-reload'),
    toggleDevTools: () => ipcRenderer.invoke('dev-toggle-devtools'),
    
    // 测试工具
    generateTestData: () => ipcRenderer.invoke('dev-generate-test-data'),
    clearAllData: () => ipcRenderer.invoke('dev-clear-all-data')
  });
}

// 错误处理
window.addEventListener('error', (event) => {
  console.error('渲染进程错误:', event.error);
  ipcRenderer.send('renderer-error', {
    message: event.error.message,
    stack: event.error.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
  ipcRenderer.send('renderer-rejection', {
    reason: event.reason,
    promise: event.promise
  });
});

// 初始化完成通知
document.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded successfully');
  ipcRenderer.send('preload-ready');
});