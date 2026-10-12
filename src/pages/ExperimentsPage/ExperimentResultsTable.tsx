import { useState } from 'react'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import Pagination from '@/components/Pagination/Pagination'
import Table, { Td, Th } from '@/components/Table/Table'
import { useFitRows } from '@/hooks/useFitRows'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { emissionSavingPercent, runKey } from '@/lib/experimentStats'
import { formatKilometers, formatNumber, formatSignedPercent } from '@/lib/format'
import ExperimentRunList from '@/pages/ExperimentsPage/ExperimentRunList'
import styles from '@/pages/ExperimentsPage/ExperimentsPage.module.css'
import type { ExperimentRun } from '@/services/schemas/experiment'

const ROW_PX = 33
const HEADER_PX = 76
const LIST_ROW_PX = 76
const FALLBACK_ROWS = 7
const DESKTOP_QUERY = '(min-width: 64rem)'

type ExperimentResultsTableProps = {
  runs: ExperimentRun[]
}

export default function ExperimentResultsTable({ runs }: ExperimentResultsTableProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const { ref, rows } = useFitRows(
    isDesktop ? ROW_PX : LIST_ROW_PX,
    FALLBACK_ROWS,
    isDesktop ? HEADER_PX : 0,
  )
  const [requestedPage, setRequestedPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(runs.length / rows))
  const page = Math.min(requestedPage, pageCount)
  const visible = runs.slice((page - 1) * rows, page * rows)

  return (
    <Card title="Resultados por execução" fill>
      <div ref={ref} className={styles.tableArea}>
        {runs.length === 0 ? (
          <EmptyState
            title="Sem execuções"
            description="Os resultados aparecem conforme cada execução termina."
          />
        ) : !isDesktop ? (
          <ExperimentRunList runs={visible} />
        ) : (
          <Table dense caption="Resultados de cada execução por instância e semente">
            <thead>
              <tr>
                <Th rowSpan={2} numeric>
                  Pontos
                </Th>
                <Th rowSpan={2} numeric>
                  Semente
                </Th>
                <Th colSpan={3} scope="colgroup" className={styles.group}>
                  Menor distância
                </Th>
                <Th colSpan={3} scope="colgroup" className={styles.group}>
                  Menor emissão
                </Th>
                <Th rowSpan={2} numeric>
                  Δ emissão
                </Th>
              </tr>
              <tr>
                <Th numeric>Distância (km)</Th>
                <Th numeric>Emissão (kg CO₂)</Th>
                <Th numeric>Tempo (ms)</Th>
                <Th numeric>Distância (km)</Th>
                <Th numeric>Emissão (kg CO₂)</Th>
                <Th numeric>Tempo (ms)</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((run) => {
                const saving = emissionSavingPercent(run)
                return (
                  <tr key={runKey(run)}>
                    <Td numeric>{run.instanceSize}</Td>
                    <Td numeric>{run.seed}</Td>
                    <Td numeric>{formatKilometers(run.distance.distanceMeters)}</Td>
                    <Td numeric>{formatNumber(run.distance.emissionKg)}</Td>
                    <Td numeric>{formatNumber(run.distance.executionMs)}</Td>
                    <Td numeric>{formatKilometers(run.emission.distanceMeters)}</Td>
                    <Td numeric>{formatNumber(run.emission.emissionKg)}</Td>
                    <Td numeric>{formatNumber(run.emission.executionMs)}</Td>
                    <Td numeric className={styles.saving}>
                      {formatSignedPercent(saving === null ? null : -saving)}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={setRequestedPage}
        label="Paginação das execuções"
      />
    </Card>
  )
}
