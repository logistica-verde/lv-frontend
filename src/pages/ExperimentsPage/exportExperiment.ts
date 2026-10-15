import { emissionSavingPercent } from '@/lib/experimentStats'
import { toCsv } from '@/lib/exportCsv'
import type { ExperimentRun } from '@/services/schemas/experiment'

export function experimentCsv(runs: ExperimentRun[]): string {
  return toCsv(
    [
      'Pontos',
      'Semente',
      'Distância menor distância (km)',
      'Emissão menor distância (kg CO₂)',
      'Tempo menor distância (ms)',
      'Distância menor emissão (km)',
      'Emissão menor emissão (kg CO₂)',
      'Tempo menor emissão (ms)',
      'Redução de emissão (%)',
    ],
    runs.map((run) => {
      const saving = emissionSavingPercent(run)
      return [
        run.instanceSize,
        run.seed,
        run.distance.distanceMeters / 1000,
        run.distance.emissionKg,
        run.distance.executionMs,
        run.emission.distanceMeters / 1000,
        run.emission.emissionKg,
        run.emission.executionMs,
        saving,
      ]
    }),
  )
}
