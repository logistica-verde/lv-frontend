import { setSession } from '@/lib/session'
import type { Session } from '@/services/schemas/auth'
import type { Role } from '@/services/schemas/user'

const NAMES: Record<Role, string> = {
  ADMIN: 'Marina Duarte',
  OPERATOR: 'Carlos Menezes',
  AUDITOR: 'Rafael Tonelli',
}

export function sessionFor(perfil: Role): Session {
  return {
    token: `test-token-${perfil}`,
    usuario: {
      id: 1,
      nome: NAMES[perfil],
      email: `${perfil.toLowerCase()}@example.test`,
      perfil,
    },
  }
}

export function signInAs(perfil: Role = 'ADMIN') {
  setSession(sessionFor(perfil))
}
