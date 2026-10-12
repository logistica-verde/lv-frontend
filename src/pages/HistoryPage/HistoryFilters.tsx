import Button from '@/components/Button/Button'
import SelectField from '@/components/SelectField/SelectField'
import TextField from '@/components/TextField/TextField'
import { countActiveFilters, isDateRangeInverted } from '@/lib/historyFilters'
import type { HistoryFilters as Filters } from '@/lib/historyFilters'
import styles from '@/pages/HistoryPage/HistoryFilters.module.css'
import { integrityStatusSchema } from '@/services/schemas/integrity'
import { optimizationCriterionSchema } from '@/services/schemas/route'
import type { Vehicle } from '@/services/schemas/vehicle'

type HistoryFiltersProps = {
  filters: Filters
  vehicles: Vehicle[]
  onChange: (patch: Partial<Filters>) => void
  onClear: () => void
}

export default function HistoryFilters({
  filters,
  vehicles,
  onChange,
  onClear,
}: HistoryFiltersProps) {
  const inverted = isDateRangeInverted(filters)

  return (
    <div className={styles.filters}>
      <TextField
        label="De"
        type="date"
        value={filters.from}
        error={inverted ? 'A data inicial é maior que a final.' : undefined}
        onChange={(event) => onChange({ from: event.target.value })}
      />
      <TextField
        label="Até"
        type="date"
        value={filters.to}
        onChange={(event) => onChange({ to: event.target.value })}
      />
      <SelectField
        label="Veículo"
        value={filters.vehicleId === null ? '' : String(filters.vehicleId)}
        onChange={(event) =>
          onChange({ vehicleId: event.target.value === '' ? null : Number(event.target.value) })
        }
      >
        <option value="">Todos</option>
        {vehicles.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicle.placa}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Critério"
        value={filters.criterion ?? ''}
        onChange={(event) => {
          const parsed = optimizationCriterionSchema.safeParse(event.target.value)
          onChange({ criterion: parsed.success ? parsed.data : null })
        }}
      >
        <option value="">Todos</option>
        <option value="EMISSION">Menor emissão</option>
        <option value="DISTANCE">Menor distância</option>
      </SelectField>
      <SelectField
        label="Integridade"
        value={filters.integrity ?? ''}
        onChange={(event) => {
          const parsed = integrityStatusSchema.safeParse(event.target.value)
          onChange({ integrity: parsed.success ? parsed.data : null })
        }}
      >
        <option value="">Todas</option>
        <option value="VALID">Íntegra</option>
        <option value="TAMPERED">Alterada</option>
        <option value="NOT_ANCHORED">Aguardando registro</option>
      </SelectField>
      <div className={styles.clear}>
        <Button variant="ghost" disabled={countActiveFilters(filters) === 0} onClick={onClear}>
          Limpar filtros
        </Button>
      </div>
    </div>
  )
}
