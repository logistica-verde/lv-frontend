const decimalFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function formatNumber(value: number): string {
  return decimalFormat.format(value)
}

export function formatKilometers(meters: number): string {
  return decimalFormat.format(meters / 1000)
}
