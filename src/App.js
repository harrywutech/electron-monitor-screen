import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// 组件导入
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ScreenCapture from './components/ScreenCapture';
import DataViewer from './components/DataViewer';
import Settings from './components/Settings';
import StatusBar from './components/StatusBar';

// 主应用组件
function App() {
  // 应用状态
  const [currentView, setCurrentView] = useState('dashboard');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('stopped');
  const [screenshots, setScreenshots] = useState([]);
  const [appInfo, setAppInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 检查是否在Electron环境中运行
  const isElectron = window.electronAPI !== undefined;

  // 初始化应用
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      try {
        if (isElectron) {
          // 获取应用信息
          const info = await window.electronAPI.getAppInfo();
          setAppInfo(info);

          // 获取捕获状态
          const status = await window.electronAPI.getCaptureStatus();
          setIsCapturing(status.isCapturing);
          setCaptureStatus(status.isCapturing ? 'capturing' : 'stopped');

          console.log('App initialized:', info);
        } else {
          // 浏览器环境的模拟数据
          setAppInfo({
            name: 'ScreenWatcher',
            version: '1.0.0',
            platform: 'browser'
          });
        }
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [isElectron]);

  // 设置事件监听器
  useEffect(() => {
    if (!isElectron) return;

    // 监听新截图
    const handleNewScreenshot = (screenshotData) => {
      console.log('New screenshot received:', screenshotData);
      setScreenshots(prev => [screenshotData, ...prev.slice(0, 99)]); // 保持最新100张
    };

    // 监听捕获状态变化
    const handleCaptureStatusChanged = (status) => {
      console.log('Capture status changed:', status);
      setIsCapturing(status.isCapturing);
      setCaptureStatus(status.isCapturing ? 'capturing' : 'stopped');
    };

    // 监听显示设置页面
    const handleShowSettings = () => {
      setCurrentView('settings');
    };

    // 注册事件监听
    window.electronAPI.onNewScreenshot(handleNewScreenshot);
    window.electronAPI.onCaptureStatusChanged(handleCaptureStatusChanged);
    window.electronAPI.onShowSettings(handleShowSettings);

    // 清理事件监听器
    return () => {
      if (window.electronAPI.removeAllListeners) {
        window.electronAPI.removeAllListeners('new-screenshot');
        window.electronAPI.removeAllListeners('capture-status-changed');
        window.electronAPI.removeAllListeners('show-settings');
      }
    };
  }, [isElectron]);

  // 开始捕获
  const handleStartCapture = useCallback(async () => {
    if (!isElectron) {
      // 浏览器环境的模拟
      setIsCapturing(true);
      setCaptureStatus('capturing');
      return;
    }

    try {
      setCaptureStatus('starting');
      const result = await window.electronAPI.startCapture();
      if (result.success) {
        setIsCapturing(true);
        setCaptureStatus('capturing');
      } else {
        setCaptureStatus('error');
      }
    } catch (error) {
      console.error('Start capture failed:', error);
      setCaptureStatus('error');
    }
  }, [isElectron]);

  // 停止捕获
  const handleStopCapture = useCallback(async () => {
    if (!isElectron) {
      // 浏览器环境的模拟
      setIsCapturing(false);
      setCaptureStatus('stopped');
      return;
    }

    try {
      setCaptureStatus('stopping');
      const result = await window.electronAPI.stopCapture();
      if (result.success) {
        setIsCapturing(false);
        setCaptureStatus('stopped');
      } else {
        setCaptureStatus('error');
      }
    } catch (error) {
      console.error('Stop capture failed:', error);
      setCaptureStatus('error');
    }
  }, [isElectron]);

  // 切换捕获状态
  const toggleCapture = useCallback(() => {
    if (isCapturing) {
      handleStopCapture();
    } else {
      handleStartCapture();
    }
  }, [isCapturing, handleStartCapture, handleStopCapture]);

  // 窗口控制
  const handleMinimize = useCallback(async () => {
    if (isElectron) {
      await window.electronAPI.windowMinimize();
    }
  }, [isElectron]);

  const handleClose = useCallback(async () => {
    if (isElectron) {
      await window.electronAPI.windowClose();
    }
  }, [isElectron]);

  // 加载界面
  if (isLoading) {
    return (
      <div className="app loading">
        <div className="glass-panel loading-panel">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>正在启动 ScreenWatcher...</p>
          </div>
        </div>
      </div>
    );
  }

  // 渲染视图内容
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            isCapturing={isCapturing}
            captureStatus={captureStatus}
            screenshots={screenshots}
            onToggleCapture={toggleCapture}
            onViewChange={setCurrentView}
          />
        );
      case 'capture':
        return (
          <ScreenCapture
            isCapturing={isCapturing}
            onStartCapture={handleStartCapture}
            onStopCapture={handleStopCapture}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'data':
        return (
          <DataViewer
            screenshots={screenshots}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'settings':
        return (
          <Settings
            appInfo={appInfo}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      default:
        return (
          <Dashboard
            isCapturing={isCapturing}
            captureStatus={captureStatus}
            screenshots={screenshots}
            onToggleCapture={toggleCapture}
            onViewChange={setCurrentView}
          />
        );
    }
  };

  return (
    <div className="app">
      <div className="glass-panel app-container">
        <Header
          currentView={currentView}
          onMinimize={handleMinimize}
          onClose={handleClose}
          isCapturing={isCapturing}
        />
        
        <main className="app-content">
          {renderCurrentView()}
        </main>

        <StatusBar
          isCapturing={isCapturing}
          captureStatus={captureStatus}
          screenshotCount={screenshots.length}
          appInfo={appInfo}
        />
      </div>
    </div>
  );
}

export default App;