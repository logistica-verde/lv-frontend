import type { ZodType } from 'zod'
import { env } from '@/config/env'
import { ApiError, NetworkError, ResponseFormatError } from '@/services/errors'
import { problemDetailSchema } from '@/services/schemas/problemDetail'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT'
  body?: object
  signal?: AbortSignal
}

function buildUrl(path: string): string {
  return `${env.apiUrl.replace(/\/+$/, '')}${path}`
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null)
  const problem = problemDetailSchema.safeParse(body)
  const detail = problem.success ? problem.data.detail : undefined
  return new ApiError(response.status, detail ?? response.statusText)
}

export async function request<T>(
  path: string,
  schema: ZodType<T>,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: body
        ? { Accept: 'application/json', 'Content-Type': 'application/json' }
        : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (signal?.aborted) {
      throw error
    }
    throw new NetworkError()
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  const payload = await response.json().catch(() => null)
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    throw new ResponseFormatError(path)
  }
  return parsed.data
}
