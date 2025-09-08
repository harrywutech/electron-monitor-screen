import { app, BrowserWindow, ipcMain, globalShortcut, Menu } from 'electron';
import path from 'path';
import { WindowManager } from './window-manager';
import { TrayManager } from './tray-manager';
import { PermissionManager } from './permission-manager';
import { ScreenCaptureService, CaptureResult } from './screen-capture';
import { OCRService } from './ocr-service';
import { Database } from './database';
import { IPC_CHANNELS } from '../common/types';
import crypto from 'crypto';

class ScreenWatcherApp {
  private windowManager: WindowManager;
  private trayManager: TrayManager;
  private permissionManager: PermissionManager;
  private screenCapture: ScreenCaptureService;
  private ocrService: OCRService;
  private database: Database;
  private isQuitting: boolean = false;
  private captureStats = {
    todayCaptures: 0,
    successfulOCR: 0,
    errors: 0,
  };

  constructor() {
    this.windowManager = new WindowManager();
    this.trayManager = new TrayManager(this.windowManager);
    this.permissionManager = PermissionManager.getInstance();
    this.screenCapture = new ScreenCaptureService();
    this.ocrService = new OCRService();
    this.database = new Database();
  }

  async initialize(): Promise<void> {
    // 设置应用基础配置
    this.setupApp();
    
    // 初始化数据库
    await this.database.initialize();
    
    // 注册IPC处理器
    this.registerIPCHandlers();
    
    // 注册全局快捷键
    this.registerGlobalShortcuts();
    
    // 创建主窗口
    this.windowManager.createMainWindow();
    
    // 创建系统托盘
    this.trayManager.createTray();
    
    // 检查权限
    await this.checkInitialPermissions();
    
    // 加载今日统计
    await this.loadTodayStats();
  }

  private setupApp(): void {
    // 设置应用名称
    app.setName('ScreenWatcher');
    
    // macOS 特定设置
    if (process.platform === 'darwin') {
      // 隐藏 Dock 图标（可选）
      // app.dock.hide();
      
      // 设置关于面板
      app.setAboutPanelOptions({
        applicationName: 'ScreenWatcher',
        applicationVersion: app.getVersion(),
        copyright: '© 2025 ScreenWatcher Team',
        credits: '屏幕监听与智能分析工具',
      });
    }

    // 防止多实例运行
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    // 当尝试打开第二个实例时，显示主窗口
    app.on('second-instance', () => {
      this.windowManager.showMainWindow();
    });

    // 禁用安全警告（开发环境）
    if (process.env.NODE_ENV === 'development') {
      process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
    }
  }

  private registerIPCHandlers(): void {
    // 窗口管理
    ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE, () => {
      this.windowManager.toggleMainWindow();
    });

    ipcMain.handle(IPC_CHANNELS.WINDOW_SHOW, () => {
      this.windowManager.showMainWindow();
    });

    ipcMain.handle(IPC_CHANNELS.WINDOW_HIDE, () => {
      this.windowManager.hideMainWindow();
    });

    ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
      this.windowManager.closeMainWindow();
    });

    // 屏幕捕获
    ipcMain.handle(IPC_CHANNELS.CAPTURE_START, async (event, options) => {
      try {
        // 检查权限
        const hasPermission = await this.permissionManager.checkScreenCapturePermission();
        if (!hasPermission) {
          throw new Error('Screen recording permission required');
        }

        await this.screenCapture.startContinuousCapture(options, async (result) => {
          // 处理捕获结果
          await this.processCaptureResult(result);
        });

        // 更新托盘状态
        this.trayManager.updateTrayStatus(true);
        
        return { success: true };
      } catch (error) {
        console.error('Failed to start capture:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(IPC_CHANNELS.CAPTURE_STOP, () => {
      try {
        this.screenCapture.stopContinuousCapture();
        this.trayManager.updateTrayStatus(false);
        return { success: true };
      } catch (error) {
        console.error('Failed to stop capture:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(IPC_CHANNELS.CAPTURE_STATUS, () => {
      return {
        isActive: this.screenCapture.isCaptureActive(),
        timestamp: new Date(),
      };
    });

    ipcMain.handle(IPC_CHANNELS.CAPTURE_SCREENSHOT, async () => {
      try {
        const result = await this.screenCapture.captureMainScreen();
        return { success: true, data: result };
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
        return { success: false, error: error.message };
      }
    });

    // 权限管理
    ipcMain.handle(IPC_CHANNELS.PERMISSIONS_CHECK, async () => {
      return await this.permissionManager.checkAllPermissions();
    });

    ipcMain.handle(IPC_CHANNELS.PERMISSIONS_REQUEST, async (event, permissionType) => {
      try {
        switch (permissionType) {
          case 'screen':
            return await this.permissionManager.requestScreenCapturePermission();
          case 'accessibility':
            return await this.permissionManager.requestAccessibilityPermission();
          case 'notification':
            return await this.permissionManager.requestNotificationPermission();
          default:
            throw new Error(`Unknown permission type: ${permissionType}`);
        }
      } catch (error) {
        console.error('Failed to request permission:', error);
        return false;
      }
    });

    ipcMain.handle(IPC_CHANNELS.PERMISSIONS_OPEN_SETTINGS, (event, settingsType) => {
      switch (settingsType) {
        case 'screen-recording':
          this.permissionManager.openScreenRecordingSettings();
          break;
        case 'accessibility':
          this.permissionManager.openAccessibilitySettings();
          break;
      }
    });

    // 应用控制
    ipcMain.handle(IPC_CHANNELS.APP_VERSION, () => {
      return app.getVersion();
    });

    ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => {
      this.quit();
    });

    ipcMain.handle(IPC_CHANNELS.APP_RESTART, () => {
      app.relaunch();
      app.exit(0);
    });

    // 设置窗口
    ipcMain.handle('show-settings', () => {
      this.windowManager.showSettingsWindow();
    });

    // 数据查询
    ipcMain.handle(IPC_CHANNELS.DATA_SEARCH, async (event, query, options) => {
      try {
        const results = await this.database.searchTextContent(query, options);
        return { success: true, data: results };
      } catch (error) {
        console.error('Search failed:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(IPC_CHANNELS.DATA_STATISTICS, async () => {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const stats = await this.database.getStatistics({
          start: startOfDay,
          end: endOfDay,
        });
        
        return { success: true, data: stats };
      } catch (error) {
        console.error('Failed to get statistics:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(IPC_CHANNELS.DATA_EXPORT, async (event, format = 'json') => {
      try {
        const data = await this.database.exportData(format);
        return { success: true, data };
      } catch (error) {
        console.error('Export failed:', error);
        return { success: false, error: error.message };
      }
    });
  }

  private registerGlobalShortcuts(): void {
    // 注册 Command+\ 快捷键来切换主窗口
    const toggleShortcut = globalShortcut.register('CommandOrControl+\\', () => {
      this.windowManager.toggleMainWindow();
    });

    if (!toggleShortcut) {
      console.error('Failed to register global shortcut: Command+\\');
    }

    // 注册 Command+, 快捷键来打开设置
    const settingsShortcut = globalShortcut.register('CommandOrControl+,', () => {
      this.windowManager.showSettingsWindow();
    });

    if (!settingsShortcut) {
      console.error('Failed to register global shortcut: Command+,');
    }
  }

  private async checkInitialPermissions(): Promise<void> {
    try {
      const permissions = await this.permissionManager.checkAllPermissions();
      
      if (!permissions.screenCapture) {
        // 如果没有屏幕录制权限，显示权限引导
        const mainWindow = this.windowManager.getMainWindow();
        if (mainWindow) {
          setTimeout(() => {
            this.permissionManager.showPermissionGuide(mainWindow);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error checking initial permissions:', error);
    }
  }

  private setupAppEvents(): void {
    // 应用准备就绪
    app.on('ready', async () => {
      await this.initialize();
    });

    // 所有窗口关闭时
    app.on('window-all-closed', () => {
      // macOS 上应用通常保持活跃状态直到用户明确退出
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // 应用激活时
    app.on('activate', () => {
      // macOS 上点击 dock 图标时重新创建窗口
      if (BrowserWindow.getAllWindows().length === 0) {
        this.windowManager.createMainWindow();
      } else {
        this.windowManager.showMainWindow();
      }
    });

    // 应用即将退出
    app.on('before-quit', (event) => {
      this.isQuitting = true;
    });

    // 应用退出时清理
    app.on('will-quit', () => {
      this.cleanup();
    });

    // macOS 特定事件
    if (process.platform === 'darwin') {
      // 隐藏应用
      app.on('hide', () => {
        this.windowManager.hideMainWindow();
      });

      // 显示应用
      app.on('show', () => {
        this.windowManager.showMainWindow();
      });
    }
  }

  private cleanup(): void {
    // 注销全局快捷键
    globalShortcut.unregisterAll();
    
    // 停止屏幕捕获
    this.screenCapture.cleanup();
    
    // 清理OCR服务
    this.ocrService.cleanup();
    
    // 关闭数据库连接
    this.database.close().catch(console.error);
    
    // 清理窗口
    this.windowManager.cleanup();
    
    // 销毁托盘
    this.trayManager.destroy();
  }

  private quit(): void {
    this.isQuitting = true;
    app.quit();
  }

  // 处理捕获结果
  private async processCaptureResult(result: CaptureResult): Promise<void> {
    try {
      this.captureStats.todayCaptures++;

      // 生成内容哈希
      const contentHash = crypto.createHash('md5').update(result.dataURL).digest('hex');

      // 保存截图到数据库
      const screenshotId = await this.database.saveScreenshot({
        timestamp: result.timestamp,
        windowTitle: result.windowInfo?.title,
        appName: result.windowInfo?.appName,
        imagePath: undefined, // 暂时不保存图片文件，只保存DataURL
        contentHash,
      });

      // 进行OCR识别
      try {
        const ocrResult = await this.ocrService.recognizeText(result.dataURL);
        
        if (ocrResult.text.trim().length > 0) {
          // 保存OCR结果
          await this.database.saveTextContent({
            screenshotId,
            content: ocrResult.text,
            boundingBox: ocrResult.boundingBoxes[0], // 使用第一个边界框
            confidence: ocrResult.confidence,
            language: ocrResult.language,
          });

          this.captureStats.successfulOCR++;

          // 发送结果到渲染进程
          this.windowManager.sendToMainWindow('capture-result', {
            screenshot: { id: screenshotId, ...result },
            ocr: ocrResult,
          });
        }
      } catch (ocrError) {
        console.error('OCR processing failed:', ocrError);
        this.captureStats.errors++;
      }

      // 更新托盘状态
      this.trayManager.updateTrayStatus(true, {
        captureCount: this.captureStats.todayCaptures,
        errorCount: this.captureStats.errors,
      });

    } catch (error) {
      console.error('Failed to process capture result:', error);
      this.captureStats.errors++;
    }
  }

  // 加载今日统计
  private async loadTodayStats(): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const stats = await this.database.getStatistics({
        start: startOfDay,
        end: endOfDay,
      });

      this.captureStats.todayCaptures = stats.todayCaptures;
      this.captureStats.successfulOCR = stats.todayTexts;

    } catch (error) {
      console.error('Failed to load today stats:', error);
    }
  }

  // 启动应用
  run(): void {
    this.setupAppEvents();
  }
}

// 创建并运行应用实例
const screenWatcherApp = new ScreenWatcherApp();
screenWatcherApp.run();

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});