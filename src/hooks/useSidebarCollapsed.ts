import { useCallback, useState } from 'react'

const STORAGE_KEY = 'lastro.sidebar-collapsed'

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function store(collapsed: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed))
  } catch {
    return
  }
}

export function useSidebarCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(readStored)

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      store(!current)
      return !current
    })
  }, [])

  return [collapsed, toggle]
}
