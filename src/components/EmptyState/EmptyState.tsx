import type { ReactNode } from 'react'
import styles from '@/components/EmptyState/EmptyState.module.css'

type EmptyStateProps = {
  title: string
  icon?: ReactNode
  description?: string
  action?: ReactNode
}

export default function EmptyState({ title, icon, description, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  )
}
