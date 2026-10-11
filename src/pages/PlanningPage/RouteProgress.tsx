import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import { useRoute } from '@/hooks/useRoutes'
import type { CalculationIds } from '@/hooks/useRoutes'
import { useToast } from '@/hooks/useToast'
import styles from '@/pages/PlanningPage/RouteProgress.module.css'
import { describeError } from '@/services/errors'
import type { OperationStatus } from '@/services/schemas/route'

type RouteProgressProps = {
  calculation: CalculationIds
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

export default function RouteProgress({ calculation }: RouteProgressProps) {
  const emission = useRoute(calculation.emission.id)
  const distance = useRoute(calculation.distance.id)
  const { notify } = useToast()
  const notified = useRef(false)

  const emissionStatus = emission.data?.status
  const distanceStatus = distance.data?.status

  useEffect(() => {
    if (notified.current) {
      return
    }
    if (emissionStatus === 'FAILED' || distanceStatus === 'FAILED') {
      notified.current = true
      notify('O cálculo de uma das rotas falhou.', 'danger')
    } else if (emissionStatus === 'COMPLETED' && distanceStatus === 'COMPLETED') {
      notified.current = true
      notify('Rotas calculadas.', 'success')
    }
  }, [emissionStatus, distanceStatus, notify])

  const rows = [
    describeRow('Menor emissão', emissionStatus, emission.data?.errorMessage, emission.error),
    describeRow('Menor distância', distanceStatus, distance.data?.errorMessage, distance.error),
  ]

  return (
    <div role="status" className={styles.progress}>
      <h3 className={styles.title}>Andamento do cálculo</h3>
      <ul className={styles.list}>
        {rows.map((row) => (
          <li key={row.label} className={styles.row}>
            <span className={styles.label}>{row.label}</span>
            <StatusBadge tone={row.tone}>{row.text}</StatusBadge>
            {row.detail && <p className={styles.detail}>{row.detail}</p>}
          </li>
        ))}
      </ul>
      {emissionStatus === 'COMPLETED' && distanceStatus === 'COMPLETED' && (
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
