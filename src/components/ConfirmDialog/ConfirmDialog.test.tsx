import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog'

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog
      open
      title="Desativar veículo"
      description="O veículo deixa de aparecer no planejamento."
      confirmLabel="Desativar veículo"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    renderDialog({ open: false })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('names the dialog and explains the consequence', () => {
    renderDialog()

    expect(screen.getByRole('dialog', { name: 'Desativar veículo' })).toHaveTextContent(
      'O veículo deixa de aparecer no planejamento.',
    )
  })

  it('puts the focus on the safe option', () => {
    renderDialog()

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  })

  it('confirms with the verb and object of the action', async () => {
    const { onConfirm, onCancel } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Desativar veículo' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('cancels with the button, with Escape and with the close icon', async () => {
    const { onCancel } = renderDialog()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onCancel).toHaveBeenCalledTimes(3)
  })

  it('shows the confirm button as busy and blocks cancelling while loading', () => {
    renderDialog({ loading: true })

    expect(screen.getByRole('button', { name: /Desativar veículo/ })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
