export type PageItem = number | { gapAfter: number }

export function pageItems(page: number, pageCount: number): PageItem[] {
  const wanted = new Set([1, page - 1, page, page + 1, pageCount])
  const numbers = [...wanted]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b)
  const items: PageItem[] = []
  numbers.forEach((value, index) => {
    const previous = numbers[index - 1]
    if (previous !== undefined && value - previous === 2) {
      items.push(previous + 1)
    } else if (previous !== undefined && value - previous > 2) {
      items.push({ gapAfter: previous })
    }
    items.push(value)
  })
  return items
}
