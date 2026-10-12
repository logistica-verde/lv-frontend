import { z } from 'zod'

export const roleSchema = z.enum(['OPERATOR', 'AUDITOR', 'ADMIN'])

export const userSchema = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
  perfil: roleSchema,
  ativo: z.boolean(),
})

export const userListSchema = z.array(userSchema)

export const userUpdateSchema = z
  .object({
    perfil: roleSchema.optional(),
    ativo: z.boolean().optional(),
  })
  .refine((update) => update.perfil !== undefined || update.ativo !== undefined)

export type Role = z.infer<typeof roleSchema>
export type User = z.infer<typeof userSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>

export const ROLE_LABELS: Record<Role, string> = {
  OPERATOR: 'Operador',
  AUDITOR: 'Auditor',
  ADMIN: 'Administrador',
}

export const ROLES = roleSchema.options
