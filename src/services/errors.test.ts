import { describe, expect, it } from 'vitest'
import {
  AddressSearchUnavailableError,
  ApiError,
  describeError,
  NetworkError,
  ResponseFormatError,
} from '@/services/errors'

describe('describeError', () => {
  it('explains that the API is unreachable', () => {
    expect(describeError(new NetworkError())).toContain('conectar à API')
  })

  it('explains a contract mismatch', () => {
    expect(describeError(new ResponseFormatError('/api/x'))).toContain('formato inesperado')
  })

  it('shows the API detail for client errors', () => {
    expect(describeError(new ApiError(400, 'Vehicle 1 is inactive'))).toBe('Vehicle 1 is inactive')
  })

  it('translates not found', () => {
    expect(describeError(new ApiError(404, 'Route operation 9 not found'))).toBe(
      'Recurso não encontrado.',
    )
  })

  it('explains that the blockchain service is unavailable', () => {
    expect(describeError(new ApiError(503, 'Besu is down'))).toContain('blockchain')
  })

  it('explains that the address search is unavailable', () => {
    expect(describeError(new AddressSearchUnavailableError())).toBe(
      'O serviço de busca de endereços está indisponível no momento.',
    )
  })

  it('does not leak details of server errors', () => {
    const message = describeError(new ApiError(500, 'NullPointerException at line 3'))

    expect(message).toContain('erro interno')
    expect(message).not.toContain('NullPointer')
  })

  it('has a generic message for anything else', () => {
    expect(describeError(new Error('x'))).toBe('Ocorreu um erro inesperado.')
  })
})
