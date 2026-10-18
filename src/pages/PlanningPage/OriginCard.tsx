import { LocateFixed, X } from 'lucide-react'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import type { CurrentLocation } from '@/hooks/useCurrentLocation'
import { describeLocationFailure } from '@/lib/geolocation'
import { formatNumber } from '@/lib/format'
import styles from '@/pages/PlanningPage/OriginCard.module.css'

type OriginCardProps = {
  location: CurrentLocation
  onLocate: () => void
  onClear: () => void
}

export default function OriginCard({ location, onLocate, onClear }: OriginCardProps) {
  return (
    <Card title="Saída">
      {location.status === 'ready' ? (
        <div className={styles.ready}>
          <div className={styles.where}>
            <LocateFixed size={18} aria-hidden="true" className={styles.icon} />
            <div>
              <p className={styles.name}>Minha localização</p>
              <p className={styles.detail}>
                {formatNumber(location.fix.latitude)}, {formatNumber(location.fix.longitude)} ·
                precisão de cerca de {formatNumber(Math.round(location.fix.accuracyMeters))} m
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X size={16} aria-hidden="true" />
            Remover
          </Button>
        </div>
      ) : (
        <div className={styles.idle}>
          <p className={styles.text}>
            A rota sai do primeiro ponto da lista. Para sair de onde você está agora, use a sua
            localização.
          </p>
          <Button
            variant="secondary"
            size="sm"
            loading={location.status === 'locating'}
            onClick={onLocate}
          >
            <LocateFixed size={16} aria-hidden="true" />
            Usar minha localização
          </Button>
        </div>
      )}
      {location.status === 'locating' && (
        <p role="status" className={styles.text}>
          Obtendo a sua localização…
        </p>
      )}
      {location.status === 'failed' && (
        <p role="alert" className={styles.failure}>
          {describeLocationFailure(location.reason)}
        </p>
      )}
    </Card>
  )
}
