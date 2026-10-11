import { z } from 'zod'

export const gaSettingsSchema = z.object({
  populationSize: z
    .number('Informe o tamanho da população')
    .int('Use um número inteiro')
    .min(10, 'Use ao menos 10 indivíduos')
    .max(500, 'Use no máximo 500 indivíduos'),
  generations: z
    .number('Informe o número de gerações')
    .int('Use um número inteiro')
    .min(10, 'Use ao menos 10 gerações')
    .max(1000, 'Use no máximo 1000 gerações'),
  crossoverRate: z
    .number('Informe a taxa de cruzamento')
    .min(0, 'Use um valor entre 0 e 1')
    .max(1, 'Use um valor entre 0 e 1'),
  mutationRate: z
    .number('Informe a taxa de mutação')
    .min(0, 'Use um valor entre 0 e 1')
    .max(1, 'Use um valor entre 0 e 1'),
})

export type GaSettings = z.infer<typeof gaSettingsSchema>

export const DEFAULT_GA_SETTINGS: GaSettings = {
  populationSize: 100,
  generations: 200,
  crossoverRate: 0.8,
  mutationRate: 0.05,
}
