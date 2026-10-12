import { z } from 'zod'
import { integrityStatusSchema } from '@/services/schemas/integrity'
import { operationStatusSchema, optimizationCriterionSchema } from '@/services/schemas/route'

export const operationSortFieldSchema = z.enum([
  'createdAt',
  'totalEmissionKg',
  'totalDistanceMeters',
])

export const sortDirectionSchema = z.enum(['asc', 'desc'])

export const operationSummarySchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  vehicleId: z.number(),
  vehiclePlate: z.string(),
  criterion: optimizationCriterionSchema,
  status: operationStatusSchema,
  totalEmissionKg: z.number().nullable(),
  totalDistanceMeters: z.number().nullable(),
  integrityStatus: integrityStatusSchema,
})

export const operationPageSchema = z.object({
  items: z.array(operationSummarySchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
})

export type OperationSortField = z.infer<typeof operationSortFieldSchema>
export type SortDirection = z.infer<typeof sortDirectionSchema>
export type OperationSummary = z.infer<typeof operationSummarySchema>
export type OperationPage = z.infer<typeof operationPageSchema>
