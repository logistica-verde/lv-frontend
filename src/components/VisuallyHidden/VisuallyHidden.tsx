import type { ReactNode } from 'react'
import styles from '@/components/VisuallyHidden/VisuallyHidden.module.css'

type VisuallyHiddenProps = {
  children: ReactNode
}

export default function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className={styles.hidden}>{children}</span>
}
