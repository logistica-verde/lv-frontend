export type NavItem = {
  to: string
  label: string
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Nova rota', end: true },
  { to: '/historico', label: 'Histórico' },
  { to: '/veiculos', label: 'Veículos' },
  { to: '/verificacao', label: 'Verificação' },
]
