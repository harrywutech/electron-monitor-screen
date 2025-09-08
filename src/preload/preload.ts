import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../common/types';

// 定义暴露给渲染进程的API
export interface ElectronAPI {
  // 窗口管理
  toggleWindow: () => Promise<void>;
  showWindow: () => Promise<void>;
  hideWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // 屏幕捕获
  startCapture: (options: any) => Promise<any>;
  stopCapture: () => Promise<any>;
  getCaptureStatus: () => Promise<any>;
  takeScreenshot: () => Promise<any>;
  
  // 权限管理
  checkPermissions: () => Promise<any>;
  requestPermission: (type: string) => Promise<boolean>;
  openPermissionSettings: (type: string) => Promise<void>;
  
  // 应用控制
  getVersion: () => Promise<string>;
  quitApp: () => Promise<void>;
  restartApp: () => Promise<void>;
  
  // 设置
  showSettings: () => Promise<void>;
  
  // 事件监听
  onCaptureResult: (callback: (result: any) => void) => void;
  onMonitoringStatusChange: (callback: (isActive: boolean) => void) => void;
  onPermissionChange: (callback: (permissions: any) => void) => void;
  
  // 移除事件监听
  removeAllListeners: (channel: string) => void;
}

// 创建安全的API对象
const electronAPI: ElectronAPI = {
  // 窗口管理
  toggleWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE),
  showWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SHOW),
  hideWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_HIDE),
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
  
  // 屏幕捕获
  startCapture: (options) => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_START, options),
  stopCapture: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_STOP),
  getCaptureStatus: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_STATUS),
  takeScreenshot: () => ipcRenderer.invoke(IPC_CHANNELS.CAPTURE_SCREENSHOT),
  
  // 权限管理
  checkPermissions: () => ipcRenderer.invoke(IPC_CHANNELS.PERMISSIONS_CHECK),
  requestPermission: (type) => ipcRenderer.invoke(IPC_CHANNELS.PERMISSIONS_REQUEST, type),
  openPermissionSettings: (type) => ipcRenderer.invoke(IPC_CHANNELS.PERMISSIONS_OPEN_SETTINGS, type),
  
  // 应用控制
  getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_VERSION),
  quitApp: () => ipcRenderer.invoke(IPC_CHANNELS.APP_QUIT),
  restartApp: () => ipcRenderer.invoke(IPC_CHANNELS.APP_RESTART),
  
  // 设置
  showSettings: () => ipcRenderer.invoke('show-settings'),
  
  // 事件监听
  onCaptureResult: (callback) => {
    ipcRenderer.on('capture-result', (event, result) => callback(result));
  },
  
  onMonitoringStatusChange: (callback) => {
    ipcRenderer.on('monitoring-status-changed', (event, isActive) => callback(isActive));
  },
  
  onPermissionChange: (callback) => {
    ipcRenderer.on('permission-changed', (event, permissions) => callback(permissions));
  },
  
  // 移除事件监听
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

// 将API暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型定义，供渲染进程使用
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}