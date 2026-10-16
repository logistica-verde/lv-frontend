import { formatNumber } from '@/lib/format'
import type { ExperimentRun } from '@/services/schemas/experiment'

export type Criterion = 'emission' | 'distance'

export type InstanceAverage = {
  instanceSize: number
  runs: number
  distanceRoute: number
  emissionRoute: number
}

export type ConvergencePoint = {
  generation: number
  fitness: number
}

export function runKey(run: Pick<ExperimentRun, 'instanceSize' | 'seed'>): string {
  return `${run.instanceSize}-${run.seed}`
}

export function emissionSavingPercent(run: ExperimentRun): number | null {
  if (run.distance.emissionKg === 0) {
    return null
  }
  return ((run.distance.emissionKg - run.emission.emissionKg) / run.distance.emissionKg) * 100
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function averageByInstance(runs: ExperimentRun[]): InstanceAverage[] {
  const sizes = Array.from(new Set(runs.map((run) => run.instanceSize))).sort(
    (first, second) => first - second,
  )
  return sizes.map((instanceSize) => {
    const group = runs.filter((run) => run.instanceSize === instanceSize)
    return {
      instanceSize,
      runs: group.length,
      distanceRoute: mean(group.map((run) => run.distance.emissionKg)),
      emissionRoute: mean(group.map((run) => run.emission.emissionKg)),
    }
  })
}

export function convergenceSeries(run: ExperimentRun, criterion: Criterion): ConvergencePoint[] {
  const raw = run[criterion].convergence
  const scale = criterion === 'distance' ? 1000 : 1
  return raw.map((fitness, index) => ({ generation: index + 1, fitness: fitness / scale }))
}

export function convergenceUnit(criterion: Criterion): string {
  return criterion === 'distance' ? 'km' : 'kg CO₂'
}

export function describeConvergence(series: ConvergencePoint[], unit: string): string {
  const first = series[0]
  const last = series[series.length - 1]
  if (!first || !last) {
    return 'Sem dados de convergência.'
  }
  return `A melhor aptidão vai de ${formatNumber(first.fitness)} ${unit} na geração ${first.generation} a ${formatNumber(last.fitness)} ${unit} na geração ${last.generation}.`
}

export type InstanceSummary = {
  instanceSize: number
  runs: number
  distanceRoute: { distanceMeters: number; emissionKg: number }
  emissionRoute: { distanceMeters: number; emissionKg: number; executionMs: number }
  savingPercent: number | null
}

export function summarizeByInstance(runs: ExperimentRun[]): InstanceSummary[] {
  const sizes = Array.from(new Set(runs.map((run) => run.instanceSize))).sort(
    (first, second) => first - second,
  )
  return sizes.map((instanceSize) => {
    const group = runs.filter((run) => run.instanceSize === instanceSize)
    const distanceEmission = mean(group.map((run) => run.distance.emissionKg))
    const emissionEmission = mean(group.map((run) => run.emission.emissionKg))
    return {
      instanceSize,
      runs: group.length,
      distanceRoute: {
        distanceMeters: mean(group.map((run) => run.distance.distanceMeters)),
        emissionKg: distanceEmission,
      },
      emissionRoute: {
        distanceMeters: mean(group.map((run) => run.emission.distanceMeters)),
        emissionKg: emissionEmission,
        executionMs: mean(group.map((run) => run.emission.executionMs)),
      },
      savingPercent:
        distanceEmission === 0
          ? null
          : ((distanceEmission - emissionEmission) / distanceEmission) * 100,
    }
  })
}

export function meanEmissionSaving(runs: ExperimentRun[]): number | null {
  const savings = runs
    .map(emissionSavingPercent)
    .filter((saving): saving is number => saving !== null)
  return savings.length === 0 ? null : mean(savings)
}

export function slowestExecutionMs(runs: ExperimentRun[]): number | null {
  if (runs.length === 0) {
    return null
  }
  return Math.max(...runs.flatMap((run) => [run.emission.executionMs, run.distance.executionMs]))
}
