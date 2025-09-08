import React, { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Panel.module.scss';

export interface PanelProps {
  variant?: 'main' | 'secondary' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  titleIcon?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  error?: string;
  errorDetails?: string;
  empty?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  hoverable?: boolean;
  noPadding?: boolean;
  contentNoPadding?: boolean;
  centerContent?: boolean;
  className?: string;
  children?: ReactNode;
  onHeaderClick?: () => void;
}

// 窗口控制按钮组件
interface WindowControlsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  showMinimize?: boolean;
  showMaximize?: boolean;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  onClose,
  onMinimize,
  onMaximize,
  showMinimize = true,
  showMaximize = false,
}) => {
  return (
    <div className={styles.windowControls}>
      <button
        className={clsx(styles.controlButton, styles.close)}
        onClick={onClose}
        aria-label="关闭窗口"
      />
      {showMinimize && (
        <button
          className={clsx(styles.controlButton, styles.minimize)}
          onClick={onMinimize}
          aria-label="最小化窗口"
        />
      )}
      {showMaximize && (
        <button
          className={clsx(styles.controlButton, styles.maximize)}
          onClick={onMaximize}
          aria-label="最大化窗口"
        />
      )}
    </div>
  );
};

export const Panel: React.FC<PanelProps> = ({
  variant = 'main',
  size = 'md',
  title,
  titleIcon,
  actions,
  footer,
  loading = false,
  error,
  errorDetails,
  empty = false,
  emptyMessage = '暂无数据',
  emptyDescription,
  emptyIcon,
  hoverable = false,
  noPadding = false,
  contentNoPadding = false,
  centerContent = false,
  className,
  children,
  onHeaderClick,
}) => {
  // 渲染内容
  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>加载中...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorMessage}>{error}</div>
          {errorDetails && (
            <div className={styles.errorDetails}>{errorDetails}</div>
          )}
        </div>
      );
    }

    if (empty) {
      return (
        <div className={styles.empty}>
          {emptyIcon ? (
            <div className={styles.emptyIcon}>{emptyIcon}</div>
          ) : (
            <div className={styles.emptyIcon}>📭</div>
          )}
          <div className={styles.emptyMessage}>{emptyMessage}</div>
          {emptyDescription && (
            <div className={styles.emptyDescription}>{emptyDescription}</div>
          )}
        </div>
      );
    }

    return children;
  };

  return (
    <div
      className={clsx(
        styles.panel,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        {
          [styles.hoverable]: hoverable,
          [styles.noPadding]: noPadding,
        },
        className
      )}
    >
      {title && (
        <div className={styles.header} onClick={onHeaderClick}>
          <div className={styles.title}>
            {titleIcon && <span>{titleIcon}</span>}
            <span>{title}</span>
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}

      <div
        className={clsx(styles.content, {
          [styles.noPadding]: contentNoPadding,
          [styles.centerContent]: centerContent,
        })}
      >
        {renderContent()}
      </div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
};

// 默认导出
export default Panel;