import { z } from 'zod'

export const verificationSchema = z.object({
  routeId: z
    .number('Informe o ID da operação')
    .int('O ID deve ser um número inteiro')
    .positive('O ID deve ser maior que zero'),
})

export type VerificationInput = z.infer<typeof verificationSchema>
