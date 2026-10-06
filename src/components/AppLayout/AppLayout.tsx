import { Link, NavLink, Outlet } from 'react-router'
import styles from '@/components/AppLayout/AppLayout.module.css'
import { classNames } from '@/lib/classNames'
import { navItems } from '@/navigation'

export default function AppLayout() {
  return (
    <div className={styles.layout}>
      <a href="#conteudo" className={styles.skipLink}>
        Ir para o conteúdo
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            Logística Verde
          </Link>
          <nav aria-label="Principal">
            <ul className={styles.navList}>
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      classNames(styles.navLink, isActive && styles.active)
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
