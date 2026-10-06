import type { ReactNode } from 'react'
import styles from '@/components/Card/Card.module.css'

type CardProps = {
  title?: string
  actions?: ReactNode
  children: ReactNode
}

export default function Card({ title, actions, children }: CardProps) {
  return (
    <section className={styles.card}>
      {(title || actions) && (
        <header className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
