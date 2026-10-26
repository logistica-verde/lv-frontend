import { z } from 'zod'

export const baseSchema = z.object({
  id: z.number(),
  nome: z.string(),
  endereco: z.string().nullish(),
  latitude: z.number(),
  longitude: z.number(),
  ativo: z.boolean(),
})

export const baseListSchema = z.array(baseSchema)

export const baseInputSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome').max(120, 'O nome pode ter até 120 caracteres'),
  endereco: z
    .string()
    .trim()
    .max(255, 'O endereço pode ter até 255 caracteres')
    .optional(),
  latitude: z
    .number('Informe a latitude')
    .min(-90, 'A latitude vai de -90 a 90')
    .max(90, 'A latitude vai de -90 a 90'),
  longitude: z
    .number('Informe a longitude')
    .min(-180, 'A longitude vai de -180 a 180')
    .max(180, 'A longitude vai de -180 a 180'),
})

export type Base = z.infer<typeof baseSchema>
export type BaseInput = z.infer<typeof baseInputSchema>
