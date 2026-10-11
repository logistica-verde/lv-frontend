import { zodResolver } from '@hookform/resolvers/zod'
import type { LatLngTuple } from 'leaflet'
import { useForm } from 'react-hook-form'
import Button from '@/components/Button/Button'
import TextField from '@/components/TextField/TextField'
import { useCreateDeliveryPoints } from '@/hooks/useDeliveryPoints'
import { useToast } from '@/hooks/useToast'
import { roundCoordinate } from '@/lib/geo'
import styles from '@/pages/PlanningPage/AddPoint/AddPointTabs.module.css'
import { describeError } from '@/services/errors'
import { deliveryPointInputSchema } from '@/services/schemas/deliveryPoint'
import type { DeliveryPoint, DeliveryPointInput } from '@/services/schemas/deliveryPoint'

type CoordinatesTabProps = {
  initialPosition: LatLngTuple | null
  onAdded: (points: DeliveryPoint[]) => void
}

export default function CoordinatesTab({ initialPosition, onAdded }: CoordinatesTabProps) {
  const createPoints = useCreateDeliveryPoints()
  const { notify } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryPointInput>({
    resolver: zodResolver(deliveryPointInputSchema),
    mode: 'onTouched',
    defaultValues: initialPosition
      ? {
          latitude: roundCoordinate(initialPosition[0]),
          longitude: roundCoordinate(initialPosition[1]),
        }
      : undefined,
  })

  const submit = handleSubmit(async (input) => {
    const { created, failures } = await createPoints.mutateAsync([
      { ...input, endereco: input.endereco ? input.endereco : undefined },
    ])
    const failure = failures[0]
    if (failure) {
      notify(describeError(failure.error), 'danger')
      return
    }
    onAdded(created)
  })

  return (
    <form onSubmit={submit} noValidate className={styles.form}>
      <TextField
        label="Nome"
        autoComplete="off"
        error={errors.nome?.message}
        {...register('nome')}
      />
      <TextField
        label="Endereço (opcional)"
        autoComplete="off"
        error={errors.endereco?.message}
        {...register('endereco')}
      />
      <div className={styles.pair}>
        <TextField
          label="Latitude"
          type="number"
          step="any"
          inputMode="decimal"
          error={errors.latitude?.message}
          {...register('latitude', { valueAsNumber: true })}
        />
        <TextField
          label="Longitude"
          type="number"
          step="any"
          inputMode="decimal"
          error={errors.longitude?.message}
          {...register('longitude', { valueAsNumber: true })}
        />
      </div>
      <div className={styles.actions}>
        <Button type="submit" loading={createPoints.isPending}>
          Adicionar ponto
        </Button>
      </div>
    </form>
  )
}
