import { Navigation } from 'lucide-react'
import { Link } from 'react-router'
import styles from '@/components/Schedule/NextExecutionChip.module.css'
import { useExecutionsByStatus } from '@/hooks/useExecutions'
import { useSession } from '@/hooks/useSession'
import { ACCESS, canAccess } from '@/lib/permissions'

type ActiveExecutionChipProps = {
  compact?: boolean
}

export default function ActiveExecutionChip({ compact = false }: ActiveExecutionChipProps) {
  const session = useSession()
  const allowed = session !== null && canAccess(session.usuario.perfil, ACCESS.planning)
  const running = useExecutionsByStatus('IN_PROGRESS', allowed)

  const current = allowed ? running.data?.[0] : undefined
  if (!current) {
    return null
  }
  const text = 'Rota em andamento'
  const detail = `${current.vehiclePlate} · retomar a navegação`

  return (
    <Link
      to={`/execucao/${current.id}`}
      className={styles.chip}
      title={`${text} (${detail})`}
      data-running="true"
    >
      <Navigation size={16} aria-hidden="true" />
      {compact ? (
        <span className={styles.hidden}>{`${text}: retomar a navegação`}</span>
      ) : (
        <span className={styles.text}>
          <strong>{text}</strong>
          <span>{detail}</span>
        </span>
      )}
    </Link>
  )
}
