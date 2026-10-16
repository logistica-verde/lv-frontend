import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle'
import { setTheme } from '@/lib/theme'

afterEach(() => {
  setTheme('light')
  window.localStorage.clear()
})

describe('ThemeToggle', () => {
  it('offers the dark theme first and switches back and forth', async () => {
    render(<ThemeToggle />)

    await userEvent.click(screen.getByRole('button', { name: 'Usar tema escuro' }))

    expect(document.documentElement.dataset.theme).toBe('dark')

    await userEvent.click(screen.getByRole('button', { name: 'Usar tema claro' }))

    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
