import { createBrowserRouter, Navigate } from 'react-router'
import type { RouteObject } from 'react-router'
import AppLayout from '@/components/AppLayout/AppLayout'
import { RequireAuth, RequireRole } from '@/components/RouteGuard/RouteGuard'
import { ACCESS } from '@/lib/permissions'
import ComparisonPage from '@/pages/ComparisonPage/ComparisonPage'
import ExecutionPage from '@/pages/ExecutionPage/ExecutionPage'
import HistoryPage from '@/pages/HistoryPage/HistoryPage'
import LoginPage from '@/pages/LoginPage/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'
import PlanningPage from '@/pages/PlanningPage/PlanningPage'
import RouteErrorPage from '@/pages/RouteErrorPage/RouteErrorPage'
import VerificationPage from '@/pages/VerificationPage/VerificationPage'

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/execucao/:id',
    element: (
      <RequireAuth>
        <RequireRole roles={ACCESS.planning} redirectToHome>
          <ExecutionPage />
        </RequireRole>
      </RequireAuth>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          {
            index: true,
            element: (
              <RequireRole roles={ACCESS.planning} redirectToHome>
                <PlanningPage />
              </RequireRole>
            ),
            handle: { fullBleed: true },
          },
          {
            path: 'historico',
            element: (
              <RequireRole roles={ACCESS.history}>
                <HistoryPage />
              </RequireRole>
            ),
          },
          {
            path: 'experimentos',
            lazy: async () => {
              const { default: ExperimentsPage } =
                await import('@/pages/ExperimentsPage/ExperimentsPage')
              return {
                element: (
                  <RequireRole roles={ACCESS.experiments}>
                    <ExperimentsPage />
                  </RequireRole>
                ),
              }
            },
          },
          {
            path: 'administracao',
            lazy: async () => {
              const { default: AdminPage } = await import('@/pages/AdminPage/AdminPage')
              return {
                element: (
                  <RequireRole roles={ACCESS.administration}>
                    <AdminPage />
                  </RequireRole>
                ),
              }
            },
          },
          { path: 'veiculos', element: <Navigate to="/administracao" replace /> },
          {
            path: 'rotas/:emissionId/:distanceId',
            element: (
              <RequireRole roles={ACCESS.comparison}>
                <ComparisonPage />
              </RequireRole>
            ),
          },
          {
            path: 'verificacao',
            element: (
              <RequireRole roles={ACCESS.verification}>
                <VerificationPage />
              </RequireRole>
            ),
          },
          {
            path: 'verificacao/:routeId',
            element: (
              <RequireRole roles={ACCESS.verification}>
                <VerificationPage />
              </RequireRole>
            ),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
