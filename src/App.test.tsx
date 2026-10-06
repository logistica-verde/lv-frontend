import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '@/App'

describe('App', () => {
  it('opens on the planning page inside the app layout', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Planejamento de rotas' })).toBeVisible()
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeVisible()
  })

  it('provides the notifications region to the whole app', () => {
    render(<App />)

    expect(screen.getByRole('region', { name: 'Notificações' })).toBeInTheDocument()
  })
})
