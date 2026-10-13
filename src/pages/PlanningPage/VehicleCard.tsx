import { Link } from 'react-router'
import Card from '@/components/Card/Card'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import PlateBadge from '@/components/PlateBadge/PlateBadge'
import SelectField from '@/components/SelectField/SelectField'
import Skeleton from '@/components/Skeleton/Skeleton'
import VehicleImage from '@/components/VehicleImage/VehicleImage'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import type { useVehicles } from '@/hooks/useVehicles'
import { formatNumber } from '@/lib/format'
import styles from '@/pages/PlanningPage/VehicleCard.module.css'
import { describeError } from '@/services/errors'
import { VEHICLE_IMAGE_LABELS } from '@/services/schemas/vehicle'
import type { Vehicle } from '@/services/schemas/vehicle'

type VehicleCardProps = {
  query: ReturnType<typeof useVehicles>
  active: Vehicle[]
  selected: Vehicle | undefined
  onChange: (vehicleId: number) => void
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function VehicleCard({ query, active, selected, onChange }: VehicleCardProps) {
  return (
    <Card title="Veículo">
      {query.isPending && (
        <div role="status">
          <VisuallyHidden>Carregando veículos</VisuallyHidden>
          <Skeleton height="2.25rem" />
        </div>
      )}
      {query.isError && (
        <ErrorMessage message={describeError(query.error)} onRetry={() => query.refetch()} />
      )}
      {query.isSuccess && active.length === 0 && (
        <p className={styles.empty}>
          Nenhum veículo ativo. <Link to="/administracao">Cadastrar veículo</Link>
        </p>
      )}
      {query.isSuccess && selected && (
        <div className={styles.body}>
          <div className={styles.hero}>
            <div className={styles.tile}>
              <VehicleImage image={selected.imagem} className={styles.picture} />
            </div>
            <div className={styles.identity}>
              <PlateBadge plate={selected.placa} />
              <p className={styles.type}>{VEHICLE_IMAGE_LABELS[selected.imagem]}</p>
            </div>
          </div>
          <dl className={styles.specs}>
            <div>
              <dt>Massa bruta</dt>
              <dd>{formatNumber(selected.massaKg)} kg</dd>
            </div>
            <div>
              <dt>Combustível</dt>
              <dd>{capitalize(selected.tipoCombustivel)}</dd>
            </div>
            <div>
              <dt>Situação</dt>
              <dd>
                <span className={styles.status}>
                  <span className={styles.dot} aria-hidden="true" />
                  {selected.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </dd>
            </div>
          </dl>
          <SelectField
            label="Trocar veículo"
            value={String(selected.id)}
            onChange={(event) => onChange(Number(event.target.value))}
          >
            {active.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.placa} · {VEHICLE_IMAGE_LABELS[vehicle.imagem]} ·{' '}
                {formatNumber(vehicle.massaKg)} kg
              </option>
            ))}
          </SelectField>
        </div>
      )}
    </Card>
  )
}
