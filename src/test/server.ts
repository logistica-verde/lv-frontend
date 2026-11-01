import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const server = setupServer(
  http.get('*/api/executions', () => HttpResponse.json([])),
  http.get('*/api/bases', () => HttpResponse.json([])),
)
