import HashText from '@/components/HashText/HashText'
import Skeleton from '@/components/Skeleton/Skeleton'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useIntegrity } from '@/hooks/useIntegrity'
import { integrityPresentation } from '@/pages/ComparisonPage/integrityPresentation'
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

  const { tone, label, Icon } = integrityPresentation[integrity.data.status]

  return (
    <div className={styles.seal}>
      <StatusBadge tone={tone}>
        <Icon size={14} aria-hidden="true" />
        {label}
      </StatusBadge>
      {integrity.data.txHash && (
        <HashText value={integrity.data.txHash} label={`transação da rota de ${criterion}`} />
      )}
    </div>
  )
}
