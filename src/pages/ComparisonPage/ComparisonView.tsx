import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Skeleton from '@/components/Skeleton/Skeleton'
import Tabs from '@/components/Tabs/Tabs'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useRoute } from '@/hooks/useRoutes'
import ComparisonMap from '@/pages/ComparisonPage/ComparisonMap'
import styles from '@/pages/ComparisonPage/ComparisonView.module.css'
import IntegrityCard from '@/pages/ComparisonPage/IntegrityCard'
import MetricsTable from '@/pages/ComparisonPage/MetricsTable'
import SegmentsTable from '@/pages/ComparisonPage/SegmentsTable'
import SummaryCard from '@/pages/ComparisonPage/SummaryCard'
import { ApiError, describeError } from '@/services/errors'

type ComparisonViewProps = {
  emissionId: number
  distanceId: number
}

export default function ComparisonView({ emissionId, distanceId }: ComparisonViewProps) {
  const emission = useRoute(emissionId)
  const distance = useRoute(distanceId)
  const isDesktop = useIsDesktop()

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
        <Skeleton height="18rem" />
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

  const summary = <SummaryCard emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
  const metrics = <MetricsTable emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
  const integrity = <IntegrityCard emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
  const maps = <ComparisonMap emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
  const segments = <SegmentsTable emissionRoute={emissionRoute} distanceRoute={distanceRoute} />

  if (!isDesktop) {
    return (
      <Tabs
        label="Seções da comparação"
        items={[
          {
            id: 'metrics',
            label: 'Métricas',
            content: (
              <div className={styles.stack}>
                {summary}
                {metrics}
                {integrity}
              </div>
            ),
          },
          { id: 'map', label: 'Mapa', content: maps },
          { id: 'segments', label: 'Trechos', content: segments },
        ]}
      />
    )
  }

  return (
    <div className={styles.results}>
      {summary}
      {maps}
      {metrics}
      {integrity}
      {segments}
    </div>
  )
}
