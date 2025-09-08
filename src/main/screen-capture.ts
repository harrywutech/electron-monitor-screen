import { desktopCapturer, screen, BrowserWindow } from 'electron';
import { CaptureOptions, CaptureError, WindowInfo } from '../common/types';
import { PermissionManager } from './permission-manager';

export interface CaptureResult {
  dataURL: string;
  timestamp: Date;
  windowInfo?: WindowInfo;
}

export class ScreenCaptureService {
  private permissionManager: PermissionManager;
  private isCapturing: boolean = false;
  private captureInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.permissionManager = PermissionManager.getInstance();
  }

  // 获取所有可用的屏幕和窗口源
  async getAvailableSources(): Promise<Electron.DesktopCapturerSource[]> {
    try {
      // 检查屏幕录制权限
      const hasPermission = await this.permissionManager.checkScreenCapturePermission();
      if (!hasPermission) {
        throw new CaptureError('Screen recording permission not granted');
      }

      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 320, height: 240 },
        fetchWindowIcons: true
      });

      return sources;
    } catch (error) {
      console.error('Error getting desktop sources:', error);
      throw new CaptureError(`Failed to get desktop sources: ${error}`);
    }
  }

  // 获取主屏幕截图
  async captureMainScreen(): Promise<CaptureResult> {
    try {
      const sources = await this.getAvailableSources();
      const mainScreen = sources.find(source => source.id.startsWith('screen:'));
      
      if (!mainScreen) {
        throw new CaptureError('No screen source available');
      }

      return this.captureFromSource(mainScreen);
    } catch (error) {
      console.error('Error capturing main screen:', error);
      throw new CaptureError(`Failed to capture main screen: ${error}`);
    }
  }

  // 捕获指定窗口
  async captureWindow(windowId: string): Promise<CaptureResult> {
    try {
      const sources = await this.getAvailableSources();
      const windowSource = sources.find(source => source.id === windowId);
      
      if (!windowSource) {
        throw new CaptureError(`Window source ${windowId} not found`);
      }

      return this.captureFromSource(windowSource);
    } catch (error) {
      console.error('Error capturing window:', error);
      throw new CaptureError(`Failed to capture window: ${error}`);
    }
  }

  // 从指定源捕获内容
  private async captureFromSource(source: Electron.DesktopCapturerSource): Promise<CaptureResult> {
    return new Promise((resolve, reject) => {
      // 创建隐藏的BrowserWindow来捕获屏幕
      const captureWindow = new BrowserWindow({
        width: 1,
        height: 1,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        }
      });

      // 获取用户媒体流
      captureWindow.webContents.executeJavaScript(`
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: '${source.id}',
              minWidth: 1280,
              maxWidth: 1920,
              minHeight: 720,
              maxHeight: 1080
            }
          }
        }).then(stream => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          video.addEventListener('loadedmetadata', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            const dataURL = canvas.toDataURL('image/png');
            
            // 停止媒体流
            stream.getTracks().forEach(track => track.stop());
            
            return {
              dataURL: dataURL,
              timestamp: new Date().toISOString(),
              width: canvas.width,
              height: canvas.height
            };
          });
        }).catch(error => {
          throw new Error('Screen capture failed: ' + error.message);
        });
      `).then(result => {
        captureWindow.close();
        
        const windowInfo: WindowInfo = {
          id: parseInt(source.id.replace(/\D/g, '')),
          title: source.name,
          appName: source.appIcon ? 'Unknown' : 'Screen',
          bounds: {
            x: 0, y: 0,
            width: (result as any).width,
            height: (result as any).height
          }
        };

        resolve({
          dataURL: (result as any).dataURL,
          timestamp: new Date((result as any).timestamp),
          windowInfo
        });
      }).catch(error => {
        captureWindow.close();
        reject(new CaptureError(`Screen capture execution failed: ${error.message}`));
      });
    });
  }

  // 开始定期捕获
  async startContinuousCapture(options: CaptureOptions, callback: (result: CaptureResult) => void): Promise<void> {
    if (this.isCapturing) {
      throw new CaptureError('Capture already in progress');
    }

    // 检查权限
    const hasPermission = await this.permissionManager.checkScreenCapturePermission();
    if (!hasPermission) {
      throw new CaptureError('Screen recording permission required');
    }

    this.isCapturing = true;
    const interval = options.interval || 2000; // 默认2秒间隔

    const capture = async () => {
      try {
        let result: CaptureResult;

        switch (options.mode) {
          case 'fullscreen':
            result = await this.captureMainScreen();
            break;
          case 'window':
            if (!options.windowId) {
              throw new CaptureError('Window ID required for window capture mode');
            }
            result = await this.captureWindow(options.windowId.toString());
            break;
          case 'selection':
            // 这里可以实现区域选择功能
            result = await this.captureMainScreen();
            break;
          default:
            result = await this.captureMainScreen();
        }

        callback(result);
      } catch (error) {
        console.error('Capture error:', error);
        // 继续尝试捕获，不停止整个流程
      }
    };

    // 立即执行一次
    await capture();

    // 设置定期捕获
    this.captureInterval = setInterval(capture, interval);
  }

  // 停止连续捕获
  stopContinuousCapture(): void {
    this.isCapturing = false;
    
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  // 检查是否正在捕获
  isCaptureActive(): boolean {
    return this.isCapturing;
  }

  // 获取可用窗口列表
  async getAvailableWindows(): Promise<WindowInfo[]> {
    try {
      const sources = await this.getAvailableSources();
      
      return sources
        .filter(source => source.id.startsWith('window:'))
        .map(source => ({
          id: parseInt(source.id.replace(/\D/g, '')),
          title: source.name,
          appName: this.extractAppName(source.name),
          bounds: {
            x: 0, y: 0,
            width: source.thumbnail.getSize().width,
            height: source.thumbnail.getSize().height
          }
        }));
    } catch (error) {
      console.error('Error getting available windows:', error);
      throw new CaptureError(`Failed to get available windows: ${error}`);
    }
  }

  // 从窗口名称提取应用名称
  private extractAppName(windowTitle: string): string {
    // 通常窗口标题格式为 "文档名 - 应用名"
    const parts = windowTitle.split(' - ');
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
    
    // 或者应用名在开头
    const appPatterns = [
      /^(Chrome|Safari|Firefox|Edge)/,
      /^(VS Code|Xcode|Terminal)/,
      /^(Finder|System Preferences)/,
      /^(Word|Excel|PowerPoint)/,
    ];

    for (const pattern of appPatterns) {
      const match = windowTitle.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return 'Unknown';
  }

  // 获取屏幕信息
  getScreenInfo(): Electron.Display[] {
    return screen.getAllDisplays();
  }

  // 获取主屏幕信息
  getPrimaryScreenInfo(): Electron.Display {
    return screen.getPrimaryDisplay();
  }

  // 清理资源
  cleanup(): void {
    this.stopContinuousCapture();
  }
}