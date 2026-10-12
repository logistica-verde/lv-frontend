import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import styles from '@/components/HashText/HashText.module.css'
import { truncateMiddle } from '@/lib/hash'

const CONFIRMATION_MS = 2000

type HashTextProps = {
  value: string
  label: string
  full?: boolean
}

export default function HashText({ value, label, full = false }: HashTextProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    },
    [],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      return
    }
    setCopied(true)
    if (timer.current) {
      clearTimeout(timer.current)
    }
    timer.current = setTimeout(() => setCopied(false), CONFIRMATION_MS)
  }

  return (
    <span className={styles.hash}>
      {full ? (
        <code className={styles.full}>{value}</code>
      ) : (
        <>
          <code className={styles.short} aria-hidden="true" title={value}>
            {truncateMiddle(value)}
          </code>
          <VisuallyHidden>{value}</VisuallyHidden>
        </>
      )}
      <button type="button" className={styles.copy} onClick={copy} aria-label={`Copiar ${label}`}>
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      </button>
      <span role="status" className={styles.status}>
        {copied ? 'Copiado' : ''}
      </span>
    </span>
  )
}
