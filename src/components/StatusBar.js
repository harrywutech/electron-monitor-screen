import React from 'react';
import './StatusBar.css';

const StatusBar = ({ isCapturing, captureStatus, screenshotCount, appInfo }) => {
  // 获取状态文本
  const getStatusText = () => {
    switch (captureStatus) {
      case 'capturing':
        return '监听中';
      case 'starting':
        return '启动中';
      case 'stopping':
        return '停止中';
      case 'error':
        return '错误';
      case 'stopped':
      default:
        return '已停止';
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    switch (captureStatus) {
      case 'capturing':
        return '#34C759';
      case 'starting':
      case 'stopping':
        return '#FF9F0A';
      case 'error':
        return '#FF3B30';
      case 'stopped':
      default:
        return '#8E8E93';
    }
  };

  return (
    <footer className="status-bar">
      <div className="status-left">
        <div className="status-indicator">
          <div
            className="status-dot"
            style={{ backgroundColor: getStatusColor() }}
          ></div>
          <span className="status-text">{getStatusText()}</span>
        </div>
        
        {screenshotCount > 0 && (
          <div className="screenshot-counter">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="2.5" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1"/>
              <circle cx="4" cy="5" r="0.5" fill="currentColor"/>
              <path d="M6 6.5L8 8.5H4L6 6.5Z" fill="currentColor"/>
            </svg>
            <span>{screenshotCount}</span>
          </div>
        )}
      </div>

      <div className="status-right">
        {appInfo && (
          <span className="version-info">
            v{appInfo.version}
          </span>
        )}
      </div>
    </footer>
  );
};

export default StatusBar;