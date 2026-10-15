import { Check, X } from 'lucide-react'
import { meanEmissionSaving, slowestExecutionMs } from '@/lib/experimentStats'
import { formatNumber } from '@/lib/format'
import styles from '@/pages/ExperimentsPage/ExperimentKpis.module.css'
import type { Experiment } from '@/services/schemas/experiment'

export const MIN_EMISSION_SAVING_PERCENT = 5
export const MAX_EXECUTION_SECONDS = 60

type ExperimentKpisProps = {
  experiment: Experiment
}

type GoalProps = {
  met: boolean | null
  target: string
}

function Goal({ met, target }: GoalProps) {
  if (met === null) {
    return <span className={styles.goal}>{target}</span>
  }
  return (
    <span className={met ? styles.met : styles.missed}>
      {met ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
      {target} · {met ? 'meta atingida' : 'meta não atingida'}
    </span>
  )
}

export default function ExperimentKpis({ experiment }: ExperimentKpisProps) {
  const saving = meanEmissionSaving(experiment.runs)
  const slowest = slowestExecutionMs(experiment.runs)
  const slowestSeconds = slowest === null ? null : slowest / 1000
  const sizes = new Set(experiment.runs.map((run) => run.instanceSize)).size

  return (
    <dl className={styles.kpis}>
      <div className={styles.kpi}>
        <dt>Redução média de emissão</dt>
        <dd className={styles.value}>{saving === null ? '—' : `${formatNumber(saving)}%`}</dd>
        <dd>
          <Goal
            met={saving === null ? null : saving >= MIN_EMISSION_SAVING_PERCENT}
            target={`Meta: ≥ ${MIN_EMISSION_SAVING_PERCENT}%`}
          />
        </dd>
      </div>
      <div className={styles.kpi}>
        <dt>Maior tempo de execução</dt>
        <dd className={styles.value}>
          {slowestSeconds === null ? '—' : `${formatNumber(slowestSeconds)} s`}
        </dd>
        <dd>
          <Goal
            met={slowestSeconds === null ? null : slowestSeconds < MAX_EXECUTION_SECONDS}
            target={`Meta: < ${MAX_EXECUTION_SECONDS} s`}
          />
        </dd>
      </div>
      <div className={styles.kpi}>
        <dt>Execuções concluídas</dt>
        <dd className={styles.value}>{experiment.runs.length}</dd>
        <dd>
          <span className={styles.goal}>de {experiment.progress.total} previstas</span>
        </dd>
      </div>
      <div className={styles.kpi}>
        <dt>Instâncias avaliadas</dt>
        <dd className={styles.value}>{sizes}</dd>
        <dd>
          <span className={styles.goal}>
            {experiment.seeds.length} {experiment.seeds.length === 1 ? 'semente' : 'sementes'} cada
          </span>
        </dd>
      </div>
    </dl>
  )
}
