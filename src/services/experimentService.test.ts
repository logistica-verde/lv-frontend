import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ApiError } from '@/services/errors'
import { getLatestExperiment, startExperiment } from '@/services/experimentService'
import { DEFAULT_EXPERIMENT_INPUT, experimentInputSchema } from '@/services/schemas/experiment'
import type { ExperimentInput } from '@/services/schemas/experiment'
import { apiUrl } from '@/test/api'
import { experimentFixture } from '@/test/fakeApi'
import { server } from '@/test/server'

describe('startExperiment', () => {
  it('posts the instances and seeds and returns the accepted id', async () => {
    let body: ExperimentInput | null = null
    server.use(
      http.post(apiUrl('/api/experiments'), async ({ request }) => {
        body = experimentInputSchema.parse(await request.json())
        return HttpResponse.json({ id: 4, status: 'PENDING' }, { status: 202 })
      }),
    )

    expect(await startExperiment(DEFAULT_EXPERIMENT_INPUT)).toEqual({ id: 4, status: 'PENDING' })
    expect(body).toEqual({ instances: [10, 15, 20, 25, 30], seeds: [1, 2, 3] })
  })

  it('reports a refusal with the API message', async () => {
    server.use(
      http.post(apiUrl('/api/experiments'), () =>
        HttpResponse.json({ status: 400, detail: 'Invalid request content.' }, { status: 400 }),
      ),
    )

    await expect(startExperiment(DEFAULT_EXPERIMENT_INPUT)).rejects.toMatchObject({
      status: 400,
      message: 'Invalid request content.',
    })
  })
})

describe('getLatestExperiment', () => {
  it('returns the latest experiment', async () => {
    server.use(
      http.get(apiUrl('/api/experiments/latest'), () => HttpResponse.json(experimentFixture)),
    )

    expect(await getLatestExperiment()).toEqual(experimentFixture)
  })

  it('returns null when none was run yet instead of failing', async () => {
    server.use(
      http.get(apiUrl('/api/experiments/latest'), () =>
        HttpResponse.json({ status: 404, detail: 'none' }, { status: 404 }),
      ),
    )

    expect(await getLatestExperiment()).toBeNull()
  })

  it('still fails on other errors', async () => {
    server.use(
      http.get(apiUrl('/api/experiments/latest'), () =>
        HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 }),
      ),
    )

    await expect(getLatestExperiment()).rejects.toBeInstanceOf(ApiError)
  })
})
