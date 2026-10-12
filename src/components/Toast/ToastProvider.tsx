import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Button from '@/components/Button/Button'
import { ToastContext } from '@/components/Toast/ToastContext'
import type { ToastApi, ToastTone } from '@/components/Toast/ToastContext'
import styles from '@/components/Toast/ToastProvider.module.css'
import { classNames } from '@/lib/classNames'

type ToastItem = {
  id: number
  message: string
  tone: ToastTone
}

type ToastProviderProps = {
  children: ReactNode
}

const DISMISS_AFTER_MS = 5000

export default function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, tone }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DISMISS_AFTER_MS),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const api = useMemo<ToastApi>(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div role="region" aria-label="Notificações" className={styles.region} data-modal-exempt="">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role={toast.tone === 'danger' ? 'alert' : 'status'}
              className={classNames(styles.toast, styles[toast.tone])}
            >
              <span className={styles.message}>{toast.message}</span>
              <Button variant="ghost" size="sm" onClick={() => dismiss(toast.id)}>
                Fechar
              </Button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
