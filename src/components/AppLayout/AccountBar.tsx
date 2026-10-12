import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import Button from '@/components/Button/Button'
import styles from '@/components/AppLayout/AccountBar.module.css'
import IconButton from '@/components/IconButton/IconButton'
import { clearSession } from '@/lib/session'
import type { Session } from '@/services/schemas/auth'
import { ROLE_LABELS } from '@/services/schemas/user'

type AccountBarProps = {
  session: Session
  variant: 'bar' | 'menu'
}

export default function AccountBar({ session, variant }: AccountBarProps) {
  const queryClient = useQueryClient()
  const { nome, perfil } = session.usuario

  const signOut = () => {
    clearSession()
    queryClient.clear()
  }

  const identity = (
    <div className={styles.identity}>
      <span className={styles.name}>{nome}</span>
      <span className={styles.role}>{ROLE_LABELS[perfil]}</span>
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
    <div className={styles.bar}>
      {identity}
      <IconButton label="Sair" onClick={signOut}>
        <LogOut size={18} aria-hidden="true" />
      </IconButton>
    </div>
  )
}
