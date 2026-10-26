import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { ChangeEvent } from 'react'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import TextField from '@/components/TextField/TextField'
import VehicleImagePicker from '@/components/VehicleImagePicker/VehicleImagePicker'
import { useToast } from '@/hooks/useToast'
import { maskPlate, numericInputProps } from '@/lib/inputMask'
import { useCreateVehicle } from '@/hooks/useVehicles'
import styles from '@/pages/AdminPage/AdminPage.module.css'
import { failureMessage } from '@/services/errors'
import { DEFAULT_VEHICLE_IMAGE, vehicleInputSchema } from '@/services/schemas/vehicle'
import type { VehicleInput } from '@/services/schemas/vehicle'

const FUEL_SUGGESTIONS_ID = 'combustiveis-sugeridos'
const FUEL_SUGGESTIONS = ['diesel', 'gasolina', 'etanol', 'gnv']

type RegisterVehicleDialogProps = {
  open: boolean
  onClose: () => void
}

export default function RegisterVehicleDialog({ open, onClose }: RegisterVehicleDialogProps) {
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
    defaultValues: { imagem: DEFAULT_VEHICLE_IMAGE },
  })

  const close = () => {
    reset({ imagem: DEFAULT_VEHICLE_IMAGE })
    onClose()
  }

  const submit = handleSubmit(async (input) => {
    try {
      const vehicle = await createVehicle.mutateAsync(input)
      notify(`Veículo ${vehicle.placa} cadastrado.`, 'success')
      close()
    } catch (error) {
      notify(failureMessage(error), 'danger')
    }
  })

  return (
    <Modal open={open} title="Cadastrar veículo" onClose={close}>
      <form onSubmit={submit} noValidate className={styles.form}>
        <div className={styles.fields}>
          <TextField
            label="Placa"
            hint="Formato ABC1234 ou ABC1D23"
            autoComplete="off"
            maxLength={7}
            error={errors.placa?.message}
            {...register('placa', {
              onChange: (event: ChangeEvent<HTMLInputElement>) => {
                event.target.value = maskPlate(event.target.value)
              },
            })}
          />
          <TextField
            label="Massa (kg)"
            type="number"
            step="any"
            inputMode="decimal"
            error={errors.massaKg?.message}
            {...numericInputProps({ decimal: true })}
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
        <VehicleImagePicker legend="Imagem do veículo" {...register('imagem')} />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" loading={createVehicle.isPending}>
            Cadastrar veículo
          </Button>
        </div>
      </form>
    </Modal>
  )
}
