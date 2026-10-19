import { z } from 'zod'

export const optimizationCriterionSchema = z.enum(['EMISSION', 'DISTANCE'])

export const operationStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED'])

export const routeOriginSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export const routeInputSchema = z
  .object({
    vehicleId: z.number().int().positive(),
    deliveryPointIds: z.array(z.number().int().positive()).min(1).max(30),
    criterion: optimizationCriterionSchema,
    origin: routeOriginSchema.optional(),
    cargoKg: z.number().min(0).max(100000).optional(),
  })
  .refine((input) => input.origin !== undefined || input.deliveryPointIds.length >= 2, {
    message: 'Informe ao menos 2 pontos ou a saída',
    path: ['deliveryPointIds'],
  })

export const routeAcceptedSchema = z.object({
  id: z.number(),
  status: operationStatusSchema,
})

export const routePointSchema = z.object({
  pointId: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  visitOrder: z.number(),
})

export const routeSegmentSchema = z.object({
  fromPointId: z.number(),
  toPointId: z.number(),
  distanceMeters: z.number(),
  averageSpeedKmh: z.number(),
  slopePercent: z.number(),
  emissionKg: z.number(),
  geometry: z.array(z.tuple([z.number(), z.number()])).optional(),
})

export const routeSchema = z.object({
  id: z.number(),
  vehicleId: z.number(),
  criterion: optimizationCriterionSchema,
  status: operationStatusSchema,
  createdAt: z.string(),
  totalEmissionKg: z.number().nullable(),
  totalDistanceMeters: z.number().nullable(),
  cargoKg: z.number().nullish(),
  errorMessage: z.string().nullable(),
  points: z.array(routePointSchema),
  segments: z.array(routeSegmentSchema),
})

export type OptimizationCriterion = z.infer<typeof optimizationCriterionSchema>
export type OperationStatus = z.infer<typeof operationStatusSchema>
export type RouteOrigin = z.infer<typeof routeOriginSchema>
export type RouteInput = z.infer<typeof routeInputSchema>
export type RouteAccepted = z.infer<typeof routeAcceptedSchema>
export type RoutePoint = z.infer<typeof routePointSchema>
export type RouteSegment = z.infer<typeof routeSegmentSchema>
export type Route = z.infer<typeof routeSchema>
