import { z } from 'zod'

export const integrityStatusSchema = z.enum(['VALID', 'TAMPERED', 'NOT_ANCHORED', 'ANCHOR_FAILED'])

export const integrityReportSchema = z.object({
  operationId: z.number(),
  status: integrityStatusSchema,
  databaseHash: z.string(),
  ledgerHash: z.string().nullable(),
  txHash: z.string().nullable(),
  blockNumber: z.number().nullable(),
  anchoredAt: z.string().nullable(),
})

export type IntegrityStatus = z.infer<typeof integrityStatusSchema>
export type IntegrityReport = z.infer<typeof integrityReportSchema>
