const SEPARATOR = ';'
const BOM = '﻿'

export type CsvCell = string | number | null | undefined

function formatCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) {
    return ''
  }
  const text =
    typeof cell === 'number'
      ? cell.toLocaleString('pt-BR', { useGrouping: false, maximumFractionDigits: 6 })
      : cell
  return /["\r\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(header: string[], rows: CsvCell[][]): string {
  const lines = [header, ...rows].map((row) => row.map(formatCell).join(SEPARATOR))
  return `${BOM}${lines.join('\r\n')}\r\n`
}

export function downloadCsv(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
