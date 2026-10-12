import { z } from 'zod'
import { roleSchema } from '@/services/schemas/user'

export const loginInputSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
  senha: z.string().min(1, 'Informe a senha'),
})

export const sessionUserSchema = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
  perfil: roleSchema,
})

export const sessionSchema = z.object({
  token: z.string().min(1),
  usuario: sessionUserSchema,
})

export type LoginInput = z.infer<typeof loginInputSchema>
export type SessionUser = z.infer<typeof sessionUserSchema>
export type Session = z.infer<typeof sessionSchema>
