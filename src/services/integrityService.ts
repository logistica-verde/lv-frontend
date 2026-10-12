import { request } from '@/services/http'
import { integrityReportSchema } from '@/services/schemas/integrity'
import type { IntegrityReport } from '@/services/schemas/integrity'

export function getIntegrity(routeId: number, signal?: AbortSignal): Promise<IntegrityReport> {
  return request(`/api/routes/${routeId}/integrity`, integrityReportSchema, { signal })
}
