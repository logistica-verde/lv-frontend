import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import TextField from '@/components/TextField/TextField'
import { useCreateBase } from '@/hooks/useBases'
import { useToast } from '@/hooks/useToast'
import { numericInputProps } from '@/lib/inputMask'
import styles from '@/pages/AdminPage/AdminPage.module.css'
import { failureMessage } from '@/services/errors'
import { baseInputSchema } from '@/services/schemas/base'
import type { BaseInput } from '@/services/schemas/base'

type RegisterBaseDialogProps = {
  open: boolean
  onClose: () => void
}

export default function RegisterBaseDialog({ open, onClose }: RegisterBaseDialogProps) {
  const createBase = useCreateBase()
  const { notify } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BaseInput>({ resolver: zodResolver(baseInputSchema), mode: 'onTouched' })

  const close = () => {
    reset()
    onClose()
  }

  const submit = handleSubmit(async (input) => {
    try {
      const base = await createBase.mutateAsync({
        ...input,
        endereco: input.endereco === '' ? undefined : input.endereco,
      })
      notify(`Base ${base.nome} cadastrada.`, 'success')
      close()
    } catch (error) {
      notify(failureMessage(error), 'danger')
    }
  })

  return (
    <Modal open={open} title="Cadastrar base" onClose={close}>
      <form onSubmit={submit} noValidate className={styles.form}>
        <div className={styles.fields}>
          <TextField
            label="Nome"
            autoComplete="off"
            maxLength={120}
            error={errors.nome?.message}
            {...register('nome')}
          />
          <TextField
            label="Endereço (opcional)"
            autoComplete="off"
            maxLength={255}
            error={errors.endereco?.message}
            {...register('endereco')}
          />
          <TextField
            label="Latitude"
            type="number"
            step="any"
            inputMode="decimal"
            error={errors.latitude?.message}
            {...numericInputProps({ decimal: true, negative: true })}
            {...register('latitude', { valueAsNumber: true })}
          />
          <TextField
            label="Longitude"
            type="number"
            step="any"
            inputMode="decimal"
            error={errors.longitude?.message}
            {...numericInputProps({ decimal: true, negative: true })}
            {...register('longitude', { valueAsNumber: true })}
          />
        </div>
        <p className={styles.formIntro}>
          A rota calculada com esta base parte dela e volta a ela depois da última parada.
        </p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" loading={createBase.isPending}>
            Cadastrar base
          </Button>
        </div>
      </form>
    </Modal>
  )
}
