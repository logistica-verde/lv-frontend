import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import IconButton from '@/components/IconButton/IconButton'
import Pagination from '@/components/Pagination/Pagination'
import { useFitRows } from '@/hooks/useFitRows'
import { describeSelection } from '@/lib/selection'
import styles from '@/pages/PlanningPage/PointsList.module.css'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'

const ROW_HEIGHT_PX = 40
const FALLBACK_ROWS = 5

type PointsListProps = {
  points: DeliveryPoint[]
  onAdd: () => void
  onMove: (pointId: number, offset: number) => void
  onRemove: (pointId: number) => void
}

export default function PointsList({ points, onAdd, onMove, onRemove }: PointsListProps) {
  const { ref, rows } = useFitRows(ROW_HEIGHT_PX, FALLBACK_ROWS)
  const [requestedPage, setRequestedPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(points.length / rows))
  const page = Math.min(requestedPage, pageCount)
  const firstIndex = (page - 1) * rows
  const visible = points.slice(firstIndex, firstIndex + rows)

  const move = (pointId: number, offset: number) => {
    const index = points.findIndex((point) => point.id === pointId)
    onMove(pointId, offset)
    setRequestedPage(Math.floor(Math.max(0, index + offset) / rows) + 1)
  }

  return (
    <Card
      title={`Pontos de entrega (${points.length})`}
      fill
      actions={
        <Button variant="secondary" size="sm" onClick={onAdd}>
          <Plus size={16} aria-hidden="true" />
          Adicionar ponto
        </Button>
      }
    >
      <p role="status" className={styles.summary}>
        {describeSelection(points.length)}
      </p>
      <div ref={ref} className={styles.viewport}>
        {points.length === 0 ? (
          <EmptyState
            title="Nenhum ponto na rota"
            description="Clique no mapa ou adicione um ponto por endereço, coordenadas ou CSV."
          />
        ) : (
          <ol aria-label="Pontos da rota" className={styles.list} start={firstIndex + 1}>
            {visible.map((point, index) => {
              const position = firstIndex + index
              return (
                <li key={point.id} className={styles.item}>
                  <span className={styles.index}>{position + 1}</span>
                  <span className={styles.name} title={point.endereco ?? point.nome}>
                    {point.nome}
                  </span>
                  <IconButton
                    label={`Mover ${point.nome} para cima`}
                    disabled={position === 0}
                    onClick={() => move(point.id, -1)}
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    label={`Mover ${point.nome} para baixo`}
                    disabled={position === points.length - 1}
                    onClick={() => move(point.id, 1)}
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </IconButton>
                  <IconButton label={`Remover ${point.nome}`} onClick={() => onRemove(point.id)}>
                    <X size={16} aria-hidden="true" />
                  </IconButton>
                </li>
              )
            })}
          </ol>
        )}
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={setRequestedPage}
        label="Paginação dos pontos"
      />
    </Card>
  )
}
