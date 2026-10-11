import { useState } from 'react'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'
import Table, { Td, Th } from '@/components/Table/Table'
import { formatKilometers, formatNumber } from '@/lib/format'
import type { Route } from '@/services/schemas/route'

type SegmentsTableProps = {
  emissionRoute: Route
  distanceRoute: Route
}

type Criterion = 'emission' | 'distance'

const OPTIONS: { value: Criterion; label: string }[] = [
  { value: 'emission', label: 'Menor emissão' },
  { value: 'distance', label: 'Menor distância' },
]

const MISSING = '—'

export default function SegmentsTable({ emissionRoute, distanceRoute }: SegmentsTableProps) {
  const [criterion, setCriterion] = useState<Criterion>('emission')
  const route = criterion === 'emission' ? emissionRoute : distanceRoute
  const names = new Map(route.points.map((point) => [point.pointId, point.name]))
  const nameOf = (pointId: number) => names.get(pointId) ?? `Ponto ${pointId}`

  return (
    <Card
      title="Trechos"
      actions={
        <SegmentedControl
          legend="Rota exibida na tabela de trechos"
          options={OPTIONS}
          value={criterion}
          onChange={setCriterion}
        />
      }
    >
      {route.segments.length === 0 ? (
        <EmptyState
          title="Sem trechos detalhados"
          description="A API não devolveu os trechos desta rota."
        />
      ) : (
        <Table caption="Trechos da rota selecionada" maxHeight="24rem">
          <thead>
            <tr>
              <Th numeric>Nº</Th>
              <Th>Trecho</Th>
              <Th numeric>Distância (km)</Th>
              <Th numeric>Velocidade média (km/h)</Th>
              <Th numeric>Declividade (%)</Th>
              <Th numeric>Emissão (kg CO₂)</Th>
            </tr>
          </thead>
          <tbody>
            {route.segments.map((segment, index) => (
              <tr key={`${segment.fromPointId}-${segment.toPointId}`}>
                <Td numeric>{index + 1}</Td>
                <Td>
                  {nameOf(segment.fromPointId)} → {nameOf(segment.toPointId)}
                </Td>
                <Td numeric>{formatKilometers(segment.distanceMeters)}</Td>
                <Td numeric>{formatNumber(segment.averageSpeedKmh)}</Td>
                <Td numeric>{formatNumber(segment.slopePercent)}</Td>
                <Td numeric>{formatNumber(segment.emissionKg)}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <Th scope="row" colSpan={2}>
                Total
              </Th>
              <Td numeric>
                {route.totalDistanceMeters === null
                  ? MISSING
                  : formatKilometers(route.totalDistanceMeters)}
              </Td>
              <Td numeric>{MISSING}</Td>
              <Td numeric>{MISSING}</Td>
              <Td numeric>
                {route.totalEmissionKg === null ? MISSING : formatNumber(route.totalEmissionKg)}
              </Td>
            </tr>
          </tfoot>
        </Table>
      )}
    </Card>
  )
}
