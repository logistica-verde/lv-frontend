import type { CriterionResult, ExperimentRun } from '@/services/schemas/experiment'

const GENERATIONS = 60
const MIN_EMISSION_GAIN = 0.03
const EMISSION_GAIN_RANGE = 0.12
const MAX_EXTRA_DISTANCE = 0.06

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function convergenceCurve(final: number, random: () => number): number[] {
  const start = final * (1.3 + random() * 0.25)
  const decay = 7 + random() * 5
  let best = start
  return Array.from({ length: GENERATIONS }, (_, generation) => {
    const target = final + (start - final) * Math.exp((-decay * generation) / GENERATIONS)
    best = Math.max(final, Math.min(best, target * (1 + (random() - 0.5) * 0.01)))
    return generation === GENERATIONS - 1 ? final : round(best, 3)
  })
}

function criterionResult(
  emissionKg: number,
  distanceMeters: number,
  executionMs: number,
  fitness: number,
  random: () => number,
): CriterionResult {
  return {
    emissionKg: round(emissionKg, 3),
    distanceMeters: round(distanceMeters, 1),
    executionMs: Math.round(executionMs),
    convergence: convergenceCurve(round(fitness, 3), random),
  }
}

export function generateRun(instanceSize: number, seed: number): ExperimentRun {
  const random = createRandom(seed * 1009 + instanceSize)
  const distanceMeters = 2200 * instanceSize ** 0.95 * (0.92 + random() * 0.16)
  const emissionKg = (distanceMeters / 1000) * (0.85 + random() * 0.1)
  const gain = MIN_EMISSION_GAIN + random() * EMISSION_GAIN_RANGE
  const extraDistance = random() * MAX_EXTRA_DISTANCE
  const baseMs = 90 * instanceSize ** 1.3

  const distanceRun = criterionResult(
    emissionKg,
    distanceMeters,
    baseMs * (0.9 + random() * 0.2),
    distanceMeters,
    random,
  )
  const emissionRunEmission = emissionKg * (1 - gain)
  const emissionRun = criterionResult(
    emissionRunEmission,
    distanceMeters * (1 + extraDistance),
    baseMs * (1 + random() * 0.25),
    emissionRunEmission,
    random,
  )

  return { instanceSize, seed, emission: emissionRun, distance: distanceRun }
}
