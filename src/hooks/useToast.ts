import { useContext } from 'react'
import { ToastContext } from '@/components/Toast/ToastContext'
import type { ToastApi } from '@/components/Toast/ToastContext'

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) {
    throw new Error('useToast must be used inside a ToastProvider')
  }
  return api
}
