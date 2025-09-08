const { autoUpdater } = require('electron-updater');
const { dialog, app } = require('electron');
const log = require('electron-log');

// 配置日志
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// 配置更新服务器
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-username', // 请替换为实际的GitHub用户名
  repo: 'screen-watcher', // 请替换为实际的仓库名
  private: false
});

// 开发环境下的更新设置
if (process.env.NODE_ENV === 'development') {
  autoUpdater.forceDevUpdateConfig = true;
  autoUpdater.updateConfigPath = path.join(__dirname, '../../dev-app-update.yml');
}

class AppUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.updateDownloaded = false;
    this.setupEvents();
    
    // 延迟检查更新，避免影响应用启动
    setTimeout(() => {
      this.checkForUpdates();
    }, 10000);
  }

  setupEvents() {
    // 检查更新错误
    autoUpdater.on('error', (error) => {
      log.error('更新错误:', error);
      
      // 在开发环境下显示错误详情
      if (process.env.NODE_ENV === 'development') {
        this.showUpdateError(error);
      }
    });

    // 检查到更新
    autoUpdater.on('update-available', (info) => {
      log.info('发现更新:', info);
      this.showUpdateAvailable(info);
    });

    // 没有更新
    autoUpdater.on('update-not-available', (info) => {
      log.info('当前版本是最新的:', info);
      
      // 发送到渲染进程
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('update-not-available', info);
      }
    });

    // 下载进度
    autoUpdater.on('download-progress', (progressObj) => {
      let message = `下载速度: ${Math.round(progressObj.bytesPerSecond / 1024)} KB/s`;
      message += ` - 已下载 ${Math.round(progressObj.percent)}%`;
      message += ` (${Math.round(progressObj.transferred / 1024 / 1024)}MB/${Math.round(progressObj.total / 1024 / 1024)}MB)`;
      
      log.info(message);
      
      // 发送进度到渲染进程
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('download-progress', {
          ...progressObj,
          message
        });
      }
    });

    // 下载完成
    autoUpdater.on('update-downloaded', (info) => {
      log.info('更新下载完成:', info);
      this.updateDownloaded = true;
      this.showUpdateDownloaded(info);
    });

    // 检查更新开始
    autoUpdater.on('checking-for-update', () => {
      log.info('正在检查更新...');
      
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('checking-for-update');
      }
    });
  }

  checkForUpdates() {
    // 只在生产环境或明确启用时检查更新
    if (process.env.NODE_ENV === 'development' && !process.env.FORCE_UPDATE_CHECK) {
      log.info('开发环境，跳过更新检查');
      return;
    }

    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      log.error('检查更新失败:', error);
    }
  }

  showUpdateAvailable(info) {
    const options = {
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}`,
      detail: this.generateUpdateDetails(info),
      buttons: ['立即下载', '稍后提醒', '查看详情'],
      defaultId: 0,
      cancelId: 1
    };

    dialog.showMessageBox(this.mainWindow, options).then(({ response }) => {
      switch (response) {
        case 0: // 立即下载
          this.downloadUpdate();
          break;
        case 1: // 稍后提醒
          // 30分钟后再次提醒
          setTimeout(() => {
            this.checkForUpdates();
          }, 30 * 60 * 1000);
          break;
        case 2: // 查看详情
          this.showReleaseNotes(info);
          break;
      }
    });
  }

  downloadUpdate() {
    try {
      autoUpdater.downloadUpdate();
      
      // 显示下载进度通知
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('update-download-started');
      }
    } catch (error) {
      log.error('开始下载更新失败:', error);
      this.showUpdateError(error);
    }
  }

  showUpdateDownloaded(info) {
    const options = {
      type: 'info',
      title: '更新就绪',
      message: '更新已下载完成',
      detail: `版本 ${info.version} 已准备安装。应用将重启以应用更新。\n\n建议先保存正在进行的工作。`,
      buttons: ['立即重启', '稍后重启'],
      defaultId: 0,
      cancelId: 1
    };

    dialog.showMessageBox(this.mainWindow, options).then(({ response }) => {
      if (response === 0) {
        // 给用户一点时间保存工作
        setTimeout(() => {
          this.quitAndInstall();
        }, 1000);
      } else {
        // 发送到渲染进程，显示"稍后重启"按钮
        if (this.mainWindow && this.mainWindow.webContents) {
          this.mainWindow.webContents.send('update-ready-to-install', info);
        }
      }
    });
  }

  quitAndInstall() {
    if (this.updateDownloaded) {
      // 发送即将重启的事件
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('app-will-restart');
      }
      
      setImmediate(() => {
        app.removeAllListeners('window-all-closed');
        autoUpdater.quitAndInstall();
      });
    } else {
      log.error('尝试安装更新，但更新未下载完成');
    }
  }

  showUpdateError(error) {
    const errorMessage = this.formatErrorMessage(error);
    
    dialog.showErrorBox('更新错误', errorMessage);
    
    // 发送错误到渲染进程
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('update-error', {
        message: errorMessage,
        error: error.toString()
      });
    }
  }

  showReleaseNotes(info) {
    const { shell } = require('electron');
    const releaseUrl = `https://github.com/your-username/screen-watcher/releases/tag/${info.version}`;
    shell.openExternal(releaseUrl);
  }

  generateUpdateDetails(info) {
    let details = `当前版本: ${app.getVersion()}\n新版本: ${info.version}`;
    
    if (info.releaseDate) {
      details += `\n发布日期: ${new Date(info.releaseDate).toLocaleDateString('zh-CN')}`;
    }
    
    if (info.files && info.files.length > 0) {
      const totalSize = info.files.reduce((sum, file) => sum + (file.size || 0), 0);
      if (totalSize > 0) {
        details += `\n下载大小: ${Math.round(totalSize / 1024 / 1024)} MB`;
      }
    }
    
    return details;
  }

  formatErrorMessage(error) {
    let message = '检查更新时发生错误';
    
    if (error.code) {
      message += `\n错误代码: ${error.code}`;
    }
    
    if (error.message) {
      message += `\n错误信息: ${error.message}`;
    }
    
    // 常见错误的用户友好提示
    if (error.message && error.message.includes('ENOTFOUND')) {
      message += '\n\n请检查网络连接后重试。';
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      message += '\n\n无法连接到更新服务器，请稍后重试。';
    }
    
    return message;
  }

  // 手动检查更新（从菜单或按钮触发）
  manualCheckForUpdates() {
    log.info('手动检查更新');
    
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('manual-update-check-started');
    }
    
    autoUpdater.checkForUpdatesAndNotify().then((result) => {
      if (!result || !result.updateInfo) {
        // 没有更新时显示提示
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: '检查更新',
          message: '您正在使用最新版本',
          detail: `当前版本: ${app.getVersion()}`,
          buttons: ['确定']
        });
      }
    }).catch((error) => {
      log.error('手动检查更新失败:', error);
      this.showUpdateError(error);
    });
  }
}

module.exports = AppUpdater;