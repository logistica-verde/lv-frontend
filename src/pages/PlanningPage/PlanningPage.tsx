import type { LatLngTuple } from 'leaflet'
import { Route } from 'lucide-react'
import { useCallback, useState } from 'react'
import Button from '@/components/Button/Button'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import MapMarker from '@/components/Map/MapMarker'
import MapView from '@/components/Map/MapView'
import SplitLayout from '@/components/SplitLayout/SplitLayout'
import { useBases } from '@/hooks/useBases'
import { useDeliveryPoints } from '@/hooks/useDeliveryPoints'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useCurrentLocation } from '@/hooks/useCurrentLocation'
import { useCalculateRoutes } from '@/hooks/useRoutes'
import type { CalculationIds } from '@/hooks/useRoutes'
import { useToast } from '@/hooks/useToast'
import { useActiveVehicle } from '@/hooks/useVehicles'
import { formatNumber } from '@/lib/format'
import { toLatLng } from '@/lib/geo'
import { addToSelection, isSelectionReady, moveSelection, toggleSelection } from '@/lib/selection'
import AddPointDialog from '@/pages/PlanningPage/AddPoint/AddPointDialog'
import type { AddPointTab } from '@/pages/PlanningPage/AddPoint/AddPointDialog'
import CalculatingDialog from '@/pages/PlanningPage/Calculation/CalculatingDialog'
import ConfirmCalculationDialog from '@/pages/PlanningPage/Calculation/ConfirmCalculationDialog'
import ResultsDialog from '@/pages/PlanningPage/Calculation/ResultsDialog'
import styles from '@/pages/PlanningPage/PlanningPage.module.css'
import OriginCard from '@/pages/PlanningPage/OriginCard'
import PointsList from '@/pages/PlanningPage/PointsList'
import VehicleCard from '@/pages/PlanningPage/VehicleCard'
import { describeError } from '@/services/errors'
import type { Base } from '@/services/schemas/base'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import type { Route as CalculatedRoute } from '@/services/schemas/route'

const NO_POINTS: DeliveryPoint[] = []
const NO_BASES: Base[] = []
const FLOATING_INSET_PX = 380
const VEHICLE_INSET_PX = 250

type DialogState = {
  tab: AddPointTab
  position: LatLngTuple | null
  query?: string
}

type Calculation = {
  ids: CalculationIds
  startedAt: number
}

