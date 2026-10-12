import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearSession, getSession, setSession, subscribeSession } from '@/lib/session'
import { sessionFor } from '@/test/session'

afterEach(() => {
  window.sessionStorage.clear()
})

describe('session store', () => {
  it('starts empty, keeps what is set and forgets it on clear', () => {
    expect(getSession()).toBeNull()

    setSession(sessionFor('ADMIN'))
    expect(getSession()?.usuario.nome).toBe('Marina Duarte')

    clearSession()
    expect(getSession()).toBeNull()
  })

  it('notifies subscribers on every change until they unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSession(listener)

    setSession(sessionFor('OPERATOR'))
    clearSession()
    unsubscribe()
    setSession(sessionFor('AUDITOR'))

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('survives a reload of the page but not a closed tab', async () => {
    setSession(sessionFor('AUDITOR'))
    vi.resetModules()

    const reloaded = await import('@/lib/session')

    expect(reloaded.getSession()?.usuario.perfil).toBe('AUDITOR')
    expect(window.sessionStorage.getItem('lv.session')).toContain('test-token-AUDITOR')
    expect(window.localStorage.getItem('lv.session')).toBeNull()
  })

  it('removes the stored copy on clear', () => {
    setSession(sessionFor('ADMIN'))

    clearSession()

    expect(window.sessionStorage.getItem('lv.session')).toBeNull()
  })

  it('ignores stored data that is not a valid session', async () => {
    window.sessionStorage.setItem('lv.session', '{"token":"x","usuario":{"perfil":"ROOT"}}')
    vi.resetModules()

    const reloaded = await import('@/lib/session')

    expect(reloaded.getSession()).toBeNull()
  })

  it('ignores stored data that is not JSON', async () => {
    window.sessionStorage.setItem('lv.session', 'not json')
    vi.resetModules()

    const reloaded = await import('@/lib/session')

    expect(reloaded.getSession()).toBeNull()
  })
})
