import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { averageByInstance } from '@/lib/experimentStats'
import { formatNumber } from '@/lib/format'
import styles from '@/pages/ExperimentsPage/ExperimentsPage.module.css'
import { CHART_STYLE } from '@/pages/ExperimentsPage/chartStyle'
import type { ExperimentRun } from '@/services/schemas/experiment'

type EmissionsChartProps = {
  runs: ExperimentRun[]
}

export default function EmissionsChart({ runs }: EmissionsChartProps) {
  const averages = averageByInstance(runs)
  const summary = averages
    .map(
      (item) =>
        `${item.instanceSize} pontos: ${formatNumber(item.distanceRoute)} kg CO₂ na menor distância e ${formatNumber(item.emissionRoute)} kg CO₂ na menor emissão`,
    )
    .join('; ')

  return (
    <Card title="Emissão por instância" fill>
      {averages.length === 0 ? (
        <EmptyState
          title="Sem execuções"
          description="O gráfico aparece quando a primeira execução termina."
        />
      ) : (
        <>
          <div
            role="img"
            aria-label="Gráfico de barras: emissão média em kg de CO₂ por número de pontos, nos dois critérios"
            aria-describedby="emissions-summary"
            className={styles.chart}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 480, height: 200 }}
            >
              <BarChart data={averages} margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
                <CartesianGrid stroke={CHART_STYLE.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="instanceSize"
                  tick={CHART_STYLE.tick}
                  tickLine={false}
                  stroke={CHART_STYLE.axis}
                  tickFormatter={(value: number) => `${value} pts`}
                />
                <YAxis
                  tick={CHART_STYLE.tick}
                  tickLine={false}
                  stroke={CHART_STYLE.axis}
                  width={64}
                  label={{
                    value: 'kg CO₂ (média)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 8,
                    ...CHART_STYLE.label,
                  }}
                  tickFormatter={(value: number) => formatNumber(value)}
                />
                <Tooltip
                  contentStyle={CHART_STYLE.tooltip}
                  cursor={{ fill: 'var(--color-surface-muted)' }}
                  formatter={(value, name) => [
                    `${formatNumber(Number(value))} kg CO₂`,
                    String(name),
                  ]}
                  labelFormatter={(label) => `${label} pontos`}
                />
                <Legend verticalAlign="top" height={28} wrapperStyle={CHART_STYLE.legend} />
                <Bar
                  dataKey="distanceRoute"
                  name="Menor distância"
                  fill={CHART_STYLE.distance}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="emissionRoute"
                  name="Menor emissão"
                  fill={CHART_STYLE.emission}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <VisuallyHidden>
            <span id="emissions-summary">{summary}</span>
          </VisuallyHidden>
        </>
      )}
    </Card>
  )
}
