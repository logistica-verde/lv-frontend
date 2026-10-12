import HashText from '@/components/HashText/HashText'
import Skeleton from '@/components/Skeleton/Skeleton'
import IntegrityBadge from '@/components/IntegrityBadge/IntegrityBadge'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useIntegrity } from '@/hooks/useIntegrity'
import styles from '@/pages/ComparisonPage/IntegritySeal.module.css'

type IntegritySealProps = {
  routeId: number
  criterion: string
}

export default function IntegritySeal({ routeId, criterion }: IntegritySealProps) {
  const integrity = useIntegrity(routeId)

  if (integrity.isPending) {
    return (
      <div role="status">
        <VisuallyHidden>{`Verificando integridade da rota de ${criterion}`}</VisuallyHidden>
        <Skeleton height="1.5rem" width="8rem" />
      </div>
    )
  }

  if (integrity.isError) {
    return <StatusBadge tone="neutral">Não verificada</StatusBadge>
  }

  return (
    <div className={styles.seal}>
      <IntegrityBadge status={integrity.data.status} />
      {integrity.data.txHash && (
        <HashText value={integrity.data.txHash} label={`transação da rota de ${criterion}`} />
      )}
    </div>
  )
}
