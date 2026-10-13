import { ArrowDown, ArrowUp, FileUp, MapPin, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import IconButton from '@/components/IconButton/IconButton'
import Pagination from '@/components/Pagination/Pagination'
import TextField from '@/components/TextField/TextField'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useFitRows } from '@/hooks/useFitRows'
import { sliceForPage } from '@/lib/pagination'
import { describeSelection, MAX_SELECTED_POINTS } from '@/lib/selection'
import type { AddPointTab } from '@/pages/PlanningPage/AddPoint/AddPointDialog'
import styles from '@/pages/PlanningPage/PointsList.module.css'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'

const ROW_HEIGHT_PX = 48
const FALLBACK_ROWS = 5
const MIN_QUERY_LENGTH = 3

type PointsListProps = {
  points: DeliveryPoint[]
  onAdd: (tab: AddPointTab) => void
  onSearchAddress: (query: string) => void
  onMove: (pointId: number, offset: number) => void
  onRemove: (pointId: number) => void
}

export default function PointsList({
  points,
  onAdd,
  onSearchAddress,
  onMove,
  onRemove,
}: PointsListProps) {
  const { ref, rows } = useFitRows(ROW_HEIGHT_PX, FALLBACK_ROWS)
  const [requestedPage, setRequestedPage] = useState(1)
  const [query, setQuery] = useState('')
  const [tooShort, setTooShort] = useState(false)

  const { page, pageCount, firstIndex, visible } = sliceForPage(points, requestedPage, rows)

  const move = (pointId: number, offset: number) => {
    const index = points.findIndex((point) => point.id === pointId)
    onMove(pointId, offset)
    setRequestedPage(Math.floor(Math.max(0, index + offset) / rows) + 1)
  }

  const submitAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setTooShort(true)
      return
    }
    setTooShort(false)
    setQuery('')
    onSearchAddress(trimmed)
  }

  return (
    <Card
      title="Pontos de entrega"
      fill
      actions={
        <span className={styles.counter} aria-hidden="true">
          {points.length} de {MAX_SELECTED_POINTS}
        </span>
      }
    >
      <VisuallyHidden>
        <span role="status">{describeSelection(points.length)}</span>
      </VisuallyHidden>
      <form onSubmit={submitAddress} noValidate className={styles.addForm}>
        <div className={styles.addField}>
          <TextField
            label="Adicionar endereço"
            placeholder="Ex.: R. Vergueiro, 1.200"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setTooShort(false)
            }}
          />
        </div>
        <Button type="submit" variant="secondary">
          Adicionar
        </Button>
      </form>
      {tooShort && (
        <p role="alert" className={styles.error}>
          Digite ao menos {MIN_QUERY_LENGTH} caracteres do endereço.
        </p>
      )}
      <div className={styles.hintRow}>
        <p className={styles.hint}>
          <MapPin size={14} aria-hidden="true" />
          Clique nos marcadores do mapa para incluir ou retirar pontos.
        </p>
        <Button variant="ghost" size="sm" onClick={() => onAdd('existing')}>
          <Plus size={16} aria-hidden="true" />
          Adicionar ponto
        </Button>
      </div>
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
