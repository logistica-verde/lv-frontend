import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import MapMarker from '@/components/Map/MapMarker'
import MapView from '@/components/Map/MapView'
import { useDeliveryPoints } from '@/hooks/useDeliveryPoints'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { toLatLng } from '@/lib/geo'
import styles from '@/pages/PlanningPage/PlanningPage.module.css'
import { describeError } from '@/services/errors'

function describePoints(count: number): string {
  if (count === 0) {
    return 'Nenhum ponto de entrega cadastrado.'
  }
  return count === 1 ? '1 ponto de entrega cadastrado.' : `${count} pontos de entrega cadastrados.`
}

export default function PlanningPage() {
  useDocumentTitle('Planejamento de rotas')
  const points = useDeliveryPoints()
  const positions = points.data?.map(toLatLng)

  return (
    <div className={styles.page}>
      <h1>Planejamento de rotas</h1>
      {points.isError && (
        <ErrorMessage message={describeError(points.error)} onRetry={() => points.refetch()} />
      )}
      <MapView label="Mapa dos pontos de entrega" fitTo={positions}>
        {points.data?.map((point) => (
          <MapMarker key={point.id} position={toLatLng(point)} title={point.nome} />
        ))}
      </MapView>
      <p role="status" className={styles.summary}>
        {points.isPending && 'Carregando pontos de entrega…'}
        {points.isSuccess && describePoints(points.data.length)}
      </p>
    </div>
  )
}
