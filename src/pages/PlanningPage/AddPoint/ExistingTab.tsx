import { useState } from 'react'
import Button from '@/components/Button/Button'
import EmptyState from '@/components/EmptyState/EmptyState'
import Pagination from '@/components/Pagination/Pagination'
import styles from '@/pages/PlanningPage/AddPoint/AddPointTabs.module.css'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'

const PAGE_SIZE = 4

type ExistingTabProps = {
  available: DeliveryPoint[]
  capacity: number
  onAdded: (points: DeliveryPoint[]) => void
}

export default function ExistingTab({ available, capacity, onAdded }: ExistingTabProps) {
  const [page, setPage] = useState(1)
  const [chosenIds, setChosenIds] = useState<number[]>([])

  if (available.length === 0) {
    return (
      <EmptyState
        title="Nenhum ponto disponível"
        description="Todos os pontos cadastrados já estão na rota. Adicione um novo por endereço, coordenadas ou CSV."
      />
    )
  }

  const pageCount = Math.ceil(available.length / PAGE_SIZE)
  const visible = available.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const overCapacity = chosenIds.length > capacity

  const toggle = (id: number) =>
    setChosenIds((current) =>
      current.includes(id) ? current.filter((chosen) => chosen !== id) : [...current, id],
    )

  const add = () =>
    onAdded(
      chosenIds
        .map((id) => available.find((point) => point.id === id))
        .filter((point): point is DeliveryPoint => point !== undefined),
    )

  return (
    <div className={styles.form}>
      <fieldset className={styles.options}>
        <legend>Pontos cadastrados fora da rota</legend>
        {visible.map((point) => (
          <label key={point.id} className={styles.option}>
            <input
              type="checkbox"
              checked={chosenIds.includes(point.id)}
              onChange={() => toggle(point.id)}
            />
            <span>
              {point.nome}
              {point.endereco && <span className={styles.muted}> · {point.endereco}</span>}
            </span>
          </label>
        ))}
      </fieldset>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        label="Paginação dos pontos cadastrados"
      />
      {overCapacity && (
        <p role="alert" className={styles.errors}>
          A rota comporta mais {capacity} {capacity === 1 ? 'ponto' : 'pontos'}. Desmarque alguns.
        </p>
      )}
      <div className={styles.actions}>
        <Button disabled={chosenIds.length === 0 || overCapacity} onClick={add}>
          {`Adicionar selecionados (${chosenIds.length})`}
        </Button>
      </div>
    </div>
  )
}