type Results = {
  emission: CalculatedRoute
  distance: CalculatedRoute
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
  const bases = useBases()
  const activeBases = bases.data ?? NO_BASES
  const { vehicles, active, selected: vehicle, choose } = useActiveVehicle()
  const calculateRoutes = useCalculateRoutes()
  const { notify } = useToast()
  const isDesktop = useIsDesktop()
  const [requestedIds, setRequestedIds] = useState<number[]>([])
  const [draft, setDraft] = useState<LatLngTuple | null>(null)
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [calculation, setCalculation] = useState<Calculation | null>(null)
  const [results, setResults] = useState<Results | null>(null)
  const { location, locate, clear } = useCurrentLocation()
  const origin = location.status === 'ready' ? location.fix : null

  const registered = points.data ?? NO_POINTS
  const selectedPoints = requestedIds
    .map((id) => registered.find((point) => point.id === id))
    .filter((point): point is DeliveryPoint => point !== undefined)
  const selectedIds = selectedPoints.map((point) => point.id)
  const canCalculate =
    vehicle !== undefined &&
    isSelectionReady(selectedIds.length, origin !== null || activeBases.length > 0)

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

  const calculate = (cargoKg: number, baseId: number | null) => {
    if (!vehicle) {
      return
    }
    calculateRoutes.mutate(
      {
        vehicleId: vehicle.id,
        deliveryPointIds: selectedIds,
        origin:
          origin && baseId === null
            ? { latitude: origin.latitude, longitude: origin.longitude }
            : undefined,
        cargoKg: cargoKg > 0 ? cargoKg : undefined,
        baseId: baseId ?? undefined,
      },
      {
        onSuccess: (ids) => {
          setConfirming(false)
          setCalculation({ ids, startedAt: Date.now() })
        },
        onError: (error) => {
          setConfirming(false)
          notify(describeError(error), 'danger')
        },
      },
    )
  }

  const showResults = useCallback((emission: CalculatedRoute, distance: CalculatedRoute) => {
    setCalculation(null)
    setResults({ emission, distance })
  }, [])

  const vehicleCard = (
    <VehicleCard query={vehicles} active={active} selected={vehicle} onChange={choose} />
  )

  const originCard = <OriginCard location={location} onLocate={locate} onClear={clear} />

  const pointsError = points.isError && (
    <ErrorMessage message={describeError(points.error)} onRetry={() => points.refetch()} />
  )

  const pointsList = (
    <PointsList
      points={selectedPoints}
      onAdd={(tab) => setDialog({ tab, position: null })}
      onSearchAddress={(query) => setDialog({ tab: 'address', position: null, query })}
      onMove={(pointId, offset) => setRequestedIds(moveSelection(selectedIds, pointId, offset))}
      onRemove={(pointId) => setRequestedIds(selectedIds.filter((id) => id !== pointId))}
      hasOrigin={origin !== null}
    />
  )

  const actions = (
    <div className={styles.actions}>
      <Button
        disabled={!canCalculate}
        onClick={() => setConfirming(true)}
        className={styles.calculate}
      >
        <Route size={16} aria-hidden="true" />
        Calcular rotas
      </Button>
      <p className={styles.calculateHint}>
        Calcula a rota de menor emissão e a de menor distância para os mesmos pontos.
      </p>
    </div>
  )

  const panel = (
    <div className={styles.panel}>
      <h1 className={styles.title}>Nova rota</h1>
      {vehicleCard}
      {originCard}
      {pointsError}
      {pointsList}
      {actions}
    </div>
  )

  const map = (
    <MapView
      label="Mapa dos pontos de entrega"
      flush={isDesktop}
      fitInsetRight={isDesktop ? FLOATING_INSET_PX : 0}
      fitInsetTop={isDesktop ? VEHICLE_INSET_PX : 0}
      fitTo={registered.map(toLatLng)}
      onMapClick={setDraft}
      zoomControls={false}
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
      {origin && (
        <MapMarker
          position={[origin.latitude, origin.longitude]}
          title="Minha localização"
          label="S"
          tone="distance"
        />
      )}
    </MapView>
  )

  return (
    <div className={styles.page}>
      {isDesktop ? (
        <div className={styles.stage}>
          {map}
          <h1 className={styles.hiddenTitle}>Nova rota</h1>
          <div className={styles.vehicleCorner}>{vehicleCard}</div>
          <div className={styles.floating}>
            {originCard}
            {pointsError}
            <div className={styles.floatingGrow}>{pointsList}</div>
            <div className={`${styles.floatingCard} ${styles.floatingActions}`}>{actions}</div>
          </div>
        </div>
      ) : (
        <SplitLayout panelLabel="Pontos" mapLabel="Mapa" panel={panel} map={map} />
      )}
      <ConfirmCalculationDialog
        open={confirming}
        vehicle={vehicle}
        pointCount={selectedPoints.length}
        hasOrigin={origin !== null}
        bases={activeBases}
        submitting={calculateRoutes.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={calculate}
      />
      {calculation && (
        <CalculatingDialog
          key={`${calculation.ids.emission.id}-${calculation.ids.distance.id}`}
          calculation={calculation.ids}
          startedAt={calculation.startedAt}
          onFinished={showResults}
          onClose={() => setCalculation(null)}
        />
      )}
      {results && (
        <ResultsDialog
          emissionRoute={results.emission}
          distanceRoute={results.distance}
          onClose={() => setResults(null)}
        />
      )}
      <AddPointDialog
        open={dialog !== null}
        initialTab={dialog?.tab ?? 'existing'}
        initialPosition={dialog?.position ?? null}
        initialQuery={dialog?.query}
        selected={selectedPoints}
        registered={registered}
        onClose={() => setDialog(null)}
        onAdded={handleAdded}
      />
    </div>
  )
}
