import type { ReactNode } from 'react'
import styles from '@/components/StatusBadge/StatusBadge.module.css'
import { classNames } from '@/lib/classNames'

type StatusBadgeProps = {
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  children: ReactNode
}

export default function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <span className={classNames(styles.badge, styles[tone])}>{children}</span>
}
