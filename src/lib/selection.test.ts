import { describe, expect, it } from 'vitest'
import {
  describeSelection,
  isSelectionReady,
  MAX_SELECTED_POINTS,
  toggleSelection,
} from '@/lib/selection'

const manyIds = Array.from({ length: MAX_SELECTED_POINTS }, (_, index) => index + 1)

describe('toggleSelection', () => {
  it('adds a point that is not selected', () => {
    expect(toggleSelection([1, 2], 3)).toEqual([1, 2, 3])
  })

  it('removes a point that is already selected', () => {
    expect(toggleSelection([1, 2, 3], 2)).toEqual([1, 3])
  })

  it('does not change the original list', () => {
    const original = [1]

    toggleSelection(original, 2)

    expect(original).toEqual([1])
  })

  it('refuses to go past the maximum', () => {
    expect(toggleSelection(manyIds, 999)).toEqual(manyIds)
  })

  it('still lets the user unselect at the maximum', () => {
    expect(toggleSelection(manyIds, 1)).toHaveLength(MAX_SELECTED_POINTS - 1)
  })
})

describe('isSelectionReady', () => {
  it.each([
    [0, false],
    [1, false],
    [2, true],
    [30, true],
    [31, false],
  ])('for %i points is %s', (count, expected) => {
    expect(isSelectionReady(count)).toBe(expected)
  })
})

describe('describeSelection', () => {
  it('explains the limits when nothing is selected', () => {
    expect(describeSelection(0)).toBe('Selecione de 2 a 30 pontos para calcular a rota.')
  })

  it('asks for more points while below the minimum', () => {
    expect(describeSelection(1)).toBe('1 ponto selecionado. Selecione pelo menos 2.')
  })

  it('just counts when the selection is valid', () => {
    expect(describeSelection(5)).toBe('5 pontos selecionados.')
  })

  it('warns when the maximum is reached', () => {
    expect(describeSelection(30)).toBe('30 pontos selecionados. Limite máximo atingido.')
  })
})
