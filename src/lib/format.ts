const decimalFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function formatNumber(value: number): string {
  return decimalFormat.format(value)
}
