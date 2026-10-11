import { ArrowDown, ArrowUp, FileUp, MapPin, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import IconButton from '@/components/IconButton/IconButton'
import Pagination from '@/components/Pagination/Pagination'
import { useFitRows } from '@/hooks/useFitRows'
import { describeSelection } from '@/lib/selection'
import type { AddPointTab } from '@/pages/PlanningPage/AddPoint/AddPointDialog'
import styles from '@/pages/PlanningPage/PointsList.module.css'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'

const ROW_HEIGHT_PX = 48
const FALLBACK_ROWS = 5

type PointsListProps = {
  points: DeliveryPoint[]
  onAdd: (tab: AddPointTab) => void
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
        <Button variant="secondary" size="sm" onClick={() => onAdd('existing')}>
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
            icon={<MapPin size={20} />}
            title="Nenhum ponto na rota"
            description="Clique nos pontos do mapa ou adicione novos pontos de entrega."
            action={
              <div className={styles.quickActions}>
                <Button variant="secondary" size="sm" onClick={() => onAdd('address')}>
                  <Search size={16} aria-hidden="true" />
                  Buscar endereço
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onAdd('csv')}>
                  <FileUp size={16} aria-hidden="true" />
                  Importar CSV
                </Button>
              </div>
            }
          />
        ) : (
          <ol aria-label="Pontos da rota" className={styles.list} start={firstIndex + 1}>
            {visible.map((point, index) => {
              const position = firstIndex + index
              return (
                <li key={point.id} className={styles.item}>
                  <span className={styles.index}>{position + 1}</span>
                  <span className={styles.name} title={point.endereco ?? point.nome}>
                    <span className={styles.pointName}>{point.nome}</span>
                    {point.endereco && <span className={styles.address}>{point.endereco}</span>}
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
