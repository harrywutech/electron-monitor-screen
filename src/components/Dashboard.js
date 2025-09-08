import React from 'react';
import './Dashboard.css';

const Dashboard = ({
  isCapturing,
  captureStatus,
  screenshots,
  onToggleCapture,
  onViewChange
}) => {
  // 获取状态文本
  const getStatusText = () => {
    switch (captureStatus) {
      case 'capturing':
        return '正在监听...';
      case 'starting':
        return '正在启动...';
      case 'stopping':
        return '正在停止...';
      case 'error':
        return '发生错误';
      case 'stopped':
      default:
        return '监听已停止';
    }
  };

  // 获取状态图标
  const getStatusIcon = () => {
    if (captureStatus === 'starting' || captureStatus === 'stopping') {
      return <div className="loading-spinner"></div>;
    }
    
    return (
      <div className={`status-icon ${isCapturing ? 'active' : 'inactive'}`}>
        {isCapturing ? '●' : '○'}
      </div>
    );
  };

  // 最近的截图预览
  const recentScreenshots = screenshots.slice(0, 3);

  return (
    <div className="dashboard">
      {/* 主要控制区域 */}
      <div className="control-panel">
        <div className="status-section">
          <div className="status-display">
            {getStatusIcon()}
            <div className="status-info">
              <h2 className="status-title">{getStatusText()}</h2>
              <p className="status-subtitle">
                {screenshots.length > 0 
                  ? `已捕获 ${screenshots.length} 张截图` 
                  : '尚未开始捕获'
                }
              </p>
            </div>
          </div>
          
          <button
            className={`btn btn-large ${
              isCapturing ? 'btn-danger' : 'btn-primary'
            }`}
            onClick={onToggleCapture}
            disabled={captureStatus === 'starting' || captureStatus === 'stopping'}
          >
            {isCapturing ? '停止监听' : '开始监听'}
          </button>
        </div>
      </div>

      {/* 快速导航 */}
      <div className="quick-nav">
        <button
          className="nav-item"
          onClick={() => onViewChange('capture')}
        >
          <div className="nav-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="5.5" cy="5.5" r="1" fill="currentColor"/>
              <path d="M8 8L11 11H5L8 8Z" fill="currentColor"/>
            </svg>
          </div>
          <span>屏幕捕获</span>
        </button>

        <button
          className="nav-item"
          onClick={() => onViewChange('data')}
        >
          <div className="nav-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2Z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4 6H12M4 8H12M4 10H8" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </div>
          <span>数据查看</span>
        </button>

        <button
          className="nav-item"
          onClick={() => onViewChange('settings')}
        >
          <div className="nav-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M13.5 8C13.5 8.82843 12.8284 9.5 12 9.5C11.1716 9.5 10.5 8.82843 10.5 8C10.5 7.17157 11.1716 6.5 12 6.5C12.8284 6.5 13.5 7.17157 13.5 8Z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5.5 8C5.5 8.82843 4.82843 9.5 4 9.5C3.17157 9.5 2.5 8.82843 2.5 8C2.5 7.17157 3.17157 6.5 4 6.5C4.82843 6.5 5.5 7.17157 5.5 8Z" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </div>
          <span>设置</span>
        </button>
      </div>

      {/* 最近截图预览 */}
      {recentScreenshots.length > 0 && (
        <div className="recent-screenshots">
          <div className="section-header">
            <h3>最近截图</h3>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => onViewChange('data')}
            >
              查看全部
            </button>
          </div>
          
          <div className="screenshot-grid">
            {recentScreenshots.map((screenshot) => (
              <div key={screenshot.id} className="screenshot-item">
                <div className="screenshot-preview">
                  <img
                    src={screenshot.image}
                    alt={`截图 ${new Date(screenshot.timestamp).toLocaleTimeString()}`}
                    loading="lazy"
                  />
                  <div className="screenshot-overlay">
                    <span className="screenshot-time">
                      {new Date(screenshot.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;