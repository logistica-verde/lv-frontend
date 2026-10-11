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

export function isSelectionReady(count: number): boolean {
  return count >= MIN_SELECTED_POINTS && count <= MAX_SELECTED_POINTS
}

export function describeSelection(count: number): string {
  if (count === 0) {
    return `Selecione de ${MIN_SELECTED_POINTS} a ${MAX_SELECTED_POINTS} pontos para calcular a rota.`
  }
  const selected = count === 1 ? '1 ponto selecionado' : `${count} pontos selecionados`
  if (count < MIN_SELECTED_POINTS) {
    return `${selected}. Selecione pelo menos ${MIN_SELECTED_POINTS}.`
  }
  if (count === MAX_SELECTED_POINTS) {
    return `${selected}. Limite máximo atingido.`
  }
  return `${selected}.`
}
