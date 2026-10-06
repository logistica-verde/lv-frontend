import { createMemoryRouter } from 'react-router'
import type { RouteObject } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { renderWithProviders } from '@/test/renderWithProviders'

export function renderRoutes(routes: RouteObject[], path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  renderWithProviders(<RouterProvider router={router} />)
  return router
}
