const STORAGE_KEY = 'lastro.base'

export function readStoredBase(): number | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const id = stored === null ? NaN : Number(stored)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export function storeBase(id: number | null): void {
  try {
    if (id === null) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, String(id))
    }
  } catch {
    return
  }
}
