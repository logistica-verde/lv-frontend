import { ApiError } from '@/services/errors'
import { request } from '@/services/http'
import { experimentAcceptedSchema, experimentSchema } from '@/services/schemas/experiment'
import type { Experiment, ExperimentAccepted, ExperimentInput } from '@/services/schemas/experiment'

export function startExperiment(input: ExperimentInput): Promise<ExperimentAccepted> {
  return request('/api/experiments', experimentAcceptedSchema, { method: 'POST', body: input })
}

export async function getLatestExperiment(signal?: AbortSignal): Promise<Experiment | null> {
  try {
    return await request('/api/experiments/latest', experimentSchema, { signal })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}
