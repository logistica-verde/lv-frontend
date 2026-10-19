import { useEffect, useRef } from 'react'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import ProgressBar from '@/components/ProgressBar/ProgressBar'
import Spinner from '@/components/Spinner/Spinner'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { useRoute } from '@/hooks/useRoutes'
import type { CalculationIds } from '@/hooks/useRoutes'
import { formatElapsed } from '@/lib/duration'
import styles from '@/pages/PlanningPage/Calculation/CalculatingDialog.module.css'
import { describeError } from '@/services/errors'
import type { OperationStatus, Route } from '@/services/schemas/route'

const EXPECTED_SECONDS = 14
const MAX_ESTIMATED_PERCENT = 95
const FAILURE_FALLBACK = 'O cálculo não pôde ser concluído.'

type CalculatingDialogProps = {
  calculation: CalculationIds
  startedAt: number
  onFinished: (emission: Route, distance: Route) => void
  onClose: () => void
}

type Line = {
  label: string
  status: OperationStatus | undefined
  error: Error | null
  message: string | null | undefined
}

function badgeOf(line: Line): { tone: 'info' | 'success' | 'danger'; text: string } {
  if (line.error || line.status === 'FAILED') {
    return { tone: 'danger', text: 'Falhou' }
  }
  if (line.status === 'COMPLETED') {
    return { tone: 'success', text: 'Concluída' }
  }
  return { tone: 'info', text: 'Calculando…' }
}

function failureOf(line: Line): string | null {
  if (line.error) {
    return describeError(line.error)
  }
  return line.status === 'FAILED' ? (line.message ?? FAILURE_FALLBACK) : null
}

export default function CalculatingDialog({
  calculation,
  startedAt,
  onFinished,
  onClose,
}: CalculatingDialogProps) {
  const emission = useRoute(calculation.emission.id)
  const distance = useRoute(calculation.distance.id)
  const delivered = useRef(false)

  const lines: Line[] = [
    {
      label: 'Menor emissão',
      status: emission.data?.status,
      error: emission.error,
      message: emission.data?.errorMessage,
    },
    {
      label: 'Menor distância',
      status: distance.data?.status,
      error: distance.error,
      message: distance.data?.errorMessage,
    },
  ]
  const failures = lines.map(failureOf).filter((message): message is string => message !== null)
  const completed = lines.every((line) => line.status === 'COMPLETED')
  const settled = completed || failures.length > 0
  const elapsed = useElapsedSeconds(startedAt, !settled)
  const percent = completed
    ? 100
    : Math.min(MAX_ESTIMATED_PERCENT, (elapsed / EXPECTED_SECONDS) * 100)

  const emissionRoute = emission.data
  const distanceRoute = distance.data

  useEffect(() => {
    if (delivered.current || !completed || !emissionRoute || !distanceRoute) {
      return
    }
    delivered.current = true
    onFinished(emissionRoute, distanceRoute)
  }, [completed, emissionRoute, distanceRoute, onFinished])

  return (
    <Modal
      open
      title={failures.length > 0 ? 'Não foi possível calcular' : 'Calculando as rotas'}
      onClose={onClose}
    >
      <div className={styles.body}>
        {failures.length === 0 && (
          <div className={styles.spinner} aria-hidden="true">
            <Spinner label="Calculando" />
          </div>
        )}
        <div role="status" aria-label="Andamento do cálculo" className={styles.status}>
          <ProgressBar label="Progresso do cálculo" value={percent} />
          <p className={styles.elapsed}>Tempo decorrido: {formatElapsed(elapsed)}</p>
          <ul className={styles.lines}>
            {lines.map((line) => {
              const badge = badgeOf(line)
              return (
                <li key={line.label} className={styles.line}>
                  <span>{line.label}</span>
                  <StatusBadge tone={badge.tone}>{badge.text}</StatusBadge>
                </li>
              )
            })}
          </ul>
        </div>
        {failures.map((message) => (
          <p key={message} role="alert" className={styles.error}>
            {message}
          </p>
        ))}
        {failures.length > 0 && (
          <div className={styles.actions}>
            <Button onClick={onClose}>Voltar</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
