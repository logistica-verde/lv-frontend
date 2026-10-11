import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import IntegrityBadge from '@/components/IntegrityBadge/IntegrityBadge'

describe('IntegrityBadge', () => {
  it.each([
    ['VALID', 'Íntegra'],
    ['TAMPERED', 'Alterada'],
    ['NOT_ANCHORED', 'Aguardando registro'],
  ] as const)('shows %s as "%s", in words and not only in color', (status, label) => {
    render(<IntegrityBadge status={status} />)

    expect(screen.getByText(label)).toBeVisible()
  })

  it('hides the decorative icon from assistive technology', () => {
    const { container } = render(<IntegrityBadge status="VALID" />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
