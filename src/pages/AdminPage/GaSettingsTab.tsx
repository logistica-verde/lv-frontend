import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Skeleton from '@/components/Skeleton/Skeleton'
import TextField from '@/components/TextField/TextField'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useGaSettings, useSaveGaSettings } from '@/hooks/useAdmin'
import { useToast } from '@/hooks/useToast'
import styles from '@/pages/AdminPage/AdminPage.module.css'
import { describeError } from '@/services/errors'
import { DEFAULT_GA_SETTINGS, gaSettingsSchema } from '@/services/schemas/gaSettings'
import type { GaSettings } from '@/services/schemas/gaSettings'

type GaSettingsFormProps = {
  settings: GaSettings
}

function GaSettingsForm({ settings }: GaSettingsFormProps) {
  const save = useSaveGaSettings()
  const { notify } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<GaSettings>({
    resolver: zodResolver(gaSettingsSchema),
    mode: 'onTouched',
    defaultValues: settings,
  })

  useEffect(() => {
    reset(settings)
  }, [settings, reset])

  const submit = handleSubmit(async (input) => {
    try {
      await save.mutateAsync(input)
      notify('Parâmetros do algoritmo genético salvos.', 'success')
    } catch (error) {
      notify(
        error instanceof Error ? describeError(error) : 'Ocorreu um erro inesperado.',
        'danger',
      )
    }
  })

  return (
    <form onSubmit={submit} noValidate className={styles.form}>
      <p className={styles.formIntro}>
        Valem para os próximos cálculos de rota. Rotas já calculadas não mudam.
      </p>
      <div className={styles.fields}>
        <TextField
          label="Tamanho da população"
          type="number"
          inputMode="numeric"
          hint="De 10 a 500 indivíduos"
          error={errors.populationSize?.message}
          {...register('populationSize', { valueAsNumber: true })}
        />
        <TextField
          label="Gerações"
          type="number"
          inputMode="numeric"
          hint="De 10 a 1000"
          error={errors.generations?.message}
          {...register('generations', { valueAsNumber: true })}
        />
        <TextField
          label="Taxa de cruzamento"
          type="number"
          step="any"
          inputMode="decimal"
          hint="Entre 0 e 1"
          error={errors.crossoverRate?.message}
          {...register('crossoverRate', { valueAsNumber: true })}
        />
        <TextField
          label="Taxa de mutação"
          type="number"
          step="any"
          inputMode="decimal"
          hint="Entre 0 e 1"
          error={errors.mutationRate?.message}
          {...register('mutationRate', { valueAsNumber: true })}
        />
      </div>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={() => reset(DEFAULT_GA_SETTINGS, { keepDefaultValues: true })}
        >
          Restaurar padrões
        </Button>
        <Button type="submit" disabled={!isDirty} loading={save.isPending}>
          Salvar parâmetros
        </Button>
      </div>
    </form>
  )
}

export default function GaSettingsTab() {
  const settings = useGaSettings()

  return (
    <Card title="Parâmetros do algoritmo genético" fill>
      {settings.isPending && (
        <div role="status" className={styles.loading}>
          <VisuallyHidden>Carregando parâmetros</VisuallyHidden>
          <Skeleton height="2.25rem" />
          <Skeleton height="2.25rem" />
        </div>
      )}
      {settings.isError && (
        <ErrorMessage message={describeError(settings.error)} onRetry={() => settings.refetch()} />
      )}
      {settings.isSuccess && <GaSettingsForm settings={settings.data} />}
    </Card>
  )
}
