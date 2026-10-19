import { Link } from 'react-router'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import ComparisonMap from '@/pages/ComparisonPage/ComparisonMap'
import MetricsTable from '@/pages/ComparisonPage/MetricsTable'
import SummaryCard from '@/pages/ComparisonPage/SummaryCard'
import styles from '@/pages/PlanningPage/Calculation/ResultsDialog.module.css'
import type { Route } from '@/services/schemas/route'

type ResultsDialogProps = {
  emissionRoute: Route
  distanceRoute: Route
  onClose: () => void
}

export default function ResultsDialog({
  emissionRoute,
  distanceRoute,
  onClose,
}: ResultsDialogProps) {
  return (
    <Modal open wide title="Rotas calculadas" onClose={onClose}>
      <div className={styles.content}>
        <SummaryCard emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
        <ComparisonMap emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
        <MetricsTable emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
        <div className={styles.actions}>
          <Link to={`/rotas/${emissionRoute.id}/${distanceRoute.id}`} className={styles.full}>
            Abrir a comparação completa
          </Link>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Modal>
  )
}
