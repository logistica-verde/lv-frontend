import Card from '@/components/Card/Card'
import Table, { Td, Th } from '@/components/Table/Table'
import { summarizeByInstance } from '@/lib/experimentStats'
import { formatKilometers, formatNumber, formatSignedPercent } from '@/lib/format'
import styles from '@/pages/ExperimentsPage/ExperimentsPage.module.css'
import type { ExperimentRun } from '@/services/schemas/experiment'

type InstanceSummaryTableProps = {
  runs: ExperimentRun[]
}

export default function InstanceSummaryTable({ runs }: InstanceSummaryTableProps) {
  if (runs.length === 0) {
    return null
  }

  return (
    <Card title="Média por instância">
      <Table dense caption="Média das execuções de cada instância, por critério">
        <thead>
          <tr>
            <Th rowSpan={2} numeric>
              Pontos
            </Th>
            <Th colSpan={2} scope="colgroup" className={styles.group}>
              Menor distância (média)
            </Th>
            <Th colSpan={3} scope="colgroup" className={styles.group}>
              Menor emissão (média)
            </Th>
            <Th rowSpan={2} numeric>
              Δ emissão
            </Th>
          </tr>
          <tr>
            <Th numeric>Distância (km)</Th>
            <Th numeric>Emissão (kg CO₂)</Th>
            <Th numeric>Distância (km)</Th>
            <Th numeric>Emissão (kg CO₂)</Th>
            <Th numeric>Tempo (s)</Th>
          </tr>
        </thead>
        <tbody>
          {summarizeByInstance(runs).map((summary) => (
            <tr key={summary.instanceSize}>
              <Td numeric>{summary.instanceSize}</Td>
              <Td numeric>{formatKilometers(summary.distanceRoute.distanceMeters)}</Td>
              <Td numeric>{formatNumber(summary.distanceRoute.emissionKg)}</Td>
              <Td numeric>{formatKilometers(summary.emissionRoute.distanceMeters)}</Td>
              <Td numeric>{formatNumber(summary.emissionRoute.emissionKg)}</Td>
              <Td numeric>{formatNumber(summary.emissionRoute.executionMs / 1000)}</Td>
              <Td numeric className={styles.saving}>
                {formatSignedPercent(
                  summary.savingPercent === null ? null : -summary.savingPercent,
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}
