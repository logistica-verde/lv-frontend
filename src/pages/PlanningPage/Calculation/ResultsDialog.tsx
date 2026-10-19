import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import TextField from '@/components/TextField/TextField'
import { useCreateExecution } from '@/hooks/useExecutions'
import { useToast } from '@/hooks/useToast'
import { formatKilometers, formatNumber, formatShortDateTime } from '@/lib/format'
import {
  defaultScheduleValue,
  isInThePast,
  parseLocalInput,
} from '@/lib/schedule'
import ComparisonMap from '@/pages/ComparisonPage/ComparisonMap'
import MetricsTable from '@/pages/ComparisonPage/MetricsTable'
import SummaryCard from '@/pages/ComparisonPage/SummaryCard'
import styles from '@/pages/PlanningPage/Calculation/ResultsDialog.module.css'
import { describeError } from '@/services/errors'
import type { OptimizationCriterion, Route } from '@/services/schemas/route'

type ResultsDialogProps = {
  emissionRoute: Route
  distanceRoute: Route
  onClose: () => void
}

type When = 'now' | 'later'

const CRITERION_LABELS: Record<OptimizationCriterion, string> = {
  EMISSION: 'Menor emissão',
  DISTANCE: 'Menor distância',
}

function summaryOf(route: Route): string {
  const emission =
    route.totalEmissionKg === null ? '—' : `${formatNumber(route.totalEmissionKg)} kg CO₂`
  const distance =
    route.totalDistanceMeters === null ? '—' : `${formatKilometers(route.totalDistanceMeters)} km`
  return `${emission} · ${distance}`
}

export default function ResultsDialog({
  emissionRoute,
  distanceRoute,
  onClose,
}: ResultsDialogProps) {
  const navigate = useNavigate()
  const { notify } = useToast()
  const createExecution = useCreateExecution()
  const [criterion, setCriterion] = useState<OptimizationCriterion>('EMISSION')
  const [when, setWhen] = useState<When>('now')
  const [scheduleText, setScheduleText] = useState(() => defaultScheduleValue(new Date()))
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  const chosen = criterion === 'EMISSION' ? emissionRoute : distanceRoute
  const routes: Route[] = [emissionRoute, distanceRoute]

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (when === 'now') {
      createExecution.mutate(
        { operationId: chosen.id },
        {
          onSuccess: (execution) => navigate(`/execucao/${execution.id}`),
          onError: (error) => notify(describeError(error), 'danger'),
        },
      )
      return
    }
    const date = parseLocalInput(scheduleText)
    if (!date) {
      setScheduleError('Informe a data e a hora.')
      return
    }
    if (isInThePast(date, new Date())) {
      setScheduleError('Escolha um horário no futuro.')
      return
    }
    setScheduleError(null)
    createExecution.mutate(
      { operationId: chosen.id, scheduledAt: date.toISOString() },
      {
        onSuccess: (execution) => {
          notify(
            `Rota agendada para ${formatShortDateTime(execution.scheduledAt ?? date.toISOString())}.`,
            'success',
          )
          onClose()
        },
        onError: (error) => notify(describeError(error), 'danger'),
      },
    )
  }

  return (
    <Modal open wide title="Rotas calculadas" onClose={onClose}>
      <div className={styles.content}>
        <SummaryCard emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
        <ComparisonMap emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
        <MetricsTable emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
        <form onSubmit={submit} className={styles.decision}>
          <fieldset className={styles.group}>
            <legend>Qual rota seguir?</legend>
            <div className={styles.choices}>
              {routes.map((route) => (
                <label
                  key={route.criterion}
                  className={styles.choice}
                  data-checked={criterion === route.criterion}
                >
                  <input
                    type="radio"
                    name="rota"
                    checked={criterion === route.criterion}
                    onChange={() => setCriterion(route.criterion)}
                  />
                  <span className={styles.choiceText}>
                    <strong>{CRITERION_LABELS[route.criterion]}</strong>
                    <span>{summaryOf(route)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.group}>
            <legend>Quando fazer?</legend>
            <div className={styles.choices}>
              <label className={styles.choice} data-checked={when === 'now'}>
                <input
                  type="radio"
                  name="quando"
                  checked={when === 'now'}
                  onChange={() => setWhen('now')}
                />
                <span className={styles.choiceText}>
                  <strong>Agora</strong>
                  <span>Abre o mapa de navegação e começa o percurso.</span>
                </span>
              </label>
              <label className={styles.choice} data-checked={when === 'later'}>
                <input
                  type="radio"
                  name="quando"
                  checked={when === 'later'}
                  onChange={() => setWhen('later')}
                />
                <span className={styles.choiceText}>
                  <strong>Agendar</strong>
                  <span>Avisa quando o horário estiver chegando.</span>
                </span>
              </label>
            </div>
            {when === 'later' && (
              <TextField
                label="Data e hora"
                type="datetime-local"
                value={scheduleText}
                error={scheduleError ?? undefined}
                onChange={(event) => {
                  setScheduleText(event.target.value)
                  setScheduleError(null)
                }}
              />
            )}
          </fieldset>
          <div className={styles.actions}>
            <Link to={`/rotas/${emissionRoute.id}/${distanceRoute.id}`} className={styles.full}>
              Abrir a comparação completa
            </Link>
            <div className={styles.buttons}>
              <Button variant="ghost" onClick={onClose}>
                Fechar
              </Button>
              <Button type="submit" loading={createExecution.isPending}>
                {when === 'now' ? 'Iniciar rota agora' : 'Agendar rota'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
