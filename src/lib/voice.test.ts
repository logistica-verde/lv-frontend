import { describe, expect, it } from 'vitest'
import { crossedSpokenThreshold, phraseFor } from '@/lib/voice'

describe('voice guidance', () => {
  it('speaks at the closest threshold that was crossed and not yet spoken', () => {
    expect(crossedSpokenThreshold(900, new Set())).toBeNull()
    expect(crossedSpokenThreshold(480, new Set())).toBe(500)
    expect(crossedSpokenThreshold(150, new Set([500]))).toBe(200)
    expect(crossedSpokenThreshold(150, new Set([500, 200]))).toBeNull()
    expect(crossedSpokenThreshold(10, new Set([500, 200]))).toBe(50)
  })

  it('words the announcement by distance', () => {
    expect(phraseFor(200, 'MASP')).toBe('Em 200 metros, chegada em MASP.')
    expect(phraseFor(50, 'MASP')).toBe('Você chegou em MASP.')
  })
})
