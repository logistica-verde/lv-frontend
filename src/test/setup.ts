import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { clearSession } from '@/lib/session'
import { server } from '@/test/server'

configure({ asyncUtilTimeout: 4000 })

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  clearSession()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
