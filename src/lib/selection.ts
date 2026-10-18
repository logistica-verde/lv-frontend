export const MIN_SELECTED_POINTS = 2
export const MAX_SELECTED_POINTS = 30

export function toggleSelection(selected: number[], id: number): number[] {
  if (selected.includes(id)) {
    return selected.filter((selectedId) => selectedId !== id)
  }
  if (selected.length >= MAX_SELECTED_POINTS) {
    return selected
  }
  return [...selected, id]
}

export function moveSelection(selected: number[], id: number, offset: number): number[] {
  const from = selected.indexOf(id)
  const to = from + offset
  if (from === -1 || to < 0 || to >= selected.length) {
    return selected
  }
  const next = [...selected]
  next.splice(from, 1)
  next.splice(to, 0, id)
  return next
}

export function addToSelection(selected: number[], ids: number[]): number[] {
  const additions = ids.filter((id) => !selected.includes(id))
  return [...selected, ...additions].slice(0, MAX_SELECTED_POINTS)
}

export const MIN_SELECTED_POINTS_WITH_ORIGIN = 1

export function minimumPoints(hasOrigin: boolean): number {
  return hasOrigin ? MIN_SELECTED_POINTS_WITH_ORIGIN : MIN_SELECTED_POINTS
}

export function isSelectionReady(count: number, hasOrigin = false): boolean {
  return count >= minimumPoints(hasOrigin) && count <= MAX_SELECTED_POINTS
}

export function describeSelection(count: number, hasOrigin = false): string {
  const minimum = minimumPoints(hasOrigin)
  if (count === 0) {
    return `Selecione de ${minimum} a ${MAX_SELECTED_POINTS} ${minimum === 1 ? 'ponto' : 'pontos'} para calcular a rota.`
  }
  const selected = count === 1 ? '1 ponto selecionado' : `${count} pontos selecionados`
  if (count < minimum) {
    return `${selected}. Selecione pelo menos ${minimum}.`
  }
  if (count === MAX_SELECTED_POINTS) {
    return `${selected}. Limite máximo atingido.`
  }
  return `${selected}.`
}
