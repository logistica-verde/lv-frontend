import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'
import SelectField from '@/components/SelectField/SelectField'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import {
  convergenceSeries,
  convergenceUnit,
  describeConvergence,
  runKey,
} from '@/lib/experimentStats'
import type { Criterion } from '@/lib/experimentStats'
import { formatNumber } from '@/lib/format'
import styles from '@/pages/ExperimentsPage/ExperimentsPage.module.css'
import { CHART_STYLE } from '@/pages/ExperimentsPage/chartStyle'
import type { ExperimentRun } from '@/services/schemas/experiment'

type ConvergenceChartProps = {
  runs: ExperimentRun[]
}

const CRITERIA: { value: Criterion; label: string }[] = [
  { value: 'emission', label: 'Menor emissão' },
  { value: 'distance', label: 'Menor distância' },
]

export default function ConvergenceChart({ runs }: ConvergenceChartProps) {
  const [chosenKey, setChosenKey] = useState<string | null>(null)
  const [criterion, setCriterion] = useState<Criterion>('emission')

  const run = runs.find((candidate) => runKey(candidate) === chosenKey) ?? runs[0]
  const unit = convergenceUnit(criterion)
  const series = run ? convergenceSeries(run, criterion) : []
  const summary = describeConvergence(series, unit)

  return (
    <Card title="Convergência do algoritmo genético" fill>
      {!run ? (
        <EmptyState
          title="Sem execuções"
          description="A convergência aparece quando a primeira execução termina."
        />
      ) : (
        <>
          <div className={styles.chartControls}>
            <SelectField
              label="Execução"
              value={runKey(run)}
              onChange={(event) => setChosenKey(event.target.value)}
            >
              {runs.map((candidate) => (
                <option key={runKey(candidate)} value={runKey(candidate)}>
                  {`${candidate.instanceSize} pontos · semente ${candidate.seed}`}
                </option>
              ))}
            </SelectField>
            <SegmentedControl
              legend="Critério da curva de convergência"
              options={CRITERIA}
              value={criterion}
              onChange={setCriterion}
            />
          </div>
          <div
            role="img"
            aria-label={`Gráfico de convergência: melhor aptidão (${unit}) por geração`}
            aria-describedby="convergence-summary"
            className={styles.chart}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 480, height: 200 }}
            >
              <LineChart data={series} margin={{ top: 8, right: 16, bottom: 16, left: 4 }}>
                <CartesianGrid stroke={CHART_STYLE.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="generation"
                  tick={CHART_STYLE.tick}
                  tickLine={false}
                  stroke={CHART_STYLE.axis}
                  label={{
                    value: 'Geração',
                    position: 'insideBottom',
                    offset: -8,
                    ...CHART_STYLE.label,
                  }}
                />
                <YAxis
                  tick={CHART_STYLE.tick}
                  tickLine={false}
                  stroke={CHART_STYLE.axis}
                  domain={['auto', 'auto']}
                  width={64}
                  label={{
                    value: unit,
                    angle: -90,
                    position: 'insideLeft',
                    offset: 8,
                    ...CHART_STYLE.label,
                  }}
                  tickFormatter={(value: number) => formatNumber(value)}
                />
                <Tooltip
                  contentStyle={CHART_STYLE.tooltip}
                  formatter={(value) => [`${formatNumber(Number(value))} ${unit}`, 'Aptidão']}
                  labelFormatter={(label) => `Geração ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="fitness"
                  stroke={criterion === 'emission' ? CHART_STYLE.emission : CHART_STYLE.distance}
                  strokeDasharray={criterion === 'emission' ? undefined : '8 6'}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <VisuallyHidden>
            <span id="convergence-summary">{summary}</span>
          </VisuallyHidden>
        </>
      )}
    </Card>
  )
}
