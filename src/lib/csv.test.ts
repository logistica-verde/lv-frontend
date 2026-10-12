import { describe, expect, it } from 'vitest'
import { CSV_TEMPLATE, MAX_CSV_ROWS, parseDeliveryPointsCsv } from '@/lib/csv'

describe('parseDeliveryPointsCsv', () => {
  it('reads points separated by commas', () => {
    const result = parseDeliveryPointsCsv(
      'nome,endereco,latitude,longitude\nPraça da Sé,"Praça da Sé, Sé",-23.5505,-46.6333\nMASP,,-23.5614,-46.6559\n',
    )

    expect(result.errors).toEqual([])
    expect(result.points).toEqual([
      { nome: 'Praça da Sé', endereco: 'Praça da Sé, Sé', latitude: -23.5505, longitude: -46.6333 },
      { nome: 'MASP', endereco: undefined, latitude: -23.5614, longitude: -46.6559 },
    ])
  })

  it('reads the Brazilian spreadsheet format with semicolons and decimal commas', () => {
    const result = parseDeliveryPointsCsv(
      'nome;endereco;latitude;longitude\nMASP;;-23,5614;-46,6559',
    )

    expect(result.errors).toEqual([])
    expect(result.points).toEqual([
      { nome: 'MASP', endereco: undefined, latitude: -23.5614, longitude: -46.6559 },
    ])
  })

  it('accepts the downloadable template as it is', () => {
    const result = parseDeliveryPointsCsv(CSV_TEMPLATE)

    expect(result.errors).toEqual([])
    expect(result.points).toHaveLength(1)
  })

  it('ignores accents, case, column order, aliases and the byte order mark', () => {
    const result = parseDeliveryPointsCsv(
      '\uFEFFLAT,LNG,Endereço,NOME\n-23.55,-46.63,Rua X,Ponto 1',
    )

    expect(result.errors).toEqual([])
    expect(result.points).toEqual([
      { nome: 'Ponto 1', endereco: 'Rua X', latitude: -23.55, longitude: -46.63 },
    ])
  })

  it('handles Windows line endings and skips blank lines', () => {
    const result = parseDeliveryPointsCsv(
      'nome,latitude,longitude\r\n\r\nA,-23.5,-46.6\r\n\r\nB,-23.6,-46.7\r\n',
    )

    expect(result.points.map((point) => point.nome)).toEqual(['A', 'B'])
  })

  it('keeps quoted commas and escaped quotes inside a cell', () => {
    const result = parseDeliveryPointsCsv(
      'nome,latitude,longitude\n"Loja ""Central"", filial 2",-23.5,-46.6',
    )

    expect(result.points[0]?.nome).toBe('Loja "Central", filial 2')
  })

  it('reports each invalid line with its number and keeps the valid ones', () => {
    const result = parseDeliveryPointsCsv(
      'nome,latitude,longitude\nA,-23.5,-46.6\n,-23.5,-46.6\nC,95,-46.6\nD,abc,-46.6\nE,-23.5,-46.6',
    )

    expect(result.points.map((point) => point.nome)).toEqual(['A', 'E'])
    expect(result.errors).toEqual([
      { line: 3, message: 'Informe o nome' },
      { line: 4, message: 'Latitude máxima: 90' },
      { line: 5, message: 'Informe a latitude' },
    ])
  })

  it('explains a header without the required columns', () => {
    const result = parseDeliveryPointsCsv('local,x,y\nA,1,2')

    expect(result.points).toEqual([])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toContain('faltam as colunas nome, latitude, longitude')
  })

  it('reports an empty file', () => {
    expect(parseDeliveryPointsCsv('  \n\n').errors).toEqual([
      { line: 1, message: 'O arquivo está vazio.' },
    ])
  })

  it('refuses files with too many rows instead of importing part of them', () => {
    const rows = Array.from({ length: MAX_CSV_ROWS + 1 }, () => 'A,-23.5,-46.6').join('\n')

    const result = parseDeliveryPointsCsv(`nome,latitude,longitude\n${rows}`)

    expect(result.points).toEqual([])
    expect(result.errors[0]?.message).toContain(`mais de ${MAX_CSV_ROWS} linhas`)
  })
})
