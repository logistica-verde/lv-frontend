import { z } from 'zod'

export const problemDetailSchema = z.object({
  title: z.string().optional(),
  status: z.number().optional(),
  detail: z.string().optional(),
})

export type ProblemDetail = z.infer<typeof problemDetailSchema>
