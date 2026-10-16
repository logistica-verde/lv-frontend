import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, getTheme, setTheme } from '@/lib/theme'

afterEach(() => {
  setTheme('light')
  window.localStorage.clear()
})

describe('theme', () => {
  it('is light until the user chooses otherwise', () => {
    expect(getTheme()).toBe('light')
  })

  it('marks the document and remembers the choice', () => {
    setTheme('dark')

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem('lv.theme')).toBe('dark')
  })

  it('notifies subscribers when the theme changes', async () => {
    const { subscribeTheme } = await import('@/lib/theme')
    const listener = vi.fn()
    const unsubscribe = subscribeTheme(listener)

    setTheme('dark')
    unsubscribe()
    setTheme('light')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('applies the current theme to the document', () => {
    setTheme('dark')
    document.documentElement.dataset.theme = ''

    applyTheme()

    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
