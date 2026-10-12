import { ROLES } from '@/services/schemas/user'
import type { Role } from '@/services/schemas/user'

export const ACCESS = {
  planning: ['OPERATOR', 'ADMIN'],
  history: ROLES,
  experiments: ROLES,
  comparison: ROLES,
  verification: ['AUDITOR', 'ADMIN'],
  administration: ['ADMIN'],
} as const satisfies Record<string, readonly Role[]>

export function canAccess(perfil: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(perfil)
}

export function homeFor(perfil: Role): string {
  return canAccess(perfil, ACCESS.planning) ? '/' : '/historico'
}
