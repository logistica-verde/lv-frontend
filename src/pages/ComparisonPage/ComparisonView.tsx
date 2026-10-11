import Card from '@/components/Card/Card'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Skeleton from '@/components/Skeleton/Skeleton'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useRoute } from '@/hooks/useRoutes'
import {
  describeDistanceComparison,
  describeEmissionComparison,
  emissionSavingPercent,
  extraDistancePercent,
} from '@/lib/comparison'
import ComparisonMap from '@/pages/ComparisonPage/ComparisonMap'
import styles from '@/pages/ComparisonPage/ComparisonView.module.css'
import IntegrityPanel from '@/pages/ComparisonPage/IntegrityPanel'
import MetricsTable from '@/pages/ComparisonPage/MetricsTable'
import SegmentsTable from '@/pages/ComparisonPage/SegmentsTable'
import { ApiError, describeError } from '@/services/errors'

type ComparisonViewProps = {
  emissionId: number
  distanceId: number
}

export default function ComparisonView({ emissionId, distanceId }: ComparisonViewProps) {
  const emission = useRoute(emissionId)
  const distance = useRoute(distanceId)

  const requestError = emission.error ?? distance.error
  if (requestError instanceof ApiError && requestError.status === 404) {
    return <ErrorMessage message="Uma das rotas não foi encontrada." />
  }
  if (requestError) {
    return (
      <ErrorMessage
        message={describeError(requestError)}
        onRetry={() => {
          void emission.refetch()
          void distance.refetch()
        }}
      />
    )
  }

  const emissionRoute = emission.data
  const distanceRoute = distance.data
  if (!emissionRoute || !distanceRoute) {
    return (
      <div role="status" className={styles.loading}>
        <VisuallyHidden>Carregando rotas</VisuallyHidden>
        <Skeleton height="10rem" />
        <Skeleton height="24rem" />
      </div>
    )
  }

  if (emissionRoute.criterion !== 'EMISSION' || distanceRoute.criterion !== 'DISTANCE') {
    return (
      <ErrorMessage message="Este endereço não corresponde a uma comparação válida entre rotas." />
    )
  }

  const failed = [emissionRoute, distanceRoute].find((route) => route.status === 'FAILED')
  if (failed) {
    return <ErrorMessage message={failed.errorMessage ?? 'O cálculo de uma das rotas falhou.'} />
  }

  if (emissionRoute.status === 'PENDING' || distanceRoute.status === 'PENDING') {
    return <p role="status">Calculando as rotas…</p>
  }

  const emissionText = describeEmissionComparison(
    emissionSavingPercent(emissionRoute, distanceRoute),
  )
  const distanceText = describeDistanceComparison(
    extraDistancePercent(emissionRoute, distanceRoute),
  )

  return (
    <div className={styles.results}>
      <p className={styles.lead}>
        {emissionText} {distanceText}
      </p>
      <MetricsTable emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
      <ComparisonMap emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
      <SegmentsTable emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
      <Card title="Integridade na blockchain">
        <div id="integridade" className={styles.integrity}>
          <IntegrityPanel routeId={emissionRoute.id} title="Menor emissão" />
          <IntegrityPanel routeId={distanceRoute.id} title="Menor distância" />
        </div>
      </Card>
    </div>
  )
}
