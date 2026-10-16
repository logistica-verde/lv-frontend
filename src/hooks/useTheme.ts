import { useSyncExternalStore } from 'react'
import { getTheme, subscribeTheme } from '@/lib/theme'
import type { Theme } from '@/lib/theme'

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'light')
}
