import React, { useState, useEffect } from 'react';
import './Settings.css';

const Settings = ({ appInfo, onBack }) => {
  const [settings, setSettings] = useState({
    general: {
      autoStart: false,
      startMinimized: true,
      alwaysOnTop: true,
      hideInDock: true,
    },
    capture: {
      interval: 2000,
      quality: 'high',
      autoCapture: false,
      captureAudio: false,
    },
    storage: {
      maxScreenshots: 1000,
      autoCleanup: true,
      cleanupDays: 30,
      encryptData: false,
    },
    privacy: {
      screenRecordingPermission: false,
      accessibilityPermission: false,
    },
    appearance: {
      theme: 'dark',
      transparency: 85,
      animations: true,
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  // 检查是否在Electron环境中运行
  const isElectron = window.electronAPI !== undefined;

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      if (!isElectron) return;

      try {
        setIsLoading(true);
        const savedSettings = await window.configAPI?.getAll();
        if (savedSettings) {
          setSettings(prev => ({ ...prev, ...savedSettings }));
        }

        // 检查权限状态
        const permissions = await window.systemAPI?.checkPermissions();
        if (permissions) {
          setSettings(prev => ({
            ...prev,
            privacy: {
              ...prev.privacy,
              ...permissions
            }
          }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isElectron]);

  // 更新设置
  const updateSetting = async (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    
    setSettings(newSettings);

    // 保存到本地
    if (isElectron && window.configAPI) {
      try {
        await window.configAPI.set(`${category}.${key}`, value);
      } catch (error) {
        console.error('Failed to save setting:', error);
      }
    }
  };

  // 请求权限
  const requestPermissions = async () => {
    if (!isElectron || !window.systemAPI) return;

    try {
      setIsLoading(true);
      const result = await window.systemAPI.requestPermissions();
      
      if (result) {
        setSettings(prev => ({
          ...prev,
          privacy: {
            ...prev.privacy,
            ...result
          }
        }));
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 重置设置
  const resetSettings = async () => {
    if (window.confirm('确定要重置所有设置吗？此操作无法撤销。')) {
      if (isElectron && window.configAPI) {
        try {
          await window.configAPI.reset();
          window.location.reload(); // 重新加载应用
        } catch (error) {
          console.error('Failed to reset settings:', error);
        }
      }
    }
  };

  // 选项卡配置
  const tabs = [
    { id: 'general', label: '通用', icon: '⚙️' },
    { id: 'capture', label: '捕获', icon: '📷' },
    { id: 'storage', label: '存储', icon: '💾' },
    { id: 'privacy', label: '隐私', icon: '🔒' },
    { id: 'appearance', label: '外观', icon: '🎨' },
    { id: 'about', label: '关于', icon: 'ℹ️' }
  ];

  // 渲染设置项
  const renderSettingItem = (category, key, label, type = 'toggle', options = null) => {
    const value = settings[category][key];

    switch (type) {
      case 'toggle':
        return (
          <div className="setting-item" key={`${category}-${key}`}>
            <div className="setting-info">
              <label className="setting-label">{label}</label>
            </div>
            <div className="setting-control">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateSetting(category, key, e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="setting-item" key={`${category}-${key}`}>
            <div className="setting-info">
              <label className="setting-label">{label}</label>
            </div>
            <div className="setting-control">
              <select
                className="setting-select"
                value={value}
                onChange={(e) => updateSetting(category, key, e.target.value)}
              >
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="setting-item" key={`${category}-${key}`}>
            <div className="setting-info">
              <label className="setting-label">{label}</label>
            </div>
            <div className="setting-control">
              <input
                type="number"
                className="setting-input"
                value={value}
                onChange={(e) => updateSetting(category, key, parseInt(e.target.value))}
                {...options}
              />
            </div>
          </div>
        );

      case 'range':
        return (
          <div className="setting-item" key={`${category}-${key}`}>
            <div className="setting-info">
              <label className="setting-label">{label}</label>
              <span className="setting-value">{value}%</span>
            </div>
            <div className="setting-control">
              <input
                type="range"
                className="setting-range"
                value={value}
                onChange={(e) => updateSetting(category, key, parseInt(e.target.value))}
                {...options}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // 渲染选项卡内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="settings-section">
            <h3>启动设置</h3>
            {renderSettingItem('general', 'autoStart', '开机自启动')}
            {renderSettingItem('general', 'startMinimized', '启动时最小化')}
            
            <h3>窗口设置</h3>
            {renderSettingItem('general', 'alwaysOnTop', '始终置顶')}
            {renderSettingItem('general', 'hideInDock', '隐藏程序坞图标')}
          </div>
        );

      case 'capture':
        return (
          <div className="settings-section">
            <h3>捕获设置</h3>
            {renderSettingItem('capture', 'interval', '捕获间隔(毫秒)', 'select', [
              { value: 1000, label: '1秒' },
              { value: 2000, label: '2秒' },
              { value: 5000, label: '5秒' },
              { value: 10000, label: '10秒' }
            ])}
            {renderSettingItem('capture', 'quality', '图片质量', 'select', [
              { value: 'low', label: '低质量' },
              { value: 'medium', label: '中等质量' },
              { value: 'high', label: '高质量' }
            ])}
            {renderSettingItem('capture', 'autoCapture', '自动开始捕获')}
            {renderSettingItem('capture', 'captureAudio', '同时录制音频')}
          </div>
        );

      case 'storage':
        return (
          <div className="settings-section">
            <h3>存储管理</h3>
            {renderSettingItem('storage', 'maxScreenshots', '最大截图数量', 'number', { min: 100, max: 10000, step: 100 })}
            {renderSettingItem('storage', 'autoCleanup', '自动清理旧数据')}
            {renderSettingItem('storage', 'cleanupDays', '保留天数', 'number', { min: 1, max: 365 })}
            {renderSettingItem('storage', 'encryptData', '加密存储数据')}
          </div>
        );

      case 'privacy':
        return (
          <div className="settings-section">
            <h3>权限状态</h3>
            <div className="permission-item">
              <div className="permission-info">
                <label className="permission-label">屏幕录制权限</label>
                <p className="permission-desc">允许应用捕获屏幕内容</p>
              </div>
              <div className="permission-status">
                <span className={`status-badge ${settings.privacy.screenRecordingPermission ? 'granted' : 'denied'}`}>
                  {settings.privacy.screenRecordingPermission ? '已授权' : '未授权'}
                </span>
              </div>
            </div>
            
            <div className="permission-item">
              <div className="permission-info">
                <label className="permission-label">辅助功能权限</label>
                <p className="permission-desc">允许应用控制其他应用</p>
              </div>
              <div className="permission-status">
                <span className={`status-badge ${settings.privacy.accessibilityPermission ? 'granted' : 'denied'}`}>
                  {settings.privacy.accessibilityPermission ? '已授权' : '未授权'}
                </span>
              </div>
            </div>
            
            <button
              className="btn btn-primary"
              onClick={requestPermissions}
              disabled={isLoading}
            >
              {isLoading ? '检查中...' : '检查并申请权限'}
            </button>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-section">
            <h3>主题设置</h3>
            {renderSettingItem('appearance', 'theme', '外观主题', 'select', [
              { value: 'dark', label: '深色' },
              { value: 'light', label: '浅色' },
              { value: 'auto', label: '跟随系统' }
            ])}
            {renderSettingItem('appearance', 'transparency', '透明度', 'range', { min: 50, max: 100 })}
            {renderSettingItem('appearance', 'animations', '启用动画效果')}
          </div>
        );

      case 'about':
        return (
          <div className="settings-section about-section">
            <div className="app-info">
              <div className="app-icon-large">SW</div>
              <h2>{appInfo?.name || 'ScreenWatcher'}</h2>
              <p className="version">版本 {appInfo?.version || '1.0.0'}</p>
            </div>
            
            <div className="app-details">
              <div className="detail-item">
                <span className="detail-label">平台:</span>
                <span className="detail-value">{appInfo?.platform || 'Unknown'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">架构:</span>
                <span className="detail-value">{appInfo?.arch || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="about-actions">
              <button className="btn btn-danger" onClick={resetSettings}>
                重置所有设置
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <button className="btn btn-secondary btn-icon" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 2L2 8L8 14M2 8H14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2>设置</h2>
        <div></div>
      </div>

      <div className="settings-content">
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-panel">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;