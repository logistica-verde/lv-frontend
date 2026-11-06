import { z } from 'zod'

export const calculationStageSchema = z.enum([
  'QUEUED',
  'PREPARING',
  'OPTIMIZING',
  'SAVING',
  'COMPLETED',
  'FAILED',
])

export const calculationProgressSchema = z.object({
  operationId: z.number().int().positive(),
  stage: calculationStageSchema,
  percent: z.number().min(0).max(100),
  done: z.number().int().min(0).nullable(),
  total: z.number().int().min(0).nullable(),
})

export type CalculationStage = z.infer<typeof calculationStageSchema>
export type CalculationProgress = z.infer<typeof calculationProgressSchema>
