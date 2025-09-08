const { app, BrowserWindow, globalShortcut, systemPreferences } = require('electron');
const path = require('path');

// 保持对窗口对象的全局引用
let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 320,
    height: 288,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载应用的测试界面
  mainWindow.loadFile('test-ui.html');

  // 当窗口被关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('ScreenWatcher窗口已显示');
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

  // 注册全局快捷键 Command+\
  const ret = globalShortcut.register('Command+\\', () => {
    console.log('Command+\\ 被按下');
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });

  if (!ret) {
    console.log('快捷键注册失败');
  }

  // 检查权限
  checkPermissions();

  app.on('activate', () => {
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口被关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，应用和它们的菜单栏会保持激活状态，直到用户通过Cmd + Q退出
  if (process.platform !== 'darwin') app.quit();
});

// 在应用即将退出时取消注册快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// 检查系统权限
async function checkPermissions() {
  try {
    // 检查屏幕录制权限
    const screenAccess = systemPreferences.getMediaAccessStatus('screen');
    console.log('屏幕录制权限状态:', screenAccess);
    
    if (screenAccess !== 'granted') {
      console.log('需要屏幕录制权限');
      // 这里可以显示权限请求界面
    }
  } catch (error) {
    console.error('权限检查失败:', error);
  }
}

console.log('ScreenWatcher正在启动...');