import { BrowserWindow, shell, screen, app } from 'electron';
import path from 'path';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  private readonly isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
  }

  createMainWindow(): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    this.mainWindow = new BrowserWindow({
      width: 320,
      height: 288,
      x: width - 340,  // 右侧显示，距离边缘20px
      y: 60,           // 顶部偏移
      minWidth: 280,
      minHeight: 240,
      maxWidth: 400,
      maxHeight: 360,
      
      // 窗口样式
      frame: false,
      titleBarStyle: 'hidden',
      transparent: true,
      backgroundColor: 'rgba(0,0,0,0)',
      
      // 显示行为
      show: false,
      alwaysOnTop: false,
      skipTaskbar: false,
      resizable: true,
      minimizable: true,
      maximizable: false,
      closable: true,
      
      // 毛玻璃效果
      vibrancy: 'ultra-dark',
      visualEffectState: 'active',
      
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, '../preload/preload.js'),
        backgroundThrottling: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
      }
    });
    
    // 加载页面
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
    
    // 防止外部链接在应用内打开
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
    
    // 窗口事件处理
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // 窗口失去焦点时隐藏（可选功能）
    this.mainWindow.on('blur', () => {
      // 如果设置了点击外部隐藏，在这里实现
      // this.mainWindow?.hide();
    });

    // Ready to show
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });
    
    return this.mainWindow;
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
      
      parent: this.mainWindow || undefined,
      modal: true,
      frame: false,
      titleBarStyle: 'hidden',
      transparent: true,
      backgroundColor: 'rgba(0,0,0,0)',
      vibrancy: 'ultra-dark',
      
      show: false,
      center: true,
      resizable: true,
      minimizable: false,
      maximizable: false,
      closable: true,
      
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
      }
    });
    
    // 加载设置页面
    if (this.isDev) {
      this.settingsWindow.loadURL('http://localhost:3000#/settings');
    } else {
      this.settingsWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
        hash: 'settings'
      });
    }
    
    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });

    this.settingsWindow.once('ready-to-show', () => {
      if (this.settingsWindow) {
        this.settingsWindow.show();
        this.settingsWindow.focus();
      }
    });
    
    return this.settingsWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  getSettingsWindow(): BrowserWindow | null {
    return this.settingsWindow;
  }

  toggleMainWindow(): void {
    if (!this.mainWindow) {
      this.createMainWindow();
      return;
    }
    
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
      
      // 如果窗口被最小化，取消最小化
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
    }
  }

  showMainWindow(): void {
    if (!this.mainWindow) {
      this.createMainWindow();
      return;
    }
    
    this.mainWindow.show();
    this.mainWindow.focus();
    
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
  }

  hideMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.hide();
    }
  }

  closeMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }

  showSettingsWindow(): void {
    if (!this.settingsWindow) {
      this.createSettingsWindow();
    } else {
      this.settingsWindow.show();
      this.settingsWindow.focus();
    }
  }

  closeSettingsWindow(): void {
    if (this.settingsWindow) {
      this.settingsWindow.close();
    }
  }

  // 设置窗口位置
  setMainWindowPosition(x: number, y: number): void {
    if (this.mainWindow) {
      this.mainWindow.setPosition(x, y);
    }
  }

  // 获取窗口位置
  getMainWindowBounds(): Electron.Rectangle | null {
    if (this.mainWindow) {
      return this.mainWindow.getBounds();
    }
    return null;
  }

  // 设置窗口置顶状态
  setMainWindowAlwaysOnTop(flag: boolean): void {
    if (this.mainWindow) {
      this.mainWindow.setAlwaysOnTop(flag);
    }
  }

  // 发送消息到渲染进程
  sendToMainWindow(channel: string, ...args: any[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }

  sendToSettingsWindow(channel: string, ...args: any[]): void {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.webContents.send(channel, ...args);
    }
  }

  // 清理资源
  cleanup(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.close();
    }
  }
}