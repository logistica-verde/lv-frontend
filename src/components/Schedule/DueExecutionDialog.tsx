import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import styles from '@/components/Schedule/DueExecutionDialog.module.css'
import TextField from '@/components/TextField/TextField'
import { useRescheduleExecution, useStartExecution } from '@/hooks/useExecutions'
import { useToast } from '@/hooks/useToast'
import { formatKilometers, formatNumber, formatShortDateTime } from '@/lib/format'
import { defaultScheduleValue, isInThePast, parseLocalInput } from '@/lib/schedule'
import { describeError } from '@/services/errors'
import type { Execution } from '@/services/schemas/execution'

type DueExecutionDialogProps = {
  execution: Execution
  onDismiss: () => void
}

export default function DueExecutionDialog({ execution, onDismiss }: DueExecutionDialogProps) {
  const navigate = useNavigate()
  const { notify } = useToast()
  const start = useStartExecution()
  const reschedule = useRescheduleExecution()
  const [rescheduling, setRescheduling] = useState(false)
  const [scheduleText, setScheduleText] = useState(() => defaultScheduleValue(new Date()))
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  const goNow = () =>
    start.mutate(execution.id, {
      onSuccess: () => navigate(`/execucao/${execution.id}`),
      onError: (error) => notify(describeError(error), 'danger'),
    })

  const submitReschedule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const date = parseLocalInput(scheduleText)
    if (!date) {
      setScheduleError('Informe a data e a hora.')
      return
    }
    if (isInThePast(date, new Date())) {
      setScheduleError('Escolha um horário no futuro.')
      return
    }
    reschedule.mutate(
      { id: execution.id, scheduledAt: date.toISOString() },
      {
        onSuccess: (changed) =>
          notify(
            `Rota reagendada para ${formatShortDateTime(changed.scheduledAt ?? date.toISOString())}.`,
            'success',
          ),
        onError: (error) => notify(describeError(error), 'danger'),
      },
    )
  }

  return (
    <Modal open title="Chegou a hora da rota" onClose={onDismiss}>
      <div className={styles.body}>
        <p className={styles.lead}>
          A rota de <strong>{execution.vehiclePlate}</strong> estava agendada para{' '}
          {execution.scheduledAt ? formatShortDateTime(execution.scheduledAt) : 'agora'}.
        </p>
        <dl className={styles.facts}>
          <div>
            <dt>Paradas</dt>
            <dd>{execution.pointCount}</dd>
          </div>
          <div>
            <dt>Emissão</dt>
            <dd>
              {execution.totalEmissionKg === null
                ? '—'
                : `${formatNumber(execution.totalEmissionKg)} kg CO₂`}
            </dd>
          </div>
          <div>
            <dt>Distância</dt>
            <dd>
              {execution.totalDistanceMeters === null
                ? '—'
                : `${formatKilometers(execution.totalDistanceMeters)} km`}
            </dd>
          </div>
        </dl>
        {rescheduling ? (
          <form onSubmit={submitReschedule} className={styles.form}>
            <TextField
              label="Nova data e hora"
              type="datetime-local"
              value={scheduleText}
              error={scheduleError ?? undefined}
              onChange={(event) => {
                setScheduleText(event.target.value)
                setScheduleError(null)
              }}
            />
            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setRescheduling(false)}>
                Voltar
              </Button>
              <Button type="submit" loading={reschedule.isPending}>
                Confirmar novo horário
              </Button>
            </div>
          </form>
        ) : (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setRescheduling(true)}>
              Reagendar
            </Button>
            <Button loading={start.isPending} onClick={goNow}>
              Ir agora
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
