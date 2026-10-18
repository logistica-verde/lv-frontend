import { afterEach, describe, expect, it, vi } from 'vitest'
import { describeLocationFailure, getCurrentFix, LocationError } from '@/lib/geolocation'

type PositionHandler = (position: {
  coords: { latitude: number; longitude: number; accuracy: number }
}) => void
type FailureHandler = (failure: { code: number }) => void

function stubGeolocation(
  behaviour: (success: PositionHandler, failure: FailureHandler, options: PositionOptions) => void,
) {
  vi.stubGlobal('navigator', {
    geolocation: {
      getCurrentPosition: (
        success: PositionHandler,
        failure: FailureHandler,
        options: PositionOptions,
      ) => behaviour(success, failure, options),
    },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getCurrentFix', () => {
  it('resolves with the coordinates and the accuracy of the browser', async () => {
    stubGeolocation((success) =>
      success({ coords: { latitude: -23.5505, longitude: -46.6333, accuracy: 18 } }),
    )

    await expect(getCurrentFix()).resolves.toEqual({
      latitude: -23.5505,
      longitude: -46.6333,
      accuracyMeters: 18,
    })
  })

  it('asks for a precise and recent position without waiting forever', async () => {
    let seen: PositionOptions | undefined
    stubGeolocation((success, _failure, options) => {
      seen = options
      success({ coords: { latitude: 0, longitude: 0, accuracy: 1 } })
    })

    await getCurrentFix()

    expect(seen).toMatchObject({ enableHighAccuracy: true, timeout: 10_000 })
  })

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ])('maps the browser error code %i to "%s"', async (code, reason) => {
    stubGeolocation((_success, failure) => failure({ code }))

    await expect(getCurrentFix()).rejects.toMatchObject({ reason })
  })

  it('reports a browser without geolocation', async () => {
    vi.stubGlobal('navigator', {})

    const failure = await getCurrentFix().catch((error: Error) => error)

    expect(failure).toBeInstanceOf(LocationError)
    expect(failure).toMatchObject({ reason: 'unsupported' })
  })
})

describe('describeLocationFailure', () => {
  it('explains every failure in words', () => {
    expect(describeLocationFailure('denied')).toMatch(/permissão/)
    expect(describeLocationFailure('timeout')).toMatch(/Demorou/)
    expect(describeLocationFailure('unsupported')).toMatch(/navegador/)
    expect(describeLocationFailure('unavailable')).toMatch(/Não foi possível/)
  })
})
