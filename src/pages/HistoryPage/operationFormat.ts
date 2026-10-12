import { formatKilometers, formatNumber } from '@/lib/format'
import type { OperationSummary } from '@/services/schemas/operation'

const MISSING = '—'

export const CRITERION_LABELS = { EMISSION: 'Menor emissão', DISTANCE: 'Menor distância' } as const

export const OPERATION_STATUS = {
  PENDING: { tone: 'info', label: 'Calculando' },
  FAILED: { tone: 'danger', label: 'Falhou' },
} as const

export function formatOperationEmission(item: OperationSummary): string {
  return item.totalEmissionKg === null ? MISSING : formatNumber(item.totalEmissionKg)
}

export function formatOperationDistance(item: OperationSummary): string {
  return item.totalDistanceMeters === null ? MISSING : formatKilometers(item.totalDistanceMeters)
}
