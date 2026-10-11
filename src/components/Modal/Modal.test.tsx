import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Modal from '@/components/Modal/Modal'

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <Modal
        open={open}
        title="Adicionar ponto"
        onClose={() => {
          onClose()
          setOpen(false)
        }}
      >
        <label>
          Nome
          <input />
        </label>
        <button type="button">Salvar</button>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(
      <Modal open={false} title="Adicionar ponto" onClose={vi.fn()}>
        conteúdo
      </Modal>,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is a modal dialog named by its title', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    const dialog = screen.getByRole('dialog', { name: 'Adicionar ponto' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'Adicionar ponto' })).toBeVisible()
  })

  it('moves the focus to the first field instead of the close button', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    expect(screen.getByLabelText('Nome')).toHaveFocus()
  })

  it('closes with Escape and gives the focus back to what opened it', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const opener = screen.getByRole('button', { name: 'Abrir' })
    await userEvent.click(opener)

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('closes with the close button', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes when the user presses on the backdrop but not inside the dialog', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    await userEvent.click(screen.getByRole('dialog'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the focus inside while tabbing forward and backward', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    const field = screen.getByLabelText('Nome')
    const save = screen.getByRole('button', { name: 'Salvar' })
    const close = screen.getByRole('button', { name: 'Fechar' })

    expect(field).toHaveFocus()
    await user.tab()
    expect(save).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab()
    expect(field).toHaveFocus()
    await user.tab({ shift: true })
    expect(close).toHaveFocus()
  })

  it('hides the rest of the page from assistive technology while open and restores it afterwards', async () => {
    const { container } = render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Abrir' })

    await userEvent.click(opener)

    expect(container).toHaveAttribute('aria-hidden', 'true')
    expect(container).toHaveAttribute('inert')
    expect(screen.queryByRole('button', { name: 'Abrir' })).not.toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(container).not.toHaveAttribute('aria-hidden')
    expect(container).not.toHaveAttribute('inert')
    expect(screen.getByRole('button', { name: 'Abrir' })).toBeInTheDocument()
  })

  it('leaves exempt regions, such as notifications, available', async () => {
    const live = document.createElement('div')
    live.setAttribute('data-modal-exempt', '')
    document.body.appendChild(live)
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    expect(live).not.toHaveAttribute('aria-hidden')
    expect(live).not.toHaveAttribute('inert')
    live.remove()
  })
})
