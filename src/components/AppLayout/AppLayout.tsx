import { ChevronsLeft, ChevronsRight, Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link, NavLink, Outlet, useMatches } from 'react-router'
import { z } from 'zod'
import AccountBar from '@/components/AppLayout/AccountBar'
import styles from '@/components/AppLayout/AppLayout.module.css'
import BrandMark from '@/components/BrandMark/BrandMark'
import IconButton from '@/components/IconButton/IconButton'
import { isMockMode } from '@/config/env'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed'
import { useSession } from '@/hooks/useSession'
import { classNames } from '@/lib/classNames'
import { navItems } from '@/navigation'

const MENU_ID = 'menu-principal'
const fullBleedSchema = z.object({ fullBleed: z.literal(true) })

export default function AppLayout() {
  const isWide = useIsDesktop()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, toggleCollapsed] = useSidebarCollapsed()
  const menuButton = useRef<HTMLButtonElement>(null)
  const session = useSession()
  const fullBleed = useMatches().some((match) => fullBleedSchema.safeParse(match.handle).success)

  const closeMenu = () => setMenuOpen(false)

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && menuOpen) {
      closeMenu()
      menuButton.current?.focus()
    }
  }

  const visibleItems = navItems.filter(
    (item) => !session || item.roles.includes(session.usuario.perfil),
  )

  const links = (
    <ul className={styles.navList}>
      {visibleItems.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end}
            onClick={closeMenu}
            title={isWide && collapsed ? item.label : undefined}
            className={({ isActive }) => classNames(styles.navLink, isActive && styles.active)}
          >
            <item.icon size={18} aria-hidden="true" />
            <span className={isWide && collapsed ? styles.hiddenLabel : undefined}>
              {item.label}
            </span>
          </NavLink>
        </li>
      ))}
    </ul>
  )

  const mockNotice = isMockMode() && (
    <span
      className={styles.mock}
      title="Esta interface usa a API simulada. Os dados não são reais."
    >
      <span className={styles.mockDot} aria-hidden="true" />
      Dados simulados
    </span>
  )

  const content = (
    <main
      id="conteudo"
      tabIndex={-1}
      className={classNames(styles.main, fullBleed && styles.bleed)}
    >
      <Outlet />
    </main>
  )

  const skipLink = (
    <a href="#conteudo" className={styles.skipLink}>
      Ir para o conteúdo
    </a>
  )

  if (isWide) {
    return (
      <div className={classNames(styles.shell, collapsed && styles.shellCollapsed)}>
        {skipLink}
        <aside className={classNames(styles.sidebar, collapsed && styles.sidebarCollapsed)}>
          <div className={styles.brandRow}>
            <Link to="/" className={styles.brand} aria-label="Lastro" title="Lastro">
              <BrandMark />
              <span className={collapsed ? styles.hiddenLabel : undefined}>Lastro</span>
            </Link>
            <IconButton
              label={collapsed ? 'Expandir menu' : 'Recolher menu'}
              aria-expanded={!collapsed}
              onClick={toggleCollapsed}
              className={styles.collapseButton}
            >
              {collapsed ? (
                <ChevronsRight size={18} aria-hidden="true" />
              ) : (
                <ChevronsLeft size={18} aria-hidden="true" />
              )}
            </IconButton>
          </div>
          <nav aria-label="Principal" className={styles.sideNav}>
            {links}
          </nav>
          <div className={styles.sidebarEnd}>
            {!collapsed && mockNotice}
            {session && (
              <AccountBar session={session} variant="sidebar" collapsed={collapsed} />
            )}
          </div>
        </aside>
        {content}
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      {skipLink}
      <header className={styles.header} onKeyDown={handleKeyDown}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <BrandMark size={28} />
            Lastro
          </Link>
          {mockNotice}
          <button
            ref={menuButton}
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls={MENU_ID}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
          {menuOpen && (
            <nav id={MENU_ID} aria-label="Principal" className={styles.mobileNav}>
              {links}
              {session && <AccountBar session={session} variant="menu" />}
            </nav>
          )}
        </div>
      </header>
      {content}
    </div>
  )
}
