import { createBrowserRouter } from 'react-router'
import type { RouteObject } from 'react-router'
import AppLayout from '@/components/AppLayout/AppLayout'
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'
import PlanningPage from '@/pages/PlanningPage/PlanningPage'
import RouteErrorPage from '@/pages/RouteErrorPage/RouteErrorPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <PlanningPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
