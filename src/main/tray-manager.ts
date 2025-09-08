import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import { WindowManager } from './window-manager';

export class TrayManager {
  private tray: Tray | null = null;
  private windowManager: WindowManager;
  private isMonitoring: boolean = false;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  createTray(): void {
    // 创建托盘图标
    const trayIconPath = this.isDevelopment() 
      ? path.join(__dirname, '../../assets/tray-icon-template@2x.png')
      : path.join(process.resourcesPath, 'assets/tray-icon-template@2x.png');
    
    let trayIcon: Electron.NativeImage;
    try {
      trayIcon = nativeImage.createFromPath(trayIconPath);
      if (trayIcon.isEmpty()) {
        // 如果图标文件不存在，创建一个简单的图标
        trayIcon = this.createDefaultIcon();
      }
      trayIcon.setTemplateImage(true); // macOS模板图标
    } catch (error) {
      console.warn('Failed to load tray icon, using default:', error);
      trayIcon = this.createDefaultIcon();
    }
    
    this.tray = new Tray(trayIcon);
    this.tray.setToolTip('ScreenWatcher - 屏幕监听工具');
    
    this.updateContextMenu();
    
    // 点击托盘图标切换主窗口
    this.tray.on('click', () => {
      this.windowManager.toggleMainWindow();
    });

    // 右键点击显示菜单
    this.tray.on('right-click', () => {
      if (this.tray) {
        this.tray.popUpContextMenu();
      }
    });
  }

  private updateContextMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示控制面板',
        click: () => {
          this.windowManager.showMainWindow();
        }
      },
      { type: 'separator' },
      {
        label: this.isMonitoring ? '停止监听' : '开始监听',
        type: 'checkbox',
        checked: this.isMonitoring,
        click: (menuItem) => {
          this.toggleMonitoring();
          // 通知主窗口状态变化
          this.windowManager.sendToMainWindow('monitoring-status-changed', this.isMonitoring);
        }
      },
      {
        label: '设置...',
        accelerator: 'Command+,',
        click: () => {
          this.windowManager.showSettingsWindow();
        }
      },
      { type: 'separator' },
      {
        label: '关于 ScreenWatcher',
        click: () => {
          // 显示关于对话框或页面
          this.showAbout();
        }
      },
      {
        label: '退出',
        accelerator: 'Command+Q',
        click: () => {
          app.quit();
        }
      }
    ]);
    
    this.tray.setContextMenu(contextMenu);
  }

  updateTrayStatus(isActive: boolean, stats?: { captureCount: number; errorCount: number }): void {
    if (!this.tray) return;

    this.isMonitoring = isActive;
    
    // 更新图标
    const iconName = isActive ? 'tray-icon-active-template@2x.png' : 'tray-icon-template@2x.png';
    const iconPath = this.isDevelopment() 
      ? path.join(__dirname, `../../assets/${iconName}`)
      : path.join(process.resourcesPath, `assets/${iconName}`);
    
    try {
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        icon.setTemplateImage(true);
        this.tray.setImage(icon);
      }
    } catch (error) {
      console.warn('Failed to update tray icon:', error);
    }
    
    // 更新工具提示
    let tooltip = isActive ? 'ScreenWatcher - 监听中' : 'ScreenWatcher - 已停止';
    if (stats && isActive) {
      tooltip += `\n今日捕获: ${stats.captureCount} 次`;
      if (stats.errorCount > 0) {
        tooltip += `\n错误: ${stats.errorCount} 次`;
      }
    }
    this.tray.setToolTip(tooltip);

    // 更新菜单
    this.updateContextMenu();
  }

  private toggleMonitoring(): void {
    this.isMonitoring = !this.isMonitoring;
    // 这里应该调用实际的监听开关逻辑
    console.log('Toggle monitoring:', this.isMonitoring);
  }

  private showAbout(): void {
    const aboutWindow = this.windowManager.getMainWindow();
    if (aboutWindow) {
      // 发送显示关于页面的消息
      this.windowManager.sendToMainWindow('show-about');
      this.windowManager.showMainWindow();
    }
  }

  private createDefaultIcon(): Electron.NativeImage {
    // 创建一个简单的默认图标（16x16像素的圆点）
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4); // RGBA
    
    // 简单地创建一个白色圆点图标
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - size / 2;
        const dy = y - size / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= size / 3) {
          const offset = (y * size + x) * 4;
          canvas[offset] = 255;     // R
          canvas[offset + 1] = 255; // G
          canvas[offset + 2] = 255; // B
          canvas[offset + 3] = 255; // A
        }
      }
    }
    
    return nativeImage.createFromBuffer(canvas, { width: size, height: size });
  }

  private isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  // 显示托盘通知
  showNotification(title: string, body: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    if (!this.tray) return;

    // macOS上可以通过托盘图标显示通知气泡
    this.tray.displayBalloon({
      title,
      content: body,
      icon: this.getNotificationIcon(type),
    });
  }

  private getNotificationIcon(type: string): Electron.NativeImage {
    // 根据通知类型返回不同的图标
    // 这里简化处理，实际应用中可以准备不同的图标文件
    return this.createDefaultIcon();
  }

  // 销毁托盘
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  // 获取托盘实例
  getTray(): Tray | null {
    return this.tray;
  }

  // 设置托盘菜单项状态
  setMenuItemEnabled(label: string, enabled: boolean): void {
    // 实现菜单项状态更新逻辑
    this.updateContextMenu();
  }
}