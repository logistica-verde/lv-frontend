import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import TextField from '@/components/TextField/TextField'
import { useToast } from '@/hooks/useToast'
import { useCreateVehicle } from '@/hooks/useVehicles'
import styles from '@/pages/VehiclesPage/VehicleForm.module.css'
import { describeError } from '@/services/errors'
import { vehicleInputSchema } from '@/services/schemas/vehicle'
import type { VehicleInput } from '@/services/schemas/vehicle'

const FUEL_SUGGESTIONS_ID = 'combustiveis-sugeridos'
const FUEL_SUGGESTIONS = ['diesel', 'gasolina', 'etanol', 'gnv']

export default function VehicleForm() {
  const createVehicle = useCreateVehicle()
  const { notify } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleInputSchema),
    mode: 'onTouched',
  })

  const submit = handleSubmit((input) => {
    createVehicle.mutate(input, {
      onSuccess: (vehicle) => {
        notify(`Veículo ${vehicle.placa} cadastrado.`, 'success')
        reset()
      },
      onError: (error) => notify(describeError(error), 'danger'),
    })
  })

  return (
    <Card title="Cadastrar veículo">
      <form onSubmit={submit} noValidate className={styles.form}>
        <div className={styles.fields}>
          <TextField
            label="Placa"
            hint="Até 10 caracteres"
            autoComplete="off"
            error={errors.placa?.message}
            {...register('placa')}
          />
          <TextField
            label="Massa (kg)"
            type="number"
            step="any"
            inputMode="decimal"
            error={errors.massaKg?.message}
            {...register('massaKg', { valueAsNumber: true })}
          />
          <TextField
            label="Tipo de combustível"
            list={FUEL_SUGGESTIONS_ID}
            autoComplete="off"
            error={errors.tipoCombustivel?.message}
            {...register('tipoCombustivel')}
          />
          <datalist id={FUEL_SUGGESTIONS_ID}>
            {FUEL_SUGGESTIONS.map((fuel) => (
              <option key={fuel} value={fuel} />
            ))}
          </datalist>
        </div>
        <div className={styles.actions}>
          <Button type="submit" loading={createVehicle.isPending}>
            Cadastrar veículo
          </Button>
        </div>
      </form>
    </Card>
  )
}
