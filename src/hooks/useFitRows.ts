import { useCallback, useEffect, useState } from 'react'

export function useFitRows(rowHeightPx: number, fallback: number, reservedPx = 0) {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [rows, setRows] = useState(fallback)
  const [measured, setMeasured] = useState(false)

  const ref = useCallback((node: HTMLElement | null) => setElement(node), [])
  const canObserve = typeof ResizeObserver !== 'undefined'

  useEffect(() => {
    if (!element || !canObserve) {
      return
    }
    const measure = () => {
      const height = element.clientHeight
      if (height > 0) {
        setRows(Math.max(1, Math.floor((height - reservedPx) / rowHeightPx)))
        setMeasured(true)
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, rowHeightPx, reservedPx, canObserve])

  return { ref, rows, ready: measured || !canObserve }
}
