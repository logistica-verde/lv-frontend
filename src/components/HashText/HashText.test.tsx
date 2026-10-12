import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import HashText from '@/components/HashText/HashText'

const hash = `0x3f9a${'0'.repeat(52)}b21c`

describe('HashText', () => {
  it('shows the hash truncated in the middle', () => {
    render(<HashText value={hash} label="transação" />)

    expect(screen.getByText('0x3f9a…b21c')).toBeInTheDocument()
  })

  it('keeps the full value available to screen readers and on hover', () => {
    render(<HashText value={hash} label="transação" />)

    expect(screen.getByText(hash)).toBeInTheDocument()
    expect(screen.getByText('0x3f9a…b21c')).toHaveAttribute('title', hash)
    expect(screen.getByText('0x3f9a…b21c')).toHaveAttribute('aria-hidden', 'true')
  })

  it('can show the whole value for side-by-side comparison', () => {
    render(<HashText full value={hash} label="transação" />)

    expect(screen.getByText(hash)).toBeVisible()
    expect(screen.queryByText('0x3f9a…b21c')).not.toBeInTheDocument()
  })

  it('has a copy button named after what it copies', () => {
    render(<HashText value={hash} label="transação" />)

    expect(screen.getByRole('button', { name: 'Copiar transação' })).toBeInTheDocument()
  })

  it('copies the full value, not the truncated one, and confirms it', async () => {
    const user = userEvent.setup()
    render(<HashText value={hash} label="transação" />)

    await user.click(screen.getByRole('button', { name: 'Copiar transação' }))

    expect(await navigator.clipboard.readText()).toBe(hash)
    expect(screen.getByRole('status')).toHaveTextContent('Copiado')
  })

  it('does not claim success when the clipboard is unavailable', async () => {
    const user = userEvent.setup()
    render(<HashText value={hash} label="transação" />)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
      configurable: true,
    })

    await user.click(screen.getByRole('button', { name: 'Copiar transação' }))

    expect(screen.getByRole('status')).toHaveTextContent('')
  })
})
