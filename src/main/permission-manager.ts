import { systemPreferences, shell, dialog, app, BrowserWindow } from 'electron';
import { PermissionError } from '../common/types';

export interface PermissionStatus {
  screenCapture: boolean;
  accessibility: boolean;
  notifications: boolean;
}

export class PermissionManager {
  private static instance: PermissionManager;
  
  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  // 检查屏幕录制权限
  async checkScreenCapturePermission(): Promise<boolean> {
    try {
      const status = systemPreferences.getMediaAccessStatus('screen');
      return status === 'granted';
    } catch (error) {
      console.error('Error checking screen capture permission:', error);
      return false;
    }
  }

  // 请求屏幕录制权限
  async requestScreenCapturePermission(): Promise<boolean> {
    try {
      // 首先检查当前状态
      const currentStatus = systemPreferences.getMediaAccessStatus('screen');
      
      if (currentStatus === 'granted') {
        return true;
      }

      if (currentStatus === 'denied') {
        // 如果已经被拒绝，需要用户手动到设置中开启
        await this.showPermissionDialog('screen-recording');
        return false;
      }

      // 如果是 'unknown' 或 'not-determined'，尝试请求权限
      const granted = await systemPreferences.askForMediaAccess('screen');
      return granted;
    } catch (error) {
      console.error('Error requesting screen capture permission:', error);
      return false;
    }
  }

  // 检查辅助功能权限
  checkAccessibilityPermission(): boolean {
    try {
      return systemPreferences.isTrustedAccessibilityClient(false);
    } catch (error) {
      console.error('Error checking accessibility permission:', error);
      return false;
    }
  }

  // 请求辅助功能权限（这个无法通过代码直接请求，需要用户手动设置）
  async requestAccessibilityPermission(): Promise<boolean> {
    const hasPermission = this.checkAccessibilityPermission();
    
    if (!hasPermission) {
      await this.showPermissionDialog('accessibility');
      // 再次检查权限状态
      return this.checkAccessibilityPermission();
    }
    
    return true;
  }

  // 检查通知权限
  async checkNotificationPermission(): Promise<boolean> {
    try {
      // Electron 的通知权限检查
      if (Notification && 'permission' in Notification) {
        return Notification.permission === 'granted';
      }
      return true; // 如果无法检查，假设已授权
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return true;
    }
  }

  // 请求通知权限
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (Notification && 'requestPermission' in Notification) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return true;
    }
  }

  // 检查所有权限状态
  async checkAllPermissions(): Promise<PermissionStatus> {
    const [screenCapture, accessibility, notifications] = await Promise.all([
      this.checkScreenCapturePermission(),
      Promise.resolve(this.checkAccessibilityPermission()),
      this.checkNotificationPermission()
    ]);

    return {
      screenCapture,
      accessibility,
      notifications
    };
  }

  // 显示权限对话框
  private async showPermissionDialog(permissionType: 'screen-recording' | 'accessibility'): Promise<void> {
    let title: string;
    let message: string;
    let settingsPath: string;

    switch (permissionType) {
      case 'screen-recording':
        title = '需要屏幕录制权限';
        message = 'ScreenWatcher 需要屏幕录制权限来捕获屏幕内容。请在系统偏好设置中授权。';
        settingsPath = 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture';
        break;
      case 'accessibility':
        title = '需要辅助功能权限';
        message = 'ScreenWatcher 需要辅助功能权限来监听系统事件。请在系统偏好设置中授权。';
        settingsPath = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility';
        break;
    }

    const result = await dialog.showMessageBox({
      type: 'warning',
      title,
      message,
      detail: '点击"打开设置"将跳转到系统偏好设置页面。授权后请重启应用使设置生效。',
      buttons: ['取消', '打开设置'],
      defaultId: 1,
      cancelId: 0,
    });

    if (result.response === 1) {
      shell.openExternal(settingsPath);
    }
  }

  // 显示权限引导界面
  async showPermissionGuide(parentWindow?: BrowserWindow): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    const missingPermissions: string[] = [];

    if (!permissions.screenCapture) {
      missingPermissions.push('屏幕录制');
    }
    if (!permissions.accessibility) {
      missingPermissions.push('辅助功能');
    }

    if (missingPermissions.length === 0) {
      return true;
    }

    const message = `ScreenWatcher 需要以下权限才能正常工作：\n\n${missingPermissions.map(p => `• ${p}`).join('\n')}\n\n请授权后重启应用。`;

    const result = await dialog.showMessageBox(parentWindow || {}, {
      type: 'info',
      title: '权限设置',
      message: '需要系统权限',
      detail: message,
      buttons: ['稍后设置', '打开系统设置'],
      defaultId: 1,
      cancelId: 0,
    });

    if (result.response === 1) {
      if (!permissions.screenCapture) {
        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
      } else if (!permissions.accessibility) {
        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
      }
    }

    return false;
  }

  // 打开屏幕录制设置
  openScreenRecordingSettings(): void {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
  }

  // 打开辅助功能设置
  openAccessibilitySettings(): void {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
  }

  // 检查应用是否有必要的权限运行核心功能
  async hasRequiredPermissions(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    return permissions.screenCapture; // 屏幕录制是必须的，辅助功能是可选的
  }

  // 等待权限变化（轮询检查）
  async waitForPermissionChange(
    permissionType: 'screen' | 'accessibility',
    timeout: number = 30000
  ): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 1000; // 每秒检查一次

    return new Promise((resolve) => {
      const check = async () => {
        let hasPermission: boolean;
        
        if (permissionType === 'screen') {
          hasPermission = await this.checkScreenCapturePermission();
        } else {
          hasPermission = this.checkAccessibilityPermission();
        }

        if (hasPermission) {
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }

        setTimeout(check, checkInterval);
      };

      check();
    });
  }

  // 监听权限变化
  onPermissionChange(callback: (permissions: PermissionStatus) => void): () => void {
    let lastStatus: PermissionStatus;
    
    const checkPermissions = async () => {
      const currentStatus = await this.checkAllPermissions();
      
      if (!lastStatus || 
          currentStatus.screenCapture !== lastStatus.screenCapture ||
          currentStatus.accessibility !== lastStatus.accessibility ||
          currentStatus.notifications !== lastStatus.notifications) {
        lastStatus = currentStatus;
        callback(currentStatus);
      }
    };

    // 立即检查一次
    checkPermissions();

    // 定期检查权限变化
    const interval = setInterval(checkPermissions, 2000);

    // 返回清理函数
    return () => {
      clearInterval(interval);
    };
  }
}