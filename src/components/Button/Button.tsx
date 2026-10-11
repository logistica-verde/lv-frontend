import type { ComponentProps } from 'react'
import styles from '@/components/Button/Button.module.css'
import Spinner from '@/components/Spinner/Spinner'
import { classNames } from '@/lib/classNames'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  type = 'button',
  disabled,
  className,
  children,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classNames(styles.button, styles[variant], size === 'sm' && styles.sm, className)}
      {...buttonProps}
    >
      {loading && <Spinner label="Aguarde" />}
      {children}
    </button>
  )
}
