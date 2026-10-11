import { z } from 'zod'

export const vehicleSchema = z.object({
  id: z.number(),
  placa: z.string(),
  massaKg: z.number(),
  tipoCombustivel: z.string(),
  ativo: z.boolean(),
})

export const vehicleListSchema = z.array(vehicleSchema)

export const vehicleInputSchema = z.object({
  placa: z.string().trim().min(1, 'Informe a placa').max(10, 'A placa deve ter até 10 caracteres'),
  massaKg: z.number('Informe a massa').positive('A massa deve ser maior que zero'),
  tipoCombustivel: z.string().trim().min(1, 'Informe o tipo de combustível'),
})

export type Vehicle = z.infer<typeof vehicleSchema>
export type VehicleInput = z.infer<typeof vehicleInputSchema>
