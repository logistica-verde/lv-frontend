import type { LatLngTuple } from 'leaflet'
import { useState } from 'react'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import MapMarker from '@/components/Map/MapMarker'
import MapView from '@/components/Map/MapView'
import { useDeliveryPoints } from '@/hooks/useDeliveryPoints'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { toLatLng } from '@/lib/geo'
import { toggleSelection } from '@/lib/selection'
import styles from '@/pages/PlanningPage/PlanningPage.module.css'
import PointForm from '@/pages/PlanningPage/PointForm'
import PointSelector from '@/pages/PlanningPage/PointSelector'
import RouteRequestCard from '@/pages/PlanningPage/RouteRequestCard'
import { describeError } from '@/services/errors'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'

const NO_POINTS: DeliveryPoint[] = []

export default function PlanningPage() {
  useDocumentTitle('Planejamento de rotas')
  const points = useDeliveryPoints()
  const [requestedIds, setRequestedIds] = useState<number[]>([])
  const [pickedPosition, setPickedPosition] = useState<LatLngTuple | null>(null)
  const [previewPosition, setPreviewPosition] = useState<LatLngTuple | null>(null)

  const allPoints = points.data ?? NO_POINTS
  const selectedIds = requestedIds.filter((id) => allPoints.some((point) => point.id === id))

  const handleToggle = (id: number) => setRequestedIds(toggleSelection(selectedIds, id))
  const handleCreated = (point: DeliveryPoint) => {
    setPickedPosition(null)
    setRequestedIds(
      toggleSelection(
        selectedIds.filter((id) => id !== point.id),
        point.id,
      ),
    )
  }

  return (
    <div className={styles.page}>
      <h1>Planejamento de rotas</h1>
      {points.isError && (
        <ErrorMessage message={describeError(points.error)} onRetry={() => points.refetch()} />
      )}
      <div className={styles.layout}>
        <MapView
          label="Mapa dos pontos de entrega"
          fitTo={points.data?.map(toLatLng)}
          onMapClick={setPickedPosition}
        >
          {allPoints.map((point) => (
            <MapMarker
              key={point.id}
              position={toLatLng(point)}
              title={point.nome}
              tone={selectedIds.includes(point.id) ? 'emission' : 'neutral'}
              selected={selectedIds.includes(point.id)}
              onClick={() => handleToggle(point.id)}
            />
          ))}
          {previewPosition && (
            <MapMarker position={previewPosition} title="Novo ponto" tone="distance" />
          )}
        </MapView>
        <div className={styles.side}>
          <PointSelector points={allPoints} selectedIds={selectedIds} onToggle={handleToggle} />
          <RouteRequestCard selectedIds={selectedIds} />
          <PointForm
            pickedPosition={pickedPosition}
            onPreviewChange={setPreviewPosition}
            onCreated={handleCreated}
          />
        </div>
      </div>
    </div>
  )
}
