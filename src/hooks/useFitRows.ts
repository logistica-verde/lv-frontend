import { useCallback, useEffect, useState } from 'react'

export function useFitRows(rowHeightPx: number, fallback: number) {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [rows, setRows] = useState(fallback)

  const ref = useCallback((node: HTMLElement | null) => setElement(node), [])

  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') {
      return
    }
    const measure = () => {
      const height = element.clientHeight
      if (height > 0) {
        setRows(Math.max(1, Math.floor(height / rowHeightPx)))
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, rowHeightPx])

  return { ref, rows }
}
