import React, { useState, useEffect } from 'react';
import './ScreenCapture.css';

const ScreenCapture = ({ isCapturing, onStartCapture, onStopCapture, onBack }) => {
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captureSettings, setCaptureSettings] = useState({
    interval: 2000,
    quality: 'high',
    region: 'full'
  });

  // 检查是否在Electron环境中运行
  const isElectron = window.electronAPI !== undefined;

  // 获取屏幕源
  useEffect(() => {
    const fetchSources = async () => {
      if (!isElectron) {
        // 浏览器环境的模拟数据
        setSources([
          { id: 'screen:0', name: '主显示器', thumbnail: '' },
          { id: 'screen:1', name: '副显示器', thumbnail: '' }
        ]);
        return;
      }

      try {
        setIsLoading(true);
        const sourcesData = await window.electronAPI.getSources();
        setSources(sourcesData);
        
        // 默认选择第一个屏幕源
        if (sourcesData.length > 0) {
          setSelectedSource(sourcesData[0]);
        }
      } catch (error) {
        console.error('Failed to get sources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSources();
  }, [isElectron]);

  // 刷新源列表
  const handleRefreshSources = async () => {
    if (!isElectron) return;

    try {
      setIsLoading(true);
      const sourcesData = await window.electronAPI.getSources();
      setSources(sourcesData);
    } catch (error) {
      console.error('Failed to refresh sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 选择捕获源
  const handleSelectSource = (source) => {
    setSelectedSource(source);
  };

  // 更新捕获设置
  const handleSettingChange = (key, value) => {
    setCaptureSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 开始捕获
  const handleStart = async () => {
    if (!selectedSource) return;

    try {
      await onStartCapture({
        source: selectedSource,
        settings: captureSettings
      });
    } catch (error) {
      console.error('Start capture failed:', error);
    }
  };

  return (
    <div className="screen-capture">
      <div className="capture-header">
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
        <h2>屏幕捕获设置</h2>
        <button
          className="btn btn-secondary btn-icon"
          onClick={handleRefreshSources}
          disabled={isLoading}
          title="刷新源列表"
        >
          {isLoading ? (
            <div className="loading-spinner small"></div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8C2 5.79086 3.79086 4 6 4H10L8 2M14 8C14 10.2091 12.2091 12 10 12H6L8 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* 捕获源选择 */}
      <div className="capture-section">
        <h3 className="section-title">选择捕获源</h3>
        
        {isLoading ? (
          <div className="loading-sources">
            <div className="loading-spinner"></div>
            <p>正在获取屏幕源...</p>
          </div>
        ) : (
          <div className="sources-grid">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`source-item ${
                  selectedSource?.id === source.id ? 'selected' : ''
                }`}
                onClick={() => handleSelectSource(source)}
              >
                <div className="source-thumbnail">
                  {source.thumbnail ? (
                    <img src={source.thumbnail} alt={source.name} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="7" cy="8" r="1" fill="currentColor"/>
                        <path d="M10 12L13 15H7L10 12Z" fill="currentColor"/>
                      </svg>
                    </div>
                  )}
                  {selectedSource?.id === source.id && (
                    <div className="source-check">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M13 4L6 11L3 8"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="source-name">{source.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 捕获设置 */}
      <div className="capture-section">
        <h3 className="section-title">捕获设置</h3>
        
        <div className="settings-grid">
          <div className="setting-item">
            <label className="setting-label">捕获间隔</label>
            <select
              className="setting-select"
              value={captureSettings.interval}
              onChange={(e) => handleSettingChange('interval', parseInt(e.target.value))}
            >
              <option value={1000}>1秒</option>
              <option value={2000}>2秒</option>
              <option value={5000}>5秒</option>
              <option value={10000}>10秒</option>
            </select>
          </div>

          <div className="setting-item">
            <label className="setting-label">图片质量</label>
            <select
              className="setting-select"
              value={captureSettings.quality}
              onChange={(e) => handleSettingChange('quality', e.target.value)}
            >
              <option value="low">低质量</option>
              <option value="medium">中等质量</option>
              <option value="high">高质量</option>
            </select>
          </div>

          <div className="setting-item">
            <label className="setting-label">捕获区域</label>
            <select
              className="setting-select"
              value={captureSettings.region}
              onChange={(e) => handleSettingChange('region', e.target.value)}
            >
              <option value="full">全屏</option>
              <option value="window">窗口</option>
              <option value="region">自定义区域</option>
            </select>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="capture-controls">
        {isCapturing ? (
          <button
            className="btn btn-danger btn-large"
            onClick={onStopCapture}
          >
            停止捕获
          </button>
        ) : (
          <button
            className="btn btn-primary btn-large"
            onClick={handleStart}
            disabled={!selectedSource}
          >
            开始捕获
          </button>
        )}
      </div>
    </div>
  );
};

export default ScreenCapture;