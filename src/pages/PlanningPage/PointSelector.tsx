import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import { describeSelection, MAX_SELECTED_POINTS } from '@/lib/selection'
import styles from '@/pages/PlanningPage/PointSelector.module.css'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'

type PointSelectorProps = {
  points: DeliveryPoint[]
  selectedIds: number[]
  onToggle: (id: number) => void
}

export default function PointSelector({ points, selectedIds, onToggle }: PointSelectorProps) {
  const maxReached = selectedIds.length >= MAX_SELECTED_POINTS

  return (
    <Card title="Pontos de entrega">
      <p role="status" className={styles.summary}>
        {describeSelection(selectedIds.length)}
      </p>
      {points.length === 0 ? (
        <EmptyState
          title="Nenhum ponto de entrega"
          description="Clique no mapa para criar o primeiro ponto."
        />
      ) : (
        <ul className={styles.list}>
          {points.map((point) => {
            const checked = selectedIds.includes(point.id)
            return (
              <li key={point.id}>
                <label className={styles.option}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && maxReached}
                    onChange={() => onToggle(point.id)}
                  />
                  <span className={styles.name}>{point.nome}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
