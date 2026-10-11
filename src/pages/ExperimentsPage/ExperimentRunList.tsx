import { emissionSavingPercent, runKey } from '@/lib/experimentStats'
import { formatKilometers, formatNumber, formatSignedPercent } from '@/lib/format'
import styles from '@/pages/ExperimentsPage/ExperimentRunList.module.css'
import type { CriterionResult, ExperimentRun } from '@/services/schemas/experiment'

type ExperimentRunListProps = {
  runs: ExperimentRun[]
}

function describeResult(result: CriterionResult): string {
  return `${formatKilometers(result.distanceMeters)} km · ${formatNumber(result.emissionKg)} kg CO₂ · ${formatNumber(result.executionMs)} ms`
}

export default function ExperimentRunList({ runs }: ExperimentRunListProps) {
  return (
    <ol aria-label="Resultados de cada execução" className={styles.list}>
      {runs.map((run) => {
        const saving = emissionSavingPercent(run)
        return (
          <li key={runKey(run)} className={styles.item}>
            <p className={styles.title}>
              <span>
                {run.instanceSize} pontos · semente {run.seed}
              </span>
              <span className={styles.saving}>
                Δ emissão {formatSignedPercent(saving === null ? null : -saving)}
              </span>
            </p>
            <p className={styles.line}>
              <span className={styles.label}>Menor distância</span> {describeResult(run.distance)}
            </p>
            <p className={styles.line}>
              <span className={styles.label}>Menor emissão</span> {describeResult(run.emission)}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
