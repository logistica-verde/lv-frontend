export type PageSlice<T> = {
  page: number
  pageCount: number
  firstIndex: number
  visible: T[]
}

export function sliceForPage<T>(items: T[], requestedPage: number, pageSize: number): PageSlice<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(requestedPage, pageCount)
  const firstIndex = (page - 1) * pageSize
  return { page, pageCount, firstIndex, visible: items.slice(firstIndex, firstIndex + pageSize) }
}
