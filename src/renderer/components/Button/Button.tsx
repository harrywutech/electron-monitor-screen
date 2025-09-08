import React, { forwardRef, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Button.module.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      iconOnly = false,
      icon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={clsx(
          styles.button,
          styles[`variant_${variant}`],
          styles[`size_${size}`],
          {
            [styles.loading]: loading,
            [styles.fullWidth]: fullWidth,
            [styles.iconOnly]: iconOnly,
          },
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && <div className={styles.spinner} />}
        
        <div className={styles.content}>
          {icon && <span className={styles.icon}>{icon}</span>}
          {!iconOnly && children && <span>{children}</span>}
        </div>
      </button>
    );
  }
);

Button.displayName = 'Button';