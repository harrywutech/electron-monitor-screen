const { app, BrowserWindow, Menu, Tray, globalShortcut, systemPreferences, ipcMain, desktopCapturer, dialog, screen, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ServiceManager = require('./src/services/ServiceManager');

// 保持对窗口对象的全局引用，避免被垃圾回收
let mainWindow;
let tray = null;
let isQuitting = false;
let serviceManager = null;

// 开发环境检测
const isDev = process.env.ELECTRON_IS_DEV === '1';

// 应用配置
const APP_CONFIG = {
  window: {
    width: 320,
    height: 288,
    minWidth: 320,
    minHeight: 288,
    maxWidth: 600,
    maxHeight: 800
  },
  shortcuts: {
    toggle: 'CommandOrControl+\\'
  }
};

// 创建主窗口
function createMainWindow() {
  // 获取屏幕尺寸
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: APP_CONFIG.window.width,
    height: APP_CONFIG.window.height,
    minWidth: APP_CONFIG.window.minWidth,
    minHeight: APP_CONFIG.window.minHeight,
    maxWidth: APP_CONFIG.window.maxWidth,
    maxHeight: APP_CONFIG.window.maxHeight,
    x: width - APP_CONFIG.window.width - 20,
    y: 60,
    show: false,
    frame: false,
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    backgroundColor: 'rgba(0,0,0,0)',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev
    }
  });

  // 加载应用内容
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // 开发环境打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // 窗口事件处理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('blur', () => {
    // 失去焦点时自动隐藏（可选功能）
    if (!isDev) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.hide();
        }
      }, 2000);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    // 窗口加载完成后的处理
    console.log('主窗口加载完成');
  });
}

// 创建系统托盘
function createTray() {
  const iconPath = isDev 
    ? path.join(__dirname, 'public', 'tray-icon.png')
    : path.join(process.resourcesPath, 'app', 'build', 'tray-icon.png');
  
  // 如果图标不存在，创建一个临时图标
  if (!fs.existsSync(iconPath)) {
    // 使用系统默认图标或创建简单图标
    tray = new Tray(path.join(__dirname, 'public', 'logo192.png'));
  } else {
    tray = new Tray(iconPath);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'ScreenWatcher',
      type: 'normal',
      enabled: false
    },
    { type: 'separator' },
    {
      label: '显示主面板',
      click: () => {
        showMainWindow();
      }
    },
    {
      label: '开始监听',
      click: () => {
        startScreenCapture();
      }
    },
    {
      label: '暂停监听',
      click: () => {
        stopScreenCapture();
      }
    },
    { type: 'separator' },
    {
      label: '设置',
      click: () => {
        showMainWindow();
        // 发送设置页面事件
        if (mainWindow) {
          mainWindow.webContents.send('show-settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        quitApp();
      }
    }
  ]);

  tray.setToolTip('ScreenWatcher - 屏幕监听工具');
  tray.setContextMenu(contextMenu);
  
  // 点击托盘图标切换窗口显示
  tray.on('click', () => {
    toggleMainWindow();
  });
}

// 显示主窗口
function showMainWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  } else {
    createMainWindow();
  }
}

// 隐藏主窗口
function hideMainWindow() {
  if (mainWindow) {
    mainWindow.hide();
  }
}

// 切换主窗口显示状态
function toggleMainWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    hideMainWindow();
  } else {
    showMainWindow();
  }
}

// 注册全局快捷键
function registerGlobalShortcuts() {
  // 注册 Command/Ctrl + \ 快捷键
  const ret = globalShortcut.register(APP_CONFIG.shortcuts.toggle, () => {
    toggleMainWindow();
  });

  if (!ret) {
    console.log('快捷键注册失败');
  }
}

// 注销全局快捷键
function unregisterGlobalShortcuts() {
  globalShortcut.unregister(APP_CONFIG.shortcuts.toggle);
  globalShortcut.unregisterAll();
}

// 检查和请求屏幕录制权限
async function checkScreenCapturePermission() {
  if (process.platform === 'darwin') {
    const hasPermission = systemPreferences.getMediaAccessStatus('screen');
    console.log('屏幕录制权限状态:', hasPermission);
    
    if (hasPermission !== 'granted') {
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '需要屏幕录制权限',
        message: 'ScreenWatcher需要屏幕录制权限才能正常工作',
        detail: '请在系统偏好设置 -> 安全性与隐私 -> 屏幕录制中，勾选ScreenWatcher',
        buttons: ['打开设置', '稍后设置'],
        defaultId: 0
      });

      if (result.response === 0) {
        // 打开系统设置
        require('child_process').exec('open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"');
      }
      
      return false;
    }
    return true;
  }
  return true; // 非macOS平台默认有权限
}

// 屏幕捕获相关变量
let captureInterval = null;
let isCapturing = false;

// 开始屏幕捕获
async function startScreenCapture() {
  if (isCapturing) return;
  
  const hasPermission = await checkScreenCapturePermission();
  if (!hasPermission) {
    console.log('没有屏幕录制权限，无法开始捕获');
    return;
  }

  isCapturing = true;
  console.log('开始屏幕监听...');
  
  // 通知渲染进程状态变更
  if (mainWindow) {
    mainWindow.webContents.send('capture-status-changed', { isCapturing: true });
  }

  // 每2秒捕获一次屏幕
  captureInterval = setInterval(async () => {
    try {
      await captureScreen();
    } catch (error) {
      console.error('屏幕捕获错误:', error);
    }
  }, 2000);
}

// 停止屏幕捕获
function stopScreenCapture() {
  if (!isCapturing) return;
  
  isCapturing = false;
  console.log('停止屏幕监听...');
  
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
  
  // 通知渲染进程状态变更
  if (mainWindow) {
    mainWindow.webContents.send('capture-status-changed', { isCapturing: false });
  }
}

// 执行屏幕捕获
async function captureScreen() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (sources.length > 0) {
      const primaryScreen = sources.find(source => source.name === 'Entire Screen') || sources[0];
      const timestamp = Date.now();
      const imageData = primaryScreen.thumbnail.toDataURL();
      
      const screenshotData = {
        id: timestamp,
        image: imageData,
        timestamp: timestamp,
        source: primaryScreen.name
      };

      // 保存到数据库并处理OCR
      if (serviceManager) {
        try {
          await serviceManager.handleNewScreenshot(screenshotData);
        } catch (error) {
          console.error('Failed to save screenshot:', error);
        }
      }
      
      // 发送截图数据到渲染进程
      if (mainWindow) {
        mainWindow.webContents.send('new-screenshot', screenshotData);
      }
      
      console.log(`截图完成 - ${new Date(timestamp).toLocaleString()}`);
    }
  } catch (error) {
    console.error('屏幕捕获失败:', error);
  }
}

