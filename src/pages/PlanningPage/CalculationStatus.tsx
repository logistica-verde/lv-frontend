import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds'
import { useRoute } from '@/hooks/useRoutes'
import type { CalculationIds } from '@/hooks/useRoutes'
import { useToast } from '@/hooks/useToast'
import { formatElapsed } from '@/lib/duration'
import styles from '@/pages/PlanningPage/CalculationStatus.module.css'
import { describeError } from '@/services/errors'
import type { OperationStatus } from '@/services/schemas/route'

type CalculationStatusProps = {
  calculation: CalculationIds
  startedAt: number
}

type BadgeTone = 'info' | 'success' | 'danger'

type Row = {
  label: string
  tone: BadgeTone
  text: string
  detail?: string
}

const FAILURE_FALLBACK = 'O cálculo não pôde ser concluído.'

function describeRow(
  label: string,
  status: OperationStatus | undefined,
  errorMessage: string | null | undefined,
  requestError: Error | null,
): Row {
  if (requestError) {
    return { label, tone: 'danger', text: 'Erro', detail: describeError(requestError) }
  }
  if (status === 'COMPLETED') {
    return { label, tone: 'success', text: 'Concluída' }
  }
  if (status === 'FAILED') {
    return { label, tone: 'danger', text: 'Falhou', detail: errorMessage ?? FAILURE_FALLBACK }
  }
  return { label, tone: 'info', text: 'Calculando…' }
}

export default function CalculationStatus({ calculation, startedAt }: CalculationStatusProps) {
  const emission = useRoute(calculation.emission.id)
  const distance = useRoute(calculation.distance.id)
  const { notify } = useToast()
  const notified = useRef(false)

  const emissionStatus = emission.data?.status
  const distanceStatus = distance.data?.status
  const settled = (status: OperationStatus | undefined, failed: Error | null) =>
    failed !== null || status === 'COMPLETED' || status === 'FAILED'
  const finished =
    settled(emissionStatus, emission.error) && settled(distanceStatus, distance.error)
  const elapsed = useElapsedSeconds(startedAt, !finished)

  useEffect(() => {
    if (!finished || notified.current) {
      return
    }
    notified.current = true
    if (emissionStatus === 'FAILED' || distanceStatus === 'FAILED') {
      notify('O cálculo de uma das rotas falhou.', 'danger')
    } else if (emissionStatus === 'COMPLETED' && distanceStatus === 'COMPLETED') {
      notify('Rotas calculadas.', 'success')
    }
  }, [finished, emissionStatus, distanceStatus, notify])

  const rows = [
    describeRow('Menor emissão', emissionStatus, emission.data?.errorMessage, emission.error),
    describeRow('Menor distância', distanceStatus, distance.data?.errorMessage, distance.error),
  ]
  const bothCompleted = emissionStatus === 'COMPLETED' && distanceStatus === 'COMPLETED'

  return (
    <div role="status" aria-label="Andamento do cálculo" className={styles.status}>
      <div className={styles.header}>
        <h3 className={styles.title}>{finished ? 'Cálculo encerrado' : 'Calculando rotas'}</h3>
        <span className={styles.elapsed}>
          {finished ? 'Tempo total' : 'Tempo decorrido'}: {formatElapsed(elapsed)}
        </span>
      </div>
      <ul className={styles.list}>
        {rows.map((row) => (
          <li key={row.label} className={styles.row}>
            <span className={styles.label}>{row.label}:</span>
            <StatusBadge tone={row.tone}>{row.text}</StatusBadge>
            {row.detail && <p className={styles.detail}>{row.detail}</p>}
          </li>
        ))}
      </ul>
      {bothCompleted && (
        <Link
          to={`/rotas/${calculation.emission.id}/${calculation.distance.id}`}
          className={styles.compare}
        >
          Ver comparação das rotas
        </Link>
      )}
    </div>
  )
}
