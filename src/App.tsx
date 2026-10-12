import { RouterProvider } from 'react-router/dom'
import ToastProvider from '@/components/Toast/ToastProvider'
import { createAppRouter } from '@/router'

const router = createAppRouter()

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}