// IPC 事件处理
function setupIpcHandlers() {
  // 获取屏幕源列表
  ipcMain.handle('get-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 300, height: 200 }
      });
      
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }));
    } catch (error) {
      console.error('获取屏幕源失败:', error);
      return [];
    }
  });

  // 开始捕获
  ipcMain.handle('start-capture', () => {
    startScreenCapture();
    return { success: true };
  });

  // 停止捕获
  ipcMain.handle('stop-capture', () => {
    stopScreenCapture();
    return { success: true };
  });

  // 获取捕获状态
  ipcMain.handle('get-capture-status', () => {
    return { isCapturing };
  });

  // 窗口控制
  ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle('window-close', () => {
    hideMainWindow();
  });

  ipcMain.handle('window-toggle-pin', () => {
    if (mainWindow) {
      const isPinned = mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(!isPinned);
      return { isPinned: !isPinned };
    }
    return { isPinned: false };
  });

  // 获取应用信息
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform,
      arch: process.arch
    };
  });

  // 数据库相关处理程序
  ipcMain.handle('db-save-screenshot', async (event, data) => {
    if (serviceManager) {
      return await serviceManager.database.saveScreenshot(data);
    }
    return null;
  });

  ipcMain.handle('db-get-screenshots', async (event, filters) => {
    if (serviceManager) {
      return await serviceManager.getScreenshots(filters);
    }
    return [];
  });

  ipcMain.handle('db-delete-screenshot', async (event, id) => {
    if (serviceManager) {
      return await serviceManager.deleteScreenshot(id);
    }
    return false;
  });

  ipcMain.handle('db-save-ocr-result', async (event, data) => {
    if (serviceManager) {
      return await serviceManager.database.saveOcrResult(data);
    }
    return null;
  });

  ipcMain.handle('db-get-ocr-results', async (event, filters) => {
    if (serviceManager) {
      return await serviceManager.database.getOcrResults(filters);
    }
    return [];
  });

  ipcMain.handle('db-search-ocr-text', async (event, query) => {
    if (serviceManager) {
      return await serviceManager.searchOcrText(query);
    }
    return [];
  });

  ipcMain.handle('db-get-statistics', async () => {
    if (serviceManager) {
      return await serviceManager.getStatistics();
    }
    return {};
  });

  ipcMain.handle('db-clean-old-data', async (event, days) => {
    if (serviceManager) {
      return await serviceManager.cleanOldData(days);
    }
    return 0;
  });

  // OCR相关处理程序
  ipcMain.handle('ocr-process-image', async (event, imageData, options) => {
    if (serviceManager) {
      return await serviceManager.ocr.processImage(imageData, options);
    }
    return null;
  });

  ipcMain.handle('ocr-set-language', async (event, language) => {
    if (serviceManager) {
      serviceManager.setOcrLanguage(language);
      return true;
    }
    return false;
  });

  ipcMain.handle('ocr-get-languages', () => {
    if (serviceManager) {
      return serviceManager.getSupportedLanguages();
    }
    return [];
  });

  // 系统工具处理程序
  ipcMain.handle('system-show-notification', (event, title, body, options = {}) => {
    if (process.platform === 'darwin') {
      const notification = new Notification({
        title,
        body,
        icon: options.icon,
        sound: options.sound !== false
      });
      notification.show();
      return true;
    }
    return false;
  });

  ipcMain.handle('system-open-path', (event, path) => {
    return shell.openPath(path);
  });

  ipcMain.handle('system-show-in-finder', (event, path) => {
    return shell.showItemInFolder(path);
  });

  ipcMain.handle('system-get-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      homedir: os.homedir(),
      tmpdir: os.tmpdir()
    };
  });

  ipcMain.handle('system-check-permissions', async () => {
    if (process.platform === 'darwin') {
      return {
        screenRecordingPermission: systemPreferences.getMediaAccessStatus('screen') === 'granted',
        accessibilityPermission: systemPreferences.isTrustedAccessibilityClient(false)
      };
    }
    return { screenRecordingPermission: true, accessibilityPermission: true };
  });

  ipcMain.handle('system-request-permissions', async () => {
    if (process.platform === 'darwin') {
      const screenPermission = await systemPreferences.askForMediaAccess('screen');
      const accessibilityPermission = systemPreferences.isTrustedAccessibilityClient(true);
      
      return {
        screenRecordingPermission: screenPermission,
        accessibilityPermission: accessibilityPermission
      };
    }
    return { screenRecordingPermission: true, accessibilityPermission: true };
  });

  // 配置管理处理程序
  ipcMain.handle('config-get', (event, key) => {
    if (serviceManager) {
      return serviceManager.getConfig(key);
    }
    return null;
  });

  ipcMain.handle('config-set', (event, key, value) => {
    if (serviceManager) {
      serviceManager.setConfig(key, value);
      return true;
    }
    return false;
  });

  ipcMain.handle('config-get-all', () => {
    if (serviceManager) {
      return serviceManager.getAllConfig();
    }
    return {};
  });

  ipcMain.handle('config-reset', () => {
    if (serviceManager) {
      serviceManager.resetConfig();
      return true;
    }
    return false;
  });

  // 开发工具处理程序（仅开发环境）
  if (isDev) {
    ipcMain.handle('dev-open-devtools', () => {
      if (mainWindow) {
        mainWindow.webContents.openDevTools();
      }
    });

    ipcMain.handle('dev-reload', () => {
      if (mainWindow) {
        mainWindow.webContents.reload();
      }
    });

    ipcMain.handle('dev-toggle-devtools', () => {
      if (mainWindow) {
        mainWindow.webContents.toggleDevTools();
      }
    });
  }
}

// 退出应用
async function quitApp() {
  isQuitting = true;
  stopScreenCapture();
  unregisterGlobalShortcuts();
  
  // 关闭服务管理器
  if (serviceManager) {
    await serviceManager.shutdown();
  }
  
  app.quit();
}

// App 事件处理
app.whenReady().then(async () => {
  try {
    // 初始化服务管理器
    serviceManager = new ServiceManager();
    await serviceManager.initialize();
    console.log('Service Manager initialized');

    createMainWindow();
    createTray();
    registerGlobalShortcuts();
    setupIpcHandlers();
    
    // macOS特定：当dock图标被点击且没有其他窗口打开时，重新创建主窗口
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      } else {
        showMainWindow();
      }
    });
    
    console.log('ScreenWatcher 启动完成');
  } catch (error) {
    console.error('Application startup failed:', error);
    app.quit();
  }
});

// 所有窗口关闭时的行为
app.on('window-all-closed', () => {
  // macOS应用通常在所有窗口关闭后继续运行
  if (process.platform !== 'darwin') {
    quitApp();
  }
});

// 应用即将退出
app.on('before-quit', () => {
  isQuitting = true;
});

// 应用退出前清理
app.on('will-quit', async (event) => {
  event.preventDefault(); // 防止立即退出
  
  unregisterGlobalShortcuts();
  stopScreenCapture();
  
  // 关闭服务管理器
  if (serviceManager) {
    await serviceManager.shutdown();
  }
  
  app.exit(); // 强制退出
});

// 应用退出
app.on('quit', () => {
  console.log('ScreenWatcher 已退出');
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});