import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'

describe('ErrorMessage', () => {
  it('announces the message as an alert', () => {
    render(<ErrorMessage message="Não foi possível carregar os veículos." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os veículos.')
  })

  it('does not offer a retry without a handler', () => {
    render(<ErrorMessage message="Falha" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls the retry handler', async () => {
    const onRetry = vi.fn()
    render(<ErrorMessage message="Falha" onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
