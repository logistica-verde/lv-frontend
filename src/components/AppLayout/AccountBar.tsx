import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import Button from '@/components/Button/Button'
import styles from '@/components/AppLayout/AccountBar.module.css'
import IconButton from '@/components/IconButton/IconButton'
import { classNames } from '@/lib/classNames'
import { clearSession } from '@/lib/session'
import type { Session } from '@/services/schemas/auth'
import { ROLE_LABELS } from '@/services/schemas/user'
import type { Role } from '@/services/schemas/user'

type AccountBarProps = {
  session: Session
  variant: 'sidebar' | 'menu'
}

const AVATAR_STYLES: Record<Role, string | undefined> = {
  OPERATOR: styles.operator,
  AUDITOR: styles.auditor,
  ADMIN: styles.admin,
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}

export default function AccountBar({ session, variant }: AccountBarProps) {
  const queryClient = useQueryClient()
  const { nome, perfil } = session.usuario

  const signOut = () => {
    clearSession()
    queryClient.clear()
  }

  const identity = (
    <div className={styles.person}>
      <span className={classNames(styles.avatar, AVATAR_STYLES[perfil])} aria-hidden="true">
        {initialsOf(nome)}
      </span>
      <div className={styles.identity}>
        <span className={styles.name}>{nome}</span>
        <span className={styles.role}>{ROLE_LABELS[perfil]}</span>
      </div>
    </div>
  )

  if (variant === 'menu') {
    return (
      <div className={styles.menu}>
        {identity}
        <Button variant="secondary" size="sm" onClick={signOut}>
          <LogOut size={16} aria-hidden="true" />
          Sair
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.sidebar}>
      {identity}
      <IconButton label="Sair" onClick={signOut}>
        <LogOut size={18} aria-hidden="true" />
      </IconButton>
    </div>
  )
}
