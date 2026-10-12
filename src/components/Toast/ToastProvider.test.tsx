import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ToastProvider from '@/components/Toast/ToastProvider'
import { useToast } from '@/hooks/useToast'
import type { ToastTone } from '@/components/Toast/ToastContext'

type TriggerProps = {
  message: string
  tone?: ToastTone
}

function Trigger({ message, tone }: TriggerProps) {
  const { notify } = useToast()
  return (
    <button type="button" onClick={() => notify(message, tone)}>
      Notificar
    </button>
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ToastProvider', () => {
  it('shows a notification as a polite status', async () => {
    render(
      <ToastProvider>
        <Trigger message="Veículo cadastrado" tone="success" />
      </ToastProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Notificar' }))

    expect(screen.getByRole('status')).toHaveTextContent('Veículo cadastrado')
  })

  it('announces errors as an alert', async () => {
    render(
      <ToastProvider>
        <Trigger message="Falha ao salvar" tone="danger" />
      </ToastProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Notificar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao salvar')
  })

  it('stacks several notifications', async () => {
    render(
      <ToastProvider>
        <Trigger message="Mensagem" />
      </ToastProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Notificar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Notificar' }))

    expect(screen.getAllByRole('status')).toHaveLength(2)
  })

  it('lets the user dismiss a notification', async () => {
    render(
      <ToastProvider>
        <Trigger message="Mensagem" />
      </ToastProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Notificar' }))

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('dismisses a notification by itself after a few seconds', () => {
    vi.useFakeTimers()
    render(
      <ToastProvider>
        <Trigger message="Mensagem" />
      </ToastProvider>,
    )

    act(() => {
      screen.getByRole('button', { name: 'Notificar' }).click()
    })
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('exposes a labelled notifications region', () => {
    render(
      <ToastProvider>
        <p>conteúdo</p>
      </ToastProvider>,
    )

    expect(screen.getByRole('region', { name: 'Notificações' })).toBeInTheDocument()
  })
})

describe('useToast', () => {
  it('fails clearly when used outside the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => render(<Trigger message="x" />)).toThrow('useToast must be used inside')

    consoleError.mockRestore()
  })
})
