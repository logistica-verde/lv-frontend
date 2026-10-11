import { createContext } from 'react'

export type ToastTone = 'success' | 'danger' | 'info'

export type ToastApi = {
  notify: (message: string, tone?: ToastTone) => void
}

export const ToastContext = createContext<ToastApi | null>(null)
