import { Link } from 'react-router'
import Card from '@/components/Card/Card'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import SelectField from '@/components/SelectField/SelectField'
import Skeleton from '@/components/Skeleton/Skeleton'
import VehicleImage from '@/components/VehicleImage/VehicleImage'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import type { useVehicles } from '@/hooks/useVehicles'
import { formatNumber } from '@/lib/format'
import styles from '@/pages/PlanningPage/VehicleCard.module.css'
import { describeError } from '@/services/errors'
import type { Vehicle } from '@/services/schemas/vehicle'

type VehicleCardProps = {
  query: ReturnType<typeof useVehicles>
  active: Vehicle[]
  selected: Vehicle | undefined
  onChange: (vehicleId: number) => void
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
        <div className={styles.layout}>
          <VehicleImage image={selected.imagem} className={styles.picture} />
          <div className={styles.info}>
            <SelectField
              label="Placa"
              value={String(selected.id)}
              onChange={(event) => onChange(Number(event.target.value))}
            >
              {active.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.placa}
                </option>
              ))}
            </SelectField>
            <dl className={styles.details}>
              <div>
                <dt>Massa</dt>
                <dd>{formatNumber(selected.massaKg)} kg</dd>
              </div>
              <div>
                <dt>Combustível</dt>
                <dd>{selected.tipoCombustivel}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </Card>
  )
}
