const STORAGE_KEY = 'lv.theme'

export type Theme = 'light' | 'dark'

const listeners = new Set<() => void>()

function readStored(): Theme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

let current: Theme = readStored()

export function getTheme(): Theme {
  return current
}

export function applyTheme(theme: Theme = current) {
  document.documentElement.dataset.theme = theme
}

export function setTheme(theme: Theme) {
  current = theme
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    current = theme
  }
  applyTheme(theme)
  listeners.forEach((listener) => listener())
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
