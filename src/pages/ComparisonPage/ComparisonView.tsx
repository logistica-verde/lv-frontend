import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Skeleton from '@/components/Skeleton/Skeleton'
import Tabs from '@/components/Tabs/Tabs'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useRoute } from '@/hooks/useRoutes'
import {
  describeDistanceComparison,
  describeEmissionComparison,
  emissionSavingPercent,
  extraDistancePercent,
} from '@/lib/comparison'
import ComparisonMap from '@/pages/ComparisonPage/ComparisonMap'
import styles from '@/pages/ComparisonPage/ComparisonView.module.css'
import MetricsTable from '@/pages/ComparisonPage/MetricsTable'
import SegmentsTable from '@/pages/ComparisonPage/SegmentsTable'
import { ApiError, describeError } from '@/services/errors'

const DESKTOP_QUERY = '(min-width: 64rem)'

type ComparisonViewProps = {
  emissionId: number
  distanceId: number
}

export default function ComparisonView({ emissionId, distanceId }: ComparisonViewProps) {
  const emission = useRoute(emissionId)
  const distance = useRoute(distanceId)
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

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
        <Skeleton height="8rem" />
        <Skeleton height="100%" />
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

  const lead = (
    <p className={styles.lead}>
      {emissionText} {distanceText}
    </p>
  )
  const metrics = <MetricsTable emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
  const map = <ComparisonMap emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
  const segments = <SegmentsTable emissionRoute={emissionRoute} distanceRoute={distanceRoute} />

  if (!isDesktop) {
    return (
      <Tabs
        label="Seções da comparação"
        className={styles.tabs}
        items={[
          {
            id: 'metrics',
            label: 'Métricas',
            content: (
              <div className={styles.stack}>
                {lead}
                {metrics}
              </div>
            ),
          },
          { id: 'map', label: 'Mapa', content: <div className={styles.fill}>{map}</div> },
          {
            id: 'segments',
            label: 'Trechos',
            content: <div className={styles.fill}>{segments}</div>,
          },
        ]}
      />
    )
  }

  return (
    <div className={styles.results}>
      {lead}
      {metrics}
      <div className={styles.workspace}>
        {map}
        {segments}
      </div>
    </div>
  )
}
