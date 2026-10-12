export type NavItem = {
  to: string
  label: string
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Planejamento', end: true },
  { to: '/veiculos', label: 'Veículos' },
  { to: '/verificacao', label: 'Verificação' },
]
