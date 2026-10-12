import type { LatLngTuple } from 'leaflet'
import { useState } from 'react'
import Button from '@/components/Button/Button'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import MapMarker from '@/components/Map/MapMarker'
import MapView from '@/components/Map/MapView'
import SplitLayout from '@/components/SplitLayout/SplitLayout'
import { useDeliveryPoints } from '@/hooks/useDeliveryPoints'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useCalculateRoutes } from '@/hooks/useRoutes'
import type { CalculationIds } from '@/hooks/useRoutes'
import { useToast } from '@/hooks/useToast'
import { useActiveVehicle } from '@/hooks/useVehicles'
import { formatNumber } from '@/lib/format'
import { toLatLng } from '@/lib/geo'
import { addToSelection, isSelectionReady, moveSelection, toggleSelection } from '@/lib/selection'
import AddPointDialog from '@/pages/PlanningPage/AddPoint/AddPointDialog'
import type { AddPointTab } from '@/pages/PlanningPage/AddPoint/AddPointDialog'
import CalculationStatus from '@/pages/PlanningPage/CalculationStatus'
import styles from '@/pages/PlanningPage/PlanningPage.module.css'
import PointsList from '@/pages/PlanningPage/PointsList'
import VehicleCard from '@/pages/PlanningPage/VehicleCard'
import { describeError } from '@/services/errors'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'

const NO_POINTS: DeliveryPoint[] = []

type DialogState = {
  tab: AddPointTab
  position: LatLngTuple | null
}

type Calculation = {
  ids: CalculationIds
  startedAt: number
}

function describeAdded(points: DeliveryPoint[]): string {
  const [only] = points
  return points.length === 1 && only
    ? `Ponto ${only.nome} adicionado à rota.`
    : `${points.length} pontos adicionados à rota.`
}

export default function PlanningPage() {
  useDocumentTitle('Nova rota')
  const points = useDeliveryPoints()
  const { vehicles, active, selected: vehicle, choose } = useActiveVehicle()
  const calculateRoutes = useCalculateRoutes()
  const { notify } = useToast()
  const [requestedIds, setRequestedIds] = useState<number[]>([])
  const [draft, setDraft] = useState<LatLngTuple | null>(null)
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [calculation, setCalculation] = useState<Calculation | null>(null)

  const registered = points.data ?? NO_POINTS
  const selectedPoints = requestedIds
    .map((id) => registered.find((point) => point.id === id))
    .filter((point): point is DeliveryPoint => point !== undefined)
  const selectedIds = selectedPoints.map((point) => point.id)
  const canCalculate = vehicle !== undefined && isSelectionReady(selectedIds.length)

  const handleAdded = (added: DeliveryPoint[]) => {
    setRequestedIds(
      addToSelection(
        selectedIds,
        added.map((point) => point.id),
      ),
    )
    setDialog(null)
    setDraft(null)
    notify(describeAdded(added), 'success')
  }

  const calculate = () => {
    if (!vehicle) {
      return
    }
    calculateRoutes.mutate(
      { vehicleId: vehicle.id, deliveryPointIds: selectedIds },
      {
        onSuccess: (ids) => setCalculation({ ids, startedAt: Date.now() }),
        onError: (error) => notify(describeError(error), 'danger'),
      },
    )
  }

  const panel = (
    <div className={styles.panel}>
      <h1 className={styles.title}>Nova rota</h1>
      <VehicleCard query={vehicles} active={active} selected={vehicle} onChange={choose} />
      {points.isError && (
        <ErrorMessage message={describeError(points.error)} onRetry={() => points.refetch()} />
      )}
      <PointsList
        points={selectedPoints}
        onAdd={() => setDialog({ tab: 'existing', position: null })}
        onMove={(pointId, offset) => setRequestedIds(moveSelection(selectedIds, pointId, offset))}
        onRemove={(pointId) => setRequestedIds(selectedIds.filter((id) => id !== pointId))}
      />
      <div className={styles.actions}>
        <Button
          disabled={!canCalculate}
          loading={calculateRoutes.isPending}
          onClick={calculate}
          className={styles.calculate}
        >
          Calcular rotas
        </Button>
        {calculation && (
          <CalculationStatus
            key={`${calculation.ids.emission.id}-${calculation.ids.distance.id}`}
            calculation={calculation.ids}
            startedAt={calculation.startedAt}
          />
        )}
      </div>
    </div>
  )

  const map = (
    <MapView
      label="Mapa dos pontos de entrega"
      fitTo={registered.map(toLatLng)}
      onMapClick={setDraft}
      overlay={
        draft && (
          <div className={styles.draft}>
            <p className={styles.draftText}>
              Novo ponto em {formatNumber(draft[0])}, {formatNumber(draft[1])}
            </p>
            <div className={styles.draftActions}>
              <Button size="sm" onClick={() => setDialog({ tab: 'coordinates', position: draft })}>
                Adicionar ponto aqui
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )
      }
    >
      {registered.map((point) => {
        const position = selectedIds.indexOf(point.id)
        const isSelected = position !== -1
        return (
          <MapMarker
            key={point.id}
            position={toLatLng(point)}
            title={point.nome}
            label={isSelected ? String(position + 1) : undefined}
            tone={isSelected ? 'emission' : 'neutral'}
            selected={isSelected}
            onClick={() => setRequestedIds(toggleSelection(selectedIds, point.id))}
          />
        )
      })}
      {draft && <MapMarker position={draft} title="Novo ponto" label="+" tone="distance" />}
    </MapView>
  )

  return (
    <div className={styles.page}>
      <SplitLayout panelLabel="Pontos" mapLabel="Mapa" panel={panel} map={map} />
      <AddPointDialog
        open={dialog !== null}
        initialTab={dialog?.tab ?? 'existing'}
        initialPosition={dialog?.position ?? null}
        selected={selectedPoints}
        registered={registered}
        onClose={() => setDialog(null)}
        onAdded={handleAdded}
      />
    </div>
  )
}
