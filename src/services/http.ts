import type { ZodType } from 'zod'
import { env } from '@/config/env'
import { clearSession, getSession } from '@/lib/session'
import { ApiError, NetworkError, ResponseFormatError } from '@/services/errors'
import { problemDetailSchema } from '@/services/schemas/problemDetail'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT'
  body?: object
  signal?: AbortSignal
  authenticated?: boolean
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
  { method = 'GET', body, signal, authenticated = true }: RequestOptions = {},
): Promise<T> {
  const token = authenticated ? getSession()?.token : undefined
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
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
    if (response.status === 401 && token) {
      clearSession()
    }
    throw await toApiError(response)
  }

  const payload = await response.json().catch(() => null)
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    throw new ResponseFormatError(path)
  }
  return parsed.data
}
