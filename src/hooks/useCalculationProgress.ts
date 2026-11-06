import { useEffect, useState } from 'react'
import { watchCalculations } from '@/services/calculationSocket'
import type { CalculationProgress } from '@/services/schemas/calculationProgress'

export type CalculationProgressById = Partial<Record<number, CalculationProgress>>

export function useCalculationProgress(operationIds: number[]): CalculationProgressById {
  const key = operationIds.join(',')
  const [progress, setProgress] = useState<CalculationProgressById>({})

  useEffect(() => {
    const ids = key === '' ? [] : key.split(',').map(Number)
    return watchCalculations(ids, (update) =>
      setProgress((current) => ({ ...current, [update.operationId]: update })),
    )
  }, [key])

  return progress
}
