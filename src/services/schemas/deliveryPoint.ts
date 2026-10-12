import { z } from 'zod'

export const deliveryPointSchema = z.object({
  id: z.number(),
  nome: z.string(),
  endereco: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  ativo: z.boolean(),
})

export const deliveryPointListSchema = z.array(deliveryPointSchema)

export const deliveryPointInputSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(120, 'O nome deve ter até 120 caracteres'),
  endereco: z.string().trim().max(255, 'O endereço deve ter até 255 caracteres').optional(),
  latitude: z
    .number('Informe a latitude')
    .min(-90, 'Latitude mínima: -90')
    .max(90, 'Latitude máxima: 90'),
  longitude: z
    .number('Informe a longitude')
    .min(-180, 'Longitude mínima: -180')
    .max(180, 'Longitude máxima: 180'),
})

export type DeliveryPoint = z.infer<typeof deliveryPointSchema>
export type DeliveryPointInput = z.infer<typeof deliveryPointInputSchema>
