const decimalFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

export function formatNumber(value: number): string {
  return decimalFormat.format(value)
}

export function formatKilometers(meters: number): string {
  return decimalFormat.format(meters / 1000)
}

export function formatDateTime(isoDate: string): string {
  return dateTimeFormat.format(new Date(isoDate))
}
