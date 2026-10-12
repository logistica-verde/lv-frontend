import type { ComponentProps } from 'react'
import styles from '@/components/IconButton/IconButton.module.css'
import { classNames } from '@/lib/classNames'

type IconButtonProps = Omit<ComponentProps<'button'>, 'aria-label' | 'title'> & {
  label: string
}

export default function IconButton({
  label,
  type = 'button',
  className,
  children,
  ...buttonProps
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={classNames(styles.button, className)}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
