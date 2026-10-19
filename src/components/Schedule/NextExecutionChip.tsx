import { Clock } from 'lucide-react'
import styles from '@/components/Schedule/NextExecutionChip.module.css'
import { useScheduledExecutions } from '@/hooks/useExecutions'
import { useNow } from '@/hooks/useNow'
import { useSession } from '@/hooks/useSession'
import { formatShortDateTime } from '@/lib/format'
import { ACCESS, canAccess } from '@/lib/permissions'
import { describeTimeLeft, minutesUntil } from '@/lib/schedule'

const CLOCK_TICK_MS = 15_000

type NextExecutionChipProps = {
  compact?: boolean
}

export default function NextExecutionChip({ compact = false }: NextExecutionChipProps) {
  const session = useSession()
  const allowed = session !== null && canAccess(session.usuario.perfil, ACCESS.planning)
  const scheduled = useScheduledExecutions(allowed)
  const now = useNow(CLOCK_TICK_MS)

  const next = allowed ? scheduled.data?.find((execution) => execution.scheduledAt !== null) : undefined
  if (!next?.scheduledAt) {
    return null
  }
  const minutes = minutesUntil(new Date(next.scheduledAt), now)
  const text = minutes <= 0 ? 'Rota agendada: agora' : `Próxima rota em ${describeTimeLeft(minutes)}`
  const detail = `${next.vehiclePlate} · ${formatShortDateTime(next.scheduledAt)}`

  return (
    <div className={styles.chip} role="status" title={`${text} (${detail})`} data-late={minutes <= 0}>
      <Clock size={16} aria-hidden="true" />
      {compact ? (
        <span className={styles.hidden}>{text}</span>
      ) : (
        <span className={styles.text}>
          <strong>{text}</strong>
          <span>{detail}</span>
        </span>
      )}
    </div>
  )
}
