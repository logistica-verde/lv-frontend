import { describe, expect, it } from 'vitest'
import { ACCESS, canAccess, homeFor } from '@/lib/permissions'

describe('permissions', () => {
  it('lets only operators and administrators plan routes', () => {
    expect(canAccess('OPERATOR', ACCESS.planning)).toBe(true)
    expect(canAccess('ADMIN', ACCESS.planning)).toBe(true)
    expect(canAccess('AUDITOR', ACCESS.planning)).toBe(false)
  })

  it('lets only auditors and administrators verify integrity', () => {
    expect(canAccess('AUDITOR', ACCESS.verification)).toBe(true)
    expect(canAccess('ADMIN', ACCESS.verification)).toBe(true)
    expect(canAccess('OPERATOR', ACCESS.verification)).toBe(false)
  })

  it('keeps the administration to administrators', () => {
    expect(canAccess('ADMIN', ACCESS.administration)).toBe(true)
    expect(canAccess('OPERATOR', ACCESS.administration)).toBe(false)
    expect(canAccess('AUDITOR', ACCESS.administration)).toBe(false)
  })

  it('lets every profile read the history, experiments and comparison', () => {
    for (const perfil of ['OPERATOR', 'AUDITOR', 'ADMIN'] as const) {
      expect(canAccess(perfil, ACCESS.history)).toBe(true)
      expect(canAccess(perfil, ACCESS.experiments)).toBe(true)
      expect(canAccess(perfil, ACCESS.comparison)).toBe(true)
    }
  })

  it('opens the planning screen for those who can plan and the history for the others', () => {
    expect(homeFor('OPERATOR')).toBe('/')
    expect(homeFor('ADMIN')).toBe('/')
    expect(homeFor('AUDITOR')).toBe('/historico')
  })
})
