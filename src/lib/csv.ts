import { deliveryPointInputSchema } from '@/services/schemas/deliveryPoint'
import type { DeliveryPointInput } from '@/services/schemas/deliveryPoint'

export const MAX_CSV_ROWS = 100

export const CSV_TEMPLATE =
  'nome;endereco;latitude;longitude\nPraça da Sé;Praça da Sé, Sé;-23,5505;-46,6333\n'

export type CsvLineError = {
  line: number
  message: string
}

export type CsvParseResult = {
  points: DeliveryPointInput[]
  errors: CsvLineError[]
}

type Column = 'nome' | 'endereco' | 'latitude' | 'longitude'

const COLUMN_ALIASES: Record<string, Column> = {
  nome: 'nome',
  name: 'nome',
  endereco: 'endereco',
  address: 'endereco',
  latitude: 'latitude',
  lat: 'latitude',
  longitude: 'longitude',
  lng: 'longitude',
  lon: 'longitude',
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line.charAt(index)
    if (quoted) {
      if (character === '"' && line.charAt(index + 1) === '"') {
        current += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        current += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === delimiter) {
      cells.push(current)
      current = ''
    } else {
      current += character
    }
  }
  cells.push(current)
  return cells.map((cell) => cell.trim())
}

function detectDelimiter(headerLine: string): string {
  return headerLine.includes(';') ? ';' : ','
}

function toNumber(value: string | undefined, delimiter: string): number {
  if (value === undefined || value === '') {
    return Number.NaN
  }
  const text = delimiter === ';' ? value.replace(',', '.') : value
  return Number(text)
}

export function parseDeliveryPointsCsv(text: string): CsvParseResult {
  const lines = text.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/)
  const firstIndex = lines.findIndex((line) => line.trim() !== '')
  if (firstIndex === -1) {
    return { points: [], errors: [{ line: 1, message: 'O arquivo está vazio.' }] }
  }

  const delimiter = detectDelimiter(lines[firstIndex] ?? '')
  const header = splitLine(lines[firstIndex] ?? '', delimiter).map(
    (cell) => COLUMN_ALIASES[normalize(cell)],
  )
  const required: Column[] = ['nome', 'latitude', 'longitude']
  const missing = required.filter((column) => !header.includes(column))
  if (missing.length > 0) {
    return {
      points: [],
      errors: [
        {
          line: firstIndex + 1,
          message: `Cabeçalho inválido: faltam as colunas ${missing.join(', ')}. Use nome, endereco, latitude, longitude.`,
        },
      ],
    }
  }

  const dataLines = lines
    .map((line, index) => ({ line, number: index + 1 }))
    .slice(firstIndex + 1)
    .filter(({ line }) => line.trim() !== '')

  if (dataLines.length > MAX_CSV_ROWS) {
    return {
      points: [],
      errors: [
        {
          line: dataLines[MAX_CSV_ROWS]?.number ?? firstIndex + 1,
          message: `O arquivo tem mais de ${MAX_CSV_ROWS} linhas de dados.`,
        },
      ],
    }
  }

  const points: DeliveryPointInput[] = []
  const errors: CsvLineError[] = []
  dataLines.forEach(({ line, number }) => {
    const cells = splitLine(line, delimiter)
    const valueOf = (column: Column) => cells[header.indexOf(column)]
    const parsed = deliveryPointInputSchema.safeParse({
      nome: valueOf('nome') ?? '',
      endereco: valueOf('endereco') || undefined,
      latitude: toNumber(valueOf('latitude'), delimiter),
      longitude: toNumber(valueOf('longitude'), delimiter),
    })
    if (parsed.success) {
      points.push(parsed.data)
    } else {
      errors.push({ line: number, message: parsed.error.issues[0]?.message ?? 'Linha inválida.' })
    }
  })
  return { points, errors }
}
