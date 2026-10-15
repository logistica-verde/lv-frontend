import { Link } from 'react-router'
import Card from '@/components/Card/Card'
import styles from '@/pages/ComparisonPage/IntegrityCard.module.css'
import IntegritySeal from '@/pages/ComparisonPage/IntegritySeal'
import type { Route } from '@/services/schemas/route'

type IntegrityCardProps = {
  emissionRoute: Route
  distanceRoute: Route
}

export default function IntegrityCard({ emissionRoute, distanceRoute }: IntegrityCardProps) {
  return (
    <Card title="Integridade na blockchain">
      <div className={styles.seals}>
        <div className={styles.sealItem}>
          <div className={styles.sealHeader}>
            <span className={styles.sealLabel}>Integridade: menor emissão</span>
            <Link to={`/verificacao/${emissionRoute.id}`}>Ver verificação</Link>
          </div>
          <IntegritySeal routeId={emissionRoute.id} criterion="menor emissão" />
        </div>
        <div className={styles.sealItem}>
          <div className={styles.sealHeader}>
            <span className={styles.sealLabel}>Integridade: menor distância</span>
            <Link to={`/verificacao/${distanceRoute.id}`}>Ver verificação</Link>
          </div>
          <IntegritySeal routeId={distanceRoute.id} criterion="menor distância" />
        </div>
      </div>
    </Card>
  )
}
