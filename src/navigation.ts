import { ACCESS } from '@/lib/permissions'
import type { Role } from '@/services/schemas/user'

export type NavItem = {
  to: string
  label: string
  roles: readonly Role[]
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Nova rota', roles: ACCESS.planning, end: true },
  { to: '/historico', label: 'Histórico', roles: ACCESS.history },
  { to: '/experimentos', label: 'Experimentos', roles: ACCESS.experiments },
  { to: '/verificacao', label: 'Verificação', roles: ACCESS.verification },
  { to: '/administracao', label: 'Administração', roles: ACCESS.administration },
]
