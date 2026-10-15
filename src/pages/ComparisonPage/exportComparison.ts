import { toCsv } from '@/lib/exportCsv'
import type { Route } from '@/services/schemas/route'

const CRITERION_LABELS = { EMISSION: 'Menor emissão', DISTANCE: 'Menor distância' } as const

export function comparisonCsv(routes: Route[]): string {
  const rows = routes.flatMap((route) => {
    const names = new Map(route.points.map((point) => [point.pointId, point.name]))
    const nameOf = (pointId: number) => names.get(pointId) ?? `Ponto ${pointId}`
    return route.segments.map((segment, index) => [
      route.id,
      CRITERION_LABELS[route.criterion],
      index + 1,
      nameOf(segment.fromPointId),
      nameOf(segment.toPointId),
      segment.distanceMeters / 1000,
      segment.averageSpeedKmh,
      segment.slopePercent,
      segment.emissionKg,
    ])
  })
  return toCsv(
    [
      'Operação',
      'Critério',
      'Nº',
      'De',
      'Para',
      'Distância (km)',
      'Velocidade média (km/h)',
      'Declividade (%)',
      'Emissão (kg CO₂)',
    ],
    rows,
  )
}
