import React from 'react';
import clsx from 'clsx';
import styles from './StatusIndicator.module.scss';

export type StatusType = 'active' | 'inactive' | 'error' | 'warning' | 'loading';
export type StatusSize = 'sm' | 'md' | 'lg';

export interface StatusIndicatorProps {
  status: StatusType;
  size?: StatusSize;
  text?: string;
  minimal?: boolean;
  className?: string;
}

export interface DetailedStatusIndicatorProps {
  items: Array<{
    label: string;
    value: string | number;
    status?: StatusType;
  }>;
  className?: string;
}

export interface FloatingStatusIndicatorProps {
  status: StatusType;
  text: string;
  stats?: string;
  expanded?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface StatisticsStatusIndicatorProps {
  status: StatusType;
  text: string;
  stats: string;
  size?: StatusSize;
  className?: string;
}

// 基础状态指示器
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  text,
  minimal = false,
  className,
}) => {
  return (
    <div
      className={clsx(
        styles.indicator,
        styles[`status_${status}`],
        styles[`size_${size}`],
        {
          [styles.minimal]: minimal,
        },
        className
      )}
    >
      <div className={styles.dot} />
      {!minimal && text && <span className={styles.text}>{text}</span>}
    </div>
  );
};

// 详细状态指示器
export const DetailedStatusIndicator: React.FC<DetailedStatusIndicatorProps> = ({
  items,
  className,
}) => {
  return (
    <div className={clsx(styles.detailedIndicator, className)}>
      {items.map((item, index) => (
        <div key={index} className={styles.statusRow}>
          <div className={styles.label}>
            {item.status && (
              <StatusIndicator status={item.status} size="sm" minimal />
            )}
            <span>{item.label}</span>
          </div>
          <div className={styles.value}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};

// 悬浮状态指示器
export const FloatingStatusIndicator: React.FC<FloatingStatusIndicatorProps> = ({
  status,
  text,
  stats,
  expanded = false,
  onClick,
  className,
}) => {
  return (
    <div
      className={clsx(
        styles.floatingIndicator,
        {
          [styles.expanded]: expanded,
        },
        className
      )}
      onClick={onClick}
    >
      <StatusIndicator status={status} text={text} size="sm" />
      {expanded && stats && (
        <div style={{ marginTop: 4, fontSize: 10, opacity: 0.7 }}>
          {stats}
        </div>
      )}
    </div>
  );
};

// 带统计信息的状态指示器
export const StatisticsStatusIndicator: React.FC<StatisticsStatusIndicatorProps> = ({
  status,
  text,
  stats,
  size = 'md',
  className,
}) => {
  return (
    <div className={clsx(styles.statisticsIndicator, className)}>
      <div className={styles.mainStatus}>
        <div className={styles.dot + ' ' + styles[`status_${status}`]} />
        <span className={styles.statusText}>{text}</span>
      </div>
      <div className={styles.stats}>{stats}</div>
    </div>
  );
};

// 状态文本映射
export const getStatusText = (status: StatusType): string => {
  const statusTexts: Record<StatusType, string> = {
    active: '活跃中',
    inactive: '已停止',
    error: '错误',
    warning: '警告',
    loading: '加载中',
  };
  return statusTexts[status];
};

// 状态颜色映射（用于其他组件）
export const getStatusColor = (status: StatusType): string => {
  const statusColors: Record<StatusType, string> = {
    active: 'var(--success)',
    inactive: 'var(--text-tertiary)',
    error: 'var(--error)',
    warning: 'var(--warning)',
    loading: 'var(--info)',
  };
  return statusColors[status];
};