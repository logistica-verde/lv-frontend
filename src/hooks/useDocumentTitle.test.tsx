import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

describe('useDocumentTitle', () => {
  it('prefixes the page title to the app name', () => {
    renderHook(() => useDocumentTitle('Veículos'))

    expect(document.title).toBe('Veículos · Lastro')
  })

  it('follows title changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'Veículos' },
    })

    rerender({ title: 'Integridade' })

    expect(document.title).toBe('Integridade · Lastro')
  })

  it('goes back to the app name when the page unmounts', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Veículos'))

    unmount()

    expect(document.title).toBe('Lastro')
  })
})
