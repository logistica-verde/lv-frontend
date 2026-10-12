import type { ReactNode } from 'react'
import styles from '@/components/Card/Card.module.css'
import { classNames } from '@/lib/classNames'

type CardProps = {
  title?: string
  actions?: ReactNode
  fill?: boolean
  className?: string
  children: ReactNode
}

export default function Card({ title, actions, fill = false, className, children }: CardProps) {
  return (
    <section className={classNames(styles.card, fill && styles.fill, className)}>
      {(title || actions) && (
        <header className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
