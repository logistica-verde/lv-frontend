import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import SelectField from '@/components/SelectField/SelectField'
import { useCalculateRoutes } from '@/hooks/useRoutes'
import type { CalculationIds } from '@/hooks/useRoutes'
import { useToast } from '@/hooks/useToast'
import { useVehicles } from '@/hooks/useVehicles'
import { formatNumber } from '@/lib/format'
import { isSelectionReady } from '@/lib/selection'
import RouteProgress from '@/pages/PlanningPage/RouteProgress'
import styles from '@/pages/PlanningPage/RouteRequestCard.module.css'
import { describeError } from '@/services/errors'
import type { Vehicle } from '@/services/schemas/vehicle'

type RouteRequestCardProps = {
  selectedIds: number[]
}

function describeVehicle(vehicle: Vehicle): string {
  return `${vehicle.placa} · ${formatNumber(vehicle.massaKg)} kg · ${vehicle.tipoCombustivel}`
}

export default function RouteRequestCard({ selectedIds }: RouteRequestCardProps) {
  const vehicles = useVehicles()
  const calculateRoutes = useCalculateRoutes()
  const { notify } = useToast()
  const [chosenVehicleId, setChosenVehicleId] = useState('')
  const [calculation, setCalculation] = useState<CalculationIds | null>(null)

  const activeVehicles = vehicles.data?.filter((vehicle) => vehicle.ativo) ?? []
  const vehicleId = Number(chosenVehicleId || activeVehicles[0]?.id)
  const canCalculate = Number.isInteger(vehicleId) && isSelectionReady(selectedIds.length)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    calculateRoutes.mutate(
      { vehicleId, deliveryPointIds: selectedIds },
      {
        onSuccess: setCalculation,
        onError: (error) => notify(describeError(error), 'danger'),
      },
    )
  }

  return (
    <Card title="Calcular rotas">
      {vehicles.isPending && <p role="status">Carregando veículos…</p>}
      {vehicles.isError && (
        <ErrorMessage message={describeError(vehicles.error)} onRetry={() => vehicles.refetch()} />
      )}
      {vehicles.isSuccess && activeVehicles.length === 0 && (
        <>
          <EmptyState
            title="Nenhum veículo ativo"
            description="Cadastre um veículo para poder calcular rotas."
          />
          <Link to="/veiculos">Cadastrar veículo</Link>
        </>
      )}
      {vehicles.isSuccess && activeVehicles.length > 0 && (
        <form onSubmit={submit} className={styles.form}>
          <SelectField
            label="Veículo"
            value={chosenVehicleId || String(activeVehicles[0]?.id)}
            onChange={(event) => setChosenVehicleId(event.target.value)}
          >
            {activeVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {describeVehicle(vehicle)}
              </option>
            ))}
          </SelectField>
          <div className={styles.actions}>
            <Button type="submit" disabled={!canCalculate} loading={calculateRoutes.isPending}>
              Calcular rotas
            </Button>
          </div>
        </form>
      )}
      {calculation && (
        <RouteProgress
          key={`${calculation.emission.id}-${calculation.distance.id}`}
          calculation={calculation}
        />
      )}
    </Card>
  )
}
