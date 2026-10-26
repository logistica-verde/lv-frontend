import { z } from 'zod'
import { optimizationCriterionSchema } from '@/services/schemas/route'

export const executionStatusSchema = z.enum(['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'])

export const executionSchema = z.object({
  id: z.number(),
  status: executionStatusSchema,
  scheduledAt: z.string().nullable(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  operationId: z.number(),
  criterion: optimizationCriterionSchema,
  vehicleId: z.number(),
  vehiclePlate: z.string(),
  pointCount: z.number(),
  totalEmissionKg: z.number().nullable(),
  totalDistanceMeters: z.number().nullable(),
  cargoKg: z.number().nullish(),
  cancellationReason: z.string().nullish(),
  cancelledBy: z.string().nullish(),
})

export const executionListSchema = z.array(executionSchema)

export type ExecutionStatus = z.infer<typeof executionStatusSchema>
export type Execution = z.infer<typeof executionSchema>
