import React, { useState, useEffect } from 'react';
import {
  Panel,
  WindowControls,
  Button,
  StatusIndicator,
  StatisticsStatusIndicator,
} from '../components';
import {
  useWindowControl,
  useScreenCapture,
  usePermissions,
  useAppVersion,
} from '../hooks/useElectron';
import styles from './MainPanel.module.scss';

export const MainPanel: React.FC = () => {
  const version = useAppVersion();
  const { closeWindow, showWindow } = useWindowControl();
  const { status, loading, error, startCapture, stopCapture } = useScreenCapture();
  const { permissions, requestPermission } = usePermissions();
  
  const [stats] = useState({
    todayCaptures: 156,
    successRate: 94.2,
    averageTime: 0.3,
    textCount: 89,
  });

  const handleToggleCapture = async () => {
    if (status.isActive) {
      await stopCapture();
    } else {
      // 检查权限
      if (!permissions.screenCapture) {
        const granted = await requestPermission('screen');
        if (!granted) {
          return;
        }
      }
      
      await startCapture({
        mode: 'fullscreen',
        interval: 2000,
      });
    }
  };

  const handleShowSettings = () => {
    if (window.electronAPI) {
      window.electronAPI.showSettings();
    }
  };

  const getStatusText = () => {
    if (loading) return '处理中...';
    if (error) return '错误';
    return status.isActive ? '监听中' : '已停止';
  };

  const getStatusType = () => {
    if (loading) return 'loading';
    if (error) return 'error';
    return status.isActive ? 'active' : 'inactive';
  };

  const getStatsText = () => {
    if (status.isActive) {
      return `最后更新：${status.timestamp ? '刚刚' : '未知'}`;
    }
    return '点击开始监听';
  };

  return (
    <div className={styles.mainPanel}>
      <Panel
        variant="main"
        title="ScreenWatcher"
        titleIcon="🎯"
        actions={
          <WindowControls
            onClose={closeWindow}
            onMinimize={() => showWindow()}
            showMinimize={true}
            showMaximize={false}
          />
        }
        contentNoPadding={false}
        className={styles.panel}
      >
        <div className={styles.content}>
          {/* 状态区域 */}
          <div className={styles.statusSection}>
            <StatisticsStatusIndicator
              status={getStatusType() as any}
              text={getStatusText()}
              stats={getStatsText()}
              size="md"
            />
            
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
          </div>

          {/* 统计区域 */}
          <div className={styles.statsSection}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.todayCaptures}</div>
                <div className={styles.statLabel}>今日检测</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.textCount}</div>
                <div className={styles.statLabel}>文字提取</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.successRate}%</div>
                <div className={styles.statLabel}>成功率</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.averageTime}s</div>
                <div className={styles.statLabel}>平均时长</div>
              </div>
            </div>
          </div>

          {/* 权限警告 */}
          {!permissions.screenCapture && (
            <div className={styles.warningSection}>
              <div className={styles.warningIcon}>⚠️</div>
              <div className={styles.warningText}>
                <div className={styles.warningTitle}>需要屏幕录制权限</div>
                <div className={styles.warningDescription}>
                  请在系统设置中授权屏幕录制权限
                </div>
              </div>
            </div>
          )}

          {/* 操作区域 */}
          <div className={styles.actionsSection}>
            <Button
              variant={status.isActive ? 'danger' : 'primary'}
              size="md"
              fullWidth
              loading={loading}
              disabled={!permissions.screenCapture && !status.isActive}
              onClick={handleToggleCapture}
              icon={status.isActive ? '⏸️' : '▶️'}
            >
              {status.isActive ? '停止监听' : '开始监听'}
            </Button>
            
            <div className={styles.secondaryActions}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {/* 查看历史 */}}
                icon="📊"
              >
                历史记录
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowSettings}
                icon="⚙️"
              >
                设置
              </Button>
            </div>
          </div>
        </div>
        
        {/* 底部信息 */}
        <div className={styles.footer}>
          <div className={styles.versionInfo}>
            ScreenWatcher v{version}
          </div>
          <div className={styles.quickActions}>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              icon="❓"
              onClick={() => {/* 显示帮助 */}}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
};