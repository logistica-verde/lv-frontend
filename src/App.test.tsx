import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { apiUrl } from '@/test/api'
import { signInAs } from '@/test/session'
import { server } from '@/test/server'

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )
}

describe('App', () => {
  beforeEach(() => {
    signInAs('ADMIN')
    server.use(
      http.get(apiUrl('/api/delivery-points'), () => HttpResponse.json([])),
      http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([])),
    )
  })

  it('opens on the planning page inside the app layout', () => {
    renderApp()

    expect(screen.getByRole('heading', { level: 1, name: 'Nova rota' })).toBeVisible()
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeVisible()
  })

  it('provides the notifications region to the whole app', () => {
    renderApp()

    expect(screen.getByRole('region', { name: 'Notificações' })).toBeInTheDocument()
  })
})
