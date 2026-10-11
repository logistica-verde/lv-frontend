import { formatNumber } from '@/lib/format'

export type RouteTotals = {
  totalEmissionKg: number | null
  totalDistanceMeters: number | null
}

export function percentChange(base: number, value: number): number | null {
  if (base === 0) {
    return null
  }
  return ((value - base) / base) * 100
}

export function emissionSavingPercent(
  emissionRoute: RouteTotals,
  distanceRoute: RouteTotals,
): number | null {
  if (emissionRoute.totalEmissionKg === null || distanceRoute.totalEmissionKg === null) {
    return null
  }
  const change = percentChange(distanceRoute.totalEmissionKg, emissionRoute.totalEmissionKg)
  return change === null ? null : -change
}

export function extraDistancePercent(
  emissionRoute: RouteTotals,
  distanceRoute: RouteTotals,
): number | null {
  if (emissionRoute.totalDistanceMeters === null || distanceRoute.totalDistanceMeters === null) {
    return null
  }
  return percentChange(distanceRoute.totalDistanceMeters, emissionRoute.totalDistanceMeters)
}

export function describeEmissionComparison(saving: number | null): string {
  if (saving === null) {
    return 'Não foi possível calcular a diferença de emissão entre as rotas.'
  }
  const rounded = Math.round(Math.abs(saving) * 100) / 100
  if (rounded === 0) {
    return 'As duas rotas têm a mesma emissão de CO₂.'
  }
  if (saving > 0) {
    return `A rota de menor emissão emite ${formatNumber(rounded)}% menos CO₂ que a rota de menor distância.`
  }
  const relativeToEmissionRoute = Math.round((rounded / (100 + rounded)) * 10000) / 100
  return `Neste cenário, a rota de menor distância emite ${formatNumber(relativeToEmissionRoute)}% menos CO₂ que a rota de menor emissão.`
}

export function describeDistanceComparison(extra: number | null): string | null {
  if (extra === null) {
    return null
  }
  const rounded = Math.round(Math.abs(extra) * 100) / 100
  if (rounded === 0) {
    return 'As duas rotas percorrem a mesma distância.'
  }
  if (extra > 0) {
    return `Em troca, a rota de menor emissão percorre ${formatNumber(rounded)}% mais distância.`
  }
  return `Além disso, a rota de menor emissão percorre ${formatNumber(rounded)}% menos distância.`
}
