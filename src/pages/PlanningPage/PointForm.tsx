import { zodResolver } from '@hookform/resolvers/zod'
import type { LatLngTuple } from 'leaflet'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import TextField from '@/components/TextField/TextField'
import { useCreateDeliveryPoint } from '@/hooks/useDeliveryPoints'
import { useToast } from '@/hooks/useToast'
import { isValidCoordinate, roundCoordinate } from '@/lib/geo'
import styles from '@/pages/PlanningPage/PointForm.module.css'
import { deliveryPointInputSchema } from '@/services/schemas/deliveryPoint'
import type { DeliveryPoint, DeliveryPointInput } from '@/services/schemas/deliveryPoint'
import { describeError } from '@/services/errors'

type PointFormProps = {
  pickedPosition: LatLngTuple | null
  onPreviewChange: (position: LatLngTuple | null) => void
  onCreated: (point: DeliveryPoint) => void
}

export default function PointForm({ pickedPosition, onPreviewChange, onCreated }: PointFormProps) {
  const createPoint = useCreateDeliveryPoint()
  const { notify } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<DeliveryPointInput>({
    resolver: zodResolver(deliveryPointInputSchema),
    mode: 'onTouched',
  })

  useEffect(() => {
    if (!pickedPosition) {
      return
    }
    const options = { shouldValidate: true, shouldDirty: true }
    setValue('latitude', roundCoordinate(pickedPosition[0]), options)
    setValue('longitude', roundCoordinate(pickedPosition[1]), options)
  }, [pickedPosition, setValue])

  const latitude = useWatch({ control, name: 'latitude' })
  const longitude = useWatch({ control, name: 'longitude' })

  useEffect(() => {
    const hasPosition =
      latitude !== undefined && longitude !== undefined && isValidCoordinate(latitude, longitude)
    onPreviewChange(hasPosition ? [latitude, longitude] : null)
  }, [latitude, longitude, onPreviewChange])

  const submit = handleSubmit((input) => {
    createPoint.mutate(
      { ...input, endereco: input.endereco ? input.endereco : undefined },
      {
        onSuccess: (point) => {
          notify(`Ponto ${point.nome} cadastrado.`, 'success')
          reset({ nome: '', endereco: '', latitude: Number.NaN, longitude: Number.NaN })
          onCreated(point)
        },
        onError: (error) => notify(describeError(error), 'danger'),
      },
    )
  })

  return (
    <Card title="Novo ponto de entrega">
      <form onSubmit={submit} noValidate className={styles.form}>
        <p className={styles.help}>
          Clique no mapa para preencher a posição ou digite as coordenadas.
        </p>
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
        <div className={styles.coordinates}>
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
          <Button type="submit" loading={createPoint.isPending}>
            Cadastrar ponto
          </Button>
        </div>
      </form>
    </Card>
  )
}
