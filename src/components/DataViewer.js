import React, { useState, useEffect } from 'react';
import './DataViewer.css';

const DataViewer = ({ screenshots, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredScreenshots, setFilteredScreenshots] = useState([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // 过滤截图
  useEffect(() => {
    let filtered = [...screenshots];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(screenshot => 
        screenshot.source?.toLowerCase().includes(query) ||
        new Date(screenshot.timestamp).toLocaleString().toLowerCase().includes(query)
      );
    }
    
    setFilteredScreenshots(filtered);
  }, [screenshots, searchQuery]);

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒前`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // 删除截图
  const handleDeleteScreenshot = (id) => {
    // 这里应该调用删除API
    console.log('Delete screenshot:', id);
  };

  // 导出截图
  const handleExportScreenshot = (screenshot) => {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = screenshot.image;
    link.download = `screenshot_${new Date(screenshot.timestamp).getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="data-viewer">
      <div className="viewer-header">
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
        
        <div className="viewer-title">
          <h2>数据查看</h2>
          <span className="screenshot-count">共 {filteredScreenshots.length} 张截图</span>
        </div>

        <div className="viewer-controls">
          <button
            className={`btn btn-icon ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('grid')}
            title="网格视图"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
          
          <button
            className={`btn btn-icon ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
            title="列表视图"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="search-bar">
        <div className="search-input-container">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13 13L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="搜索截图..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery('')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 截图列表 */}
      <div className="screenshots-container">
        {filteredScreenshots.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="10" width="36" height="26" rx="3" stroke="currentColor" strokeWidth="2"/>
              <circle cx="15" cy="19" r="2" fill="currentColor"/>
              <path d="M22 26L28 32H16L22 26Z" fill="currentColor"/>
            </svg>
            <h3>暂无截图</h3>
            <p>{searchQuery ? '未找到匹配的截图' : '开始监听屏幕以查看截图数据'}</p>
          </div>
        ) : (
          <div className={`screenshots-${viewMode}`}>
            {filteredScreenshots.map((screenshot) => (
              <div
                key={screenshot.id}
                className="screenshot-card"
                onClick={() => setSelectedScreenshot(screenshot)}
              >
                <div className="screenshot-image">
                  <img
                    src={screenshot.image}
                    alt={`截图 ${formatTime(screenshot.timestamp)}`}
                    loading="lazy"
                  />
                  {viewMode === 'grid' && (
                    <div className="screenshot-overlay">
                      <span className="screenshot-time">
                        {formatTime(screenshot.timestamp)}
                      </span>
                    </div>
                  )}
                </div>
                
                {viewMode === 'list' && (
                  <div className="screenshot-info">
                    <div className="info-main">
                      <h4 className="screenshot-title">
                        {screenshot.source || '屏幕截图'}
                      </h4>
                      <p className="screenshot-details">
                        {new Date(screenshot.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="screenshot-actions">
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportScreenshot(screenshot);
                        }}
                        title="导出"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 1V8M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1 9V10C1 10.5523 1.44772 11 2 11H10C10.5523 11 11 10.5523 11 10V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScreenshot(screenshot.id);
                        }}
                        title="删除"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 截图详情模态框 */}
      {selectedScreenshot && (
        <div className="screenshot-modal" onClick={() => setSelectedScreenshot(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedScreenshot.source || '屏幕截图'}</h3>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setSelectedScreenshot(null)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4L12 12M12 4L4 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            
            <div className="modal-image">
              <img
                src={selectedScreenshot.image}
                alt="截图详情"
              />
            </div>
            
            <div className="modal-info">
              <p><strong>时间:</strong> {new Date(selectedScreenshot.timestamp).toLocaleString()}</p>
              <p><strong>来源:</strong> {selectedScreenshot.source || '未知'}</p>
            </div>
            
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleExportScreenshot(selectedScreenshot)}
              >
                导出截图
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  handleDeleteScreenshot(selectedScreenshot.id);
                  setSelectedScreenshot(null);
                }}
              >
                删除截图
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataViewer;