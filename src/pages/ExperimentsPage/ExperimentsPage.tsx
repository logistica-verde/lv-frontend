import { Play } from 'lucide-react'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Skeleton from '@/components/Skeleton/Skeleton'
import Tabs from '@/components/Tabs/Tabs'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { isMockMode } from '@/config/env'
import { useLatestExperiment, useStartExperiment } from '@/hooks/useExperiments'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import ConvergenceChart from '@/pages/ExperimentsPage/ConvergenceChart'
import EmissionsChart from '@/pages/ExperimentsPage/EmissionsChart'
import ExperimentResultsTable from '@/pages/ExperimentsPage/ExperimentResultsTable'
import styles from '@/pages/ExperimentsPage/ExperimentsPage.module.css'
import { describeError } from '@/services/errors'
import { DEFAULT_EXPERIMENT_INPUT } from '@/services/schemas/experiment'

const DESKTOP_QUERY = '(min-width: 64rem)'

function describeSetup(instances: number[], seeds: number[]): string {
  const sizes = instances.join(', ')
  return `Instâncias de ${sizes} pontos, com ${seeds.length} ${seeds.length === 1 ? 'semente' : 'sementes'} cada.`
}

export default function ExperimentsPage() {
  useDocumentTitle('Experimentos')
  const latest = useLatestExperiment()
  const start = useStartExperiment()
  const { notify } = useToast()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  const experiment = latest.data ?? null
  const running = experiment?.status === 'PENDING'

  const run = async () => {
    try {
      await start.mutateAsync(DEFAULT_EXPERIMENT_INPUT)
    } catch (error) {
      notify(
        error instanceof Error ? describeError(error) : 'Ocorreu um erro inesperado.',
        'danger',
      )
    }
  }

  const header = (
    <div className={styles.heading}>
      <h1>Experimentos</h1>
      <p className={styles.setup}>
        {experiment
          ? describeSetup(experiment.instances, experiment.seeds)
          : describeSetup(DEFAULT_EXPERIMENT_INPUT.instances, DEFAULT_EXPERIMENT_INPUT.seeds)}
      </p>
      <Button onClick={run} loading={start.isPending || running}>
        <Play size={16} aria-hidden="true" />
        Executar experimentos
      </Button>
    </div>
  )

  const notices = (
    <>
      {isMockMode() && (
        <p role="note" className={styles.notice}>
          Dados simulados pela API de desenvolvimento. Não representam o desempenho do algoritmo
          genético.
        </p>
      )}
      {running && experiment && (
        <div role="status" className={styles.progress}>
          <label htmlFor="experiment-progress">
            Executando {experiment.progress.completed} de {experiment.progress.total} execuções…
          </label>
          <progress
            id="experiment-progress"
            value={experiment.progress.completed}
            max={experiment.progress.total}
          />
        </div>
      )}
      {experiment?.status === 'FAILED' && (
        <ErrorMessage message={experiment.errorMessage ?? 'O experimento falhou.'} />
      )}
    </>
  )

  if (latest.isPending) {
    return (
      <div className={styles.page}>
        {header}
        <div role="status" className={styles.loading}>
          <VisuallyHidden>Carregando experimentos</VisuallyHidden>
          <Skeleton height="100%" />
        </div>
      </div>
    )
  }

  if (latest.isError) {
    return (
      <div className={styles.page}>
        {header}
        <ErrorMessage message={describeError(latest.error)} onRetry={() => latest.refetch()} />
      </div>
    )
  }

  if (!experiment) {
    return (
      <div className={styles.page}>
        {header}
        <Card>
          <EmptyState
            title="Nenhum experimento executado"
            description="Execute os experimentos para comparar a convergência e a emissão por instância."
          />
        </Card>
      </div>
    )
  }

  const table = <ExperimentResultsTable runs={experiment.runs} />
  const convergence = <ConvergenceChart runs={experiment.runs} />
  const emissions = <EmissionsChart runs={experiment.runs} />

  return (
    <div className={styles.page}>
      {header}
      {notices}
      {isDesktop ? (
        <div className={styles.workspace}>
          {table}
          <div className={styles.charts}>
            {convergence}
            {emissions}
          </div>
        </div>
      ) : (
        <Tabs
          label="Seções dos experimentos"
          className={styles.tabs}
          items={[
            {
              id: 'table',
              label: 'Resultados',
              content: <div className={styles.fill}>{table}</div>,
            },
            {
              id: 'convergence',
              label: 'Convergência',
              content: <div className={styles.fill}>{convergence}</div>,
            },
            {
              id: 'emissions',
              label: 'Emissões',
              content: <div className={styles.fill}>{emissions}</div>,
            },
          ]}
        />
      )}
    </div>
  )
}
