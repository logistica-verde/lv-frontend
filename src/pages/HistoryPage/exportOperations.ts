import { toCsv } from '@/lib/exportCsv'
import { CRITERION_LABELS } from '@/pages/HistoryPage/operationFormat'
import { listOperations } from '@/services/operationService'
import type { OperationQuery } from '@/services/operationService'
import type { OperationSummary } from '@/services/schemas/operation'

const EXPORT_PAGE_SIZE = 100
const EXPORT_MAX_PAGES = 20

const INTEGRITY_LABELS = {
  VALID: 'Íntegra',
  TAMPERED: 'Alterada',
  NOT_ANCHORED: 'Aguardando registro',
} as const

export async function fetchAllOperations(
  query: Omit<OperationQuery, 'page' | 'size'>,
): Promise<OperationSummary[]> {
  const items: OperationSummary[] = []
  for (let page = 1; page <= EXPORT_MAX_PAGES; page += 1) {
    const result = await listOperations({ ...query, page, size: EXPORT_PAGE_SIZE })
    items.push(...result.items)
    if (items.length >= result.total || result.items.length === 0) {
      break
    }
  }
  return items
}

export function operationsCsv(items: OperationSummary[]): string {
  return toCsv(
    [
      'Operação',
      'Data e hora',
      'Placa',
      'Critério',
      'Pontos',
      'Distância (km)',
      'Emissão (kg CO₂)',
      'Integridade',
    ],
    items.map((item) => [
      item.id,
      item.createdAt,
      item.vehiclePlate,
      CRITERION_LABELS[item.criterion],
      item.pointCount,
      item.totalDistanceMeters === null ? null : item.totalDistanceMeters / 1000,
      item.totalEmissionKg,
      INTEGRITY_LABELS[item.integrityStatus],
    ]),
  )
}
