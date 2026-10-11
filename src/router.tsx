import { createBrowserRouter } from 'react-router'
import type { RouteObject } from 'react-router'
import AppLayout from '@/components/AppLayout/AppLayout'
import ComparisonPage from '@/pages/ComparisonPage/ComparisonPage'
import HistoryPage from '@/pages/HistoryPage/HistoryPage'
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'
import PlanningPage from '@/pages/PlanningPage/PlanningPage'
import RouteErrorPage from '@/pages/RouteErrorPage/RouteErrorPage'
import VehiclesPage from '@/pages/VehiclesPage/VehiclesPage'
import VerificationPage from '@/pages/VerificationPage/VerificationPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <PlanningPage /> },
          { path: 'historico', element: <HistoryPage /> },
          { path: 'veiculos', element: <VehiclesPage /> },
          { path: 'rotas/:emissionId/:distanceId', element: <ComparisonPage /> },
          { path: 'verificacao', element: <VerificationPage /> },
          { path: 'verificacao/:routeId', element: <VerificationPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
