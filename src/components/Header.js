import React from 'react';
import './Header.css';

// 头部组件
const Header = ({ currentView, onMinimize, onClose, isCapturing }) => {
  // 视图标题映射
  const getViewTitle = (view) => {
    switch (view) {
      case 'dashboard':
        return 'ScreenWatcher';
      case 'capture':
        return '屏幕捕获';
      case 'data':
        return '数据查看';
      case 'settings':
        return '设置';
      default:
        return 'ScreenWatcher';
    }
  };

  return (
    <header className="app-header drag-region">
      <div className="header-content">
        <div className="header-left">
          <div className="app-icon">
            <div className={`status-dot ${isCapturing ? 'active' : 'inactive'}`}></div>
          </div>
          <h1 className="app-title">{getViewTitle(currentView)}</h1>
        </div>
        
        <div className="header-right no-drag">
          <button
            className="header-btn minimize-btn"
            onClick={onMinimize}
            title="最小化"
            aria-label="最小化窗口"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5.5" width="8" height="1" fill="currentColor"/>
            </svg>
          </button>
          
          <button
            className="header-btn close-btn"
            onClick={onClose}
            title="关闭"
            aria-label="关闭窗口"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;