import { Menu, Route, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link, NavLink, Outlet, useMatches } from 'react-router'
import { z } from 'zod'
import styles from '@/components/AppLayout/AppLayout.module.css'
import { isMockMode } from '@/config/env'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { classNames } from '@/lib/classNames'
import { navItems } from '@/navigation'

const WIDE_QUERY = '(min-width: 64rem)'
const MENU_ID = 'menu-principal'
const fullBleedSchema = z.object({ fullBleed: z.literal(true) })

export default function AppLayout() {
  const isWide = useMediaQuery(WIDE_QUERY)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const fullBleed = useMatches().some((match) => fullBleedSchema.safeParse(match.handle).success)

  const closeMenu = () => setMenuOpen(false)

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && menuOpen) {
      closeMenu()
      menuButton.current?.focus()
    }
  }

  const links = (
    <ul className={styles.navList}>
      {navItems.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end}
            onClick={closeMenu}
            className={({ isActive }) => classNames(styles.navLink, isActive && styles.active)}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )

  return (
    <div className={styles.layout}>
      <a href="#conteudo" className={styles.skipLink}>
        Ir para o conteúdo
      </a>
      <header className={styles.header} onKeyDown={handleKeyDown}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <Route size={16} />
            </span>
            Logística Verde
          </Link>
          {isMockMode() && (
            <span
              className={styles.mock}
              title="Esta interface usa a API simulada. Os dados não são reais."
            >
              <span className={styles.mockDot} aria-hidden="true" />
              Dados simulados
            </span>
          )}
          {isWide ? (
            <nav aria-label="Principal">{links}</nav>
          ) : (
            <>
              <button
                ref={menuButton}
                type="button"
                className={styles.menuButton}
                aria-expanded={menuOpen}
                aria-controls={MENU_ID}
                aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? (
                  <X size={20} aria-hidden="true" />
                ) : (
                  <Menu size={20} aria-hidden="true" />
                )}
              </button>
              {menuOpen && (
                <nav id={MENU_ID} aria-label="Principal" className={styles.mobileNav}>
                  {links}
                </nav>
              )}
            </>
          )}
        </div>
      </header>
      <main
        id="conteudo"
        tabIndex={-1}
        className={classNames(styles.main, fullBleed && styles.bleed)}
      >
        <Outlet />
      </main>
    </div>
  )
}
