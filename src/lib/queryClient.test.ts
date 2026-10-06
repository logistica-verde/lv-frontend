import { describe, expect, it } from 'vitest'
import { createQueryClient, shouldRetry } from '@/lib/queryClient'
import { ApiError, NetworkError } from '@/services/errors'

describe('shouldRetry', () => {
  it('does not retry client errors', () => {
    expect(shouldRetry(0, new ApiError(404, 'not found'))).toBe(false)
    expect(shouldRetry(0, new ApiError(400, 'bad request'))).toBe(false)
  })

  it('retries server errors up to the limit', () => {
    expect(shouldRetry(0, new ApiError(503, 'down'))).toBe(true)
    expect(shouldRetry(1, new ApiError(503, 'down'))).toBe(true)
    expect(shouldRetry(2, new ApiError(503, 'down'))).toBe(false)
  })

  it('retries network failures up to the limit', () => {
    expect(shouldRetry(0, new NetworkError())).toBe(true)
    expect(shouldRetry(2, new NetworkError())).toBe(false)
  })
})

describe('createQueryClient', () => {
  it('never retries mutations', () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false)
  })
})
