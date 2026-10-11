import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Skeleton from '@/components/Skeleton/Skeleton'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useRoute } from '@/hooks/useRoutes'
import ComparisonSummary from '@/pages/ComparisonPage/ComparisonSummary'
import RouteMap from '@/pages/ComparisonPage/RouteMap'
import styles from '@/pages/ComparisonPage/ComparisonView.module.css'
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
        <Skeleton height="6rem" />
        <Skeleton height="20rem" />
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

  return (
    <div className={styles.results}>
      <ComparisonSummary emissionRoute={emissionRoute} distanceRoute={distanceRoute} />
      <div className={styles.maps}>
        <RouteMap title="Menor emissão" route={emissionRoute} tone="emission" />
        <RouteMap title="Menor distância" route={distanceRoute} tone="distance" />
      </div>
      <p className={styles.note}>
        As linhas ligam as paradas em linha reta e não representam o traçado das ruas.
      </p>
    </div>
  )
}
