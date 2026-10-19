import { useEffect, useMemo, useRef, useState } from 'react'
import DueExecutionDialog from '@/components/Schedule/DueExecutionDialog'
import { useScheduledExecutions } from '@/hooks/useExecutions'
import { useNow } from '@/hooks/useNow'
import { useSession } from '@/hooks/useSession'
import { useToast } from '@/hooks/useToast'
import { formatShortDateTime } from '@/lib/format'
import { ACCESS, canAccess } from '@/lib/permissions'
import {
  crossedThreshold,
  describeTimeLeft,
  minutesUntil,
  REMINDER_THRESHOLDS_MINUTES,
} from '@/lib/schedule'

const CLOCK_TICK_MS = 15_000

export default function ScheduleWatcher() {
  const session = useSession()
  const allowed = session !== null && canAccess(session.usuario.perfil, ACCESS.planning)
  const scheduled = useScheduledExecutions(allowed)
  const now = useNow(CLOCK_TICK_MS)
  const { notify } = useToast()
  const announced = useRef(new Map<string, Set<number>>())
  const [dismissed, setDismissed] = useState<ReadonlySet<number>>(new Set())

  const executions = useMemo(
    () => (allowed ? (scheduled.data ?? []) : []),
    [allowed, scheduled.data],
  )

  useEffect(() => {
    executions.forEach((execution) => {
      if (!execution.scheduledAt) {
        return
      }
      const minutesLeft = minutesUntil(new Date(execution.scheduledAt), now)
      if (minutesLeft <= 0) {
        return
      }
      const key = `${execution.id}@${execution.scheduledAt}`
      const already = announced.current.get(key) ?? new Set<number>()
      const threshold = crossedThreshold(minutesLeft, already)
      if (threshold === null) {
        return
      }
      announced.current.set(
        key,
        new Set([...already, ...REMINDER_THRESHOLDS_MINUTES.filter((value) => value >= minutesLeft)]),
      )
      notify(
        `A rota de ${execution.vehiclePlate} (${formatShortDateTime(execution.scheduledAt)}) começa em ${describeTimeLeft(minutesLeft)}.`,
        'info',
      )
    })
  }, [executions, now, notify])

  const due = executions.find(
    (execution) =>
      execution.scheduledAt !== null &&
      minutesUntil(new Date(execution.scheduledAt), now) <= 0 &&
      !dismissed.has(execution.id),
  )

  if (!due) {
    return null
  }

  return (
    <DueExecutionDialog
      key={due.id}
      execution={due}
      onDismiss={() => setDismissed((current) => new Set([...current, due.id]))}
    />
  )
}
