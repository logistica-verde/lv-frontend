import { z } from 'zod'

export const VEHICLE_IMAGE_KEYS = ['van', 'pickup', 'vuc', 'truck', 'semi', 'motorcycle'] as const

export const VEHICLE_IMAGE_LABELS = {
  van: 'Van',
  pickup: 'Picape',
  vuc: 'Caminhão leve',
  truck: 'Caminhão',
  semi: 'Carreta',
  motorcycle: 'Moto',
} as const

export const DEFAULT_VEHICLE_IMAGE = 'truck'

export const vehicleImageSchema = z.enum(VEHICLE_IMAGE_KEYS)

export const vehicleSchema = z.object({
  id: z.number(),
  placa: z.string(),
  massaKg: z.number(),
  tipoCombustivel: z.string(),
  imagem: vehicleImageSchema.catch(DEFAULT_VEHICLE_IMAGE),
  ativo: z.boolean(),
})

export const vehicleListSchema = z.array(vehicleSchema)

export const vehicleInputSchema = z.object({
  placa: z.string().trim().min(1, 'Informe a placa').max(10, 'A placa deve ter até 10 caracteres'),
  massaKg: z.number('Informe a massa').positive('A massa deve ser maior que zero'),
  tipoCombustivel: z.string().trim().min(1, 'Informe o tipo de combustível'),
  imagem: vehicleImageSchema,
})

export type Vehicle = z.infer<typeof vehicleSchema>
export type VehicleImageKey = z.infer<typeof vehicleImageSchema>
export type VehicleInput = z.infer<typeof vehicleInputSchema>
