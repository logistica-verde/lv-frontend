import { describe, expect, it } from 'vitest'
import {
  AddressSearchUnavailableError,
  ApiError,
  describeError,
  failureMessage,
  NetworkError,
  ResponseFormatError,
} from '@/services/errors'

describe('describeError', () => {
  it('explains that the API is unreachable', () => {
    expect(describeError(new NetworkError())).toContain('conectar à API')
  })

  it('explains that the location is outside the area of the map', () => {
    const message = describeError(
      new ApiError(400, 'The origin is outside the area covered by the road map'),
    )

    expect(message).toContain('fora da área coberta pelo mapa')
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

describe('failureMessage', () => {
  it('describes an error with the default rules', () => {
    expect(failureMessage(new NetworkError())).toContain('conectar à API')
  })

  it('describes an error with the rules it is given', () => {
    expect(failureMessage(new ApiError(409, 'x'), () => 'Conflito')).toBe('Conflito')
  })

  it('has a generic message for anything that is not an error', () => {
    expect(failureMessage('boom')).toBe('Ocorreu um erro inesperado.')
    expect(failureMessage(undefined)).toBe('Ocorreu um erro inesperado.')
    expect(failureMessage({ code: 1 })).toBe('Ocorreu um erro inesperado.')
  })
})
