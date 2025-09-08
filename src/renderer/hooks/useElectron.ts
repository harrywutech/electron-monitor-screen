import { useEffect, useState, useCallback } from 'react';

// 获取 Electron API
export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!window.electronAPI);
  }, []);

  return {
    isElectron,
    electronAPI: isElectron ? window.electronAPI : null,
  };
};

// 应用版本 Hook
export const useAppVersion = () => {
  const [version, setVersion] = useState<string>('');
  const { electronAPI } = useElectron();

  useEffect(() => {
    if (electronAPI) {
      electronAPI.getVersion().then(setVersion);
    }
  }, [electronAPI]);

  return version;
};

// 窗口控制 Hook
export const useWindowControl = () => {
  const { electronAPI } = useElectron();

  const toggleWindow = useCallback(() => {
    electronAPI?.toggleWindow();
  }, [electronAPI]);

  const showWindow = useCallback(() => {
    electronAPI?.showWindow();
  }, [electronAPI]);

  const hideWindow = useCallback(() => {
    electronAPI?.hideWindow();
  }, [electronAPI]);

  const closeWindow = useCallback(() => {
    electronAPI?.closeWindow();
  }, [electronAPI]);

  const quitApp = useCallback(() => {
    electronAPI?.quitApp();
  }, [electronAPI]);

  const restartApp = useCallback(() => {
    electronAPI?.restartApp();
  }, [electronAPI]);

  return {
    toggleWindow,
    showWindow,
    hideWindow,
    closeWindow,
    quitApp,
    restartApp,
  };
};

// 权限管理 Hook
export const usePermissions = () => {
  const [permissions, setPermissions] = useState<{
    screenCapture: boolean;
    accessibility: boolean;
    notifications: boolean;
  }>({
    screenCapture: false,
    accessibility: false,
    notifications: false,
  });
  
  const [loading, setLoading] = useState(false);
  const { electronAPI } = useElectron();

  const checkPermissions = useCallback(async () => {
    if (!electronAPI) return;

    setLoading(true);
    try {
      const perms = await electronAPI.checkPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to check permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [electronAPI]);

  const requestPermission = useCallback(async (type: 'screen' | 'accessibility' | 'notification') => {
    if (!electronAPI) return false;

    try {
      const granted = await electronAPI.requestPermission(type);
      if (granted) {
        await checkPermissions();
      }
      return granted;
    } catch (error) {
      console.error(`Failed to request ${type} permission:`, error);
      return false;
    }
  }, [electronAPI, checkPermissions]);

  const openPermissionSettings = useCallback((type: 'screen-recording' | 'accessibility') => {
    electronAPI?.openPermissionSettings(type);
  }, [electronAPI]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  useEffect(() => {
    if (!electronAPI) return;

    const cleanup = () => {
      electronAPI.removeAllListeners('permission-changed');
    };

    electronAPI.onPermissionChange((newPermissions) => {
      setPermissions(newPermissions);
    });

    return cleanup;
  }, [electronAPI]);

  return {
    permissions,
    loading,
    checkPermissions,
    requestPermission,
    openPermissionSettings,
  };
};

// 屏幕捕获 Hook
export interface CaptureStatus {
  isActive: boolean;
  timestamp?: Date;
}

export const useScreenCapture = () => {
  const [status, setStatus] = useState<CaptureStatus>({ isActive: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { electronAPI } = useElectron();

  const startCapture = useCallback(async (options = {}) => {
    if (!electronAPI) return;

    setLoading(true);
    setError(null);

    try {
      const result = await electronAPI.startCapture(options);
      if (result.success) {
        setStatus({ isActive: true, timestamp: new Date() });
      } else {
        setError(result.error || 'Failed to start capture');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [electronAPI]);

  const stopCapture = useCallback(async () => {
    if (!electronAPI) return;

    setLoading(true);
    try {
      const result = await electronAPI.stopCapture();
      if (result.success) {
        setStatus({ isActive: false });
      } else {
        setError(result.error || 'Failed to stop capture');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [electronAPI]);

  const getCaptureStatus = useCallback(async () => {
    if (!electronAPI) return;

    try {
      const currentStatus = await electronAPI.getCaptureStatus();
      setStatus(currentStatus);
    } catch (err) {
      console.error('Failed to get capture status:', err);
    }
  }, [electronAPI]);

  const takeScreenshot = useCallback(async () => {
    if (!electronAPI) return null;

    try {
      const result = await electronAPI.takeScreenshot();
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Failed to take screenshot:', err);
      return null;
    }
  }, [electronAPI]);

  useEffect(() => {
    getCaptureStatus();
  }, [getCaptureStatus]);

  useEffect(() => {
    if (!electronAPI) return;

    const cleanup = () => {
      electronAPI.removeAllListeners('capture-result');
      electronAPI.removeAllListeners('monitoring-status-changed');
    };

    electronAPI.onCaptureResult((result) => {
      // 处理捕获结果
      console.log('Capture result:', result);
    });

    electronAPI.onMonitoringStatusChange((isActive) => {
      setStatus(prev => ({ ...prev, isActive }));
    });

    return cleanup;
  }, [electronAPI]);

  return {
    status,
    loading,
    error,
    startCapture,
    stopCapture,
    getCaptureStatus,
    takeScreenshot,
  };
};