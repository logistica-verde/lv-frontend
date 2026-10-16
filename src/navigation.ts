import { FlaskConical, History, Map, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ACCESS } from '@/lib/permissions'
import type { Role } from '@/services/schemas/user'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  roles: readonly Role[]
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Nova rota', icon: Map, roles: ACCESS.planning, end: true },
  { to: '/historico', label: 'Histórico', icon: History, roles: ACCESS.history },
  { to: '/experimentos', label: 'Experimentos', icon: FlaskConical, roles: ACCESS.experiments },
  { to: '/verificacao', label: 'Verificação', icon: ShieldCheck, roles: ACCESS.verification },
  {
    to: '/administracao',
    label: 'Administração',
    icon: SlidersHorizontal,
    roles: ACCESS.administration,
  },
]
