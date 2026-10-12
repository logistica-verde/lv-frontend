import { z } from 'zod'
import { operationStatusSchema } from '@/services/schemas/route'

export const criterionResultSchema = z.object({
  emissionKg: z.number(),
  distanceMeters: z.number(),
  executionMs: z.number(),
  convergence: z.array(z.number()),
})

export const experimentRunSchema = z.object({
  instanceSize: z.number().int(),
  seed: z.number().int(),
  emission: criterionResultSchema,
  distance: criterionResultSchema,
})

export const experimentSchema = z.object({
  id: z.number(),
  status: operationStatusSchema,
  createdAt: z.string(),
  instances: z.array(z.number().int()),
  seeds: z.array(z.number().int()),
  progress: z.object({ completed: z.number(), total: z.number() }),
  runs: z.array(experimentRunSchema),
  errorMessage: z.string().nullable(),
})

export const experimentAcceptedSchema = z.object({
  id: z.number(),
  status: operationStatusSchema,
})

export const experimentInputSchema = z.object({
  instances: z.array(z.number().int().positive()).min(1),
  seeds: z.array(z.number().int().positive()).min(1),
})

export type CriterionResult = z.infer<typeof criterionResultSchema>
export type ExperimentRun = z.infer<typeof experimentRunSchema>
export type Experiment = z.infer<typeof experimentSchema>
export type ExperimentAccepted = z.infer<typeof experimentAcceptedSchema>
export type ExperimentInput = z.infer<typeof experimentInputSchema>

export const DEFAULT_EXPERIMENT_INPUT: ExperimentInput = {
  instances: [10, 15, 20, 25, 30],
  seeds: [1, 2, 3],
}
