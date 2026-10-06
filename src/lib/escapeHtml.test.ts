import { describe, expect, it } from 'vitest'
import { escapeHtml } from '@/lib/escapeHtml'

describe('escapeHtml', () => {
  it('leaves plain text untouched', () => {
    expect(escapeHtml('Praça da Sé 12')).toBe('Praça da Sé 12')
  })

  it('escapes characters that could inject markup', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">&\'')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;',
    )
  })
})
