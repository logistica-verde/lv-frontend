import { Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import styles from '@/components/AppLayout/AppLayout.module.css'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { classNames } from '@/lib/classNames'
import { navItems } from '@/navigation'

const WIDE_QUERY = '(min-width: 64rem)'
const MENU_ID = 'menu-principal'

export default function AppLayout() {
  const isWide = useMediaQuery(WIDE_QUERY)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

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
            Logística Verde
          </Link>
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
      <main id="conteudo" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
