import { useState } from 'react'
import type { ChangeEvent } from 'react'
import Button from '@/components/Button/Button'
import { useCreateDeliveryPoints } from '@/hooks/useDeliveryPoints'
import { useToast } from '@/hooks/useToast'
import { CSV_TEMPLATE, parseDeliveryPointsCsv } from '@/lib/csv'
import type { CsvParseResult } from '@/lib/csv'
import styles from '@/pages/PlanningPage/AddPoint/AddPointTabs.module.css'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'

const VISIBLE_ERRORS = 3
const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`

type CsvTabProps = {
  capacity: number
  onAdded: (points: DeliveryPoint[]) => void
}

export default function CsvTab({ capacity, onAdded }: CsvTabProps) {
  const createPoints = useCreateDeliveryPoints()
  const { notify } = useToast()
  const [parsed, setParsed] = useState<CsvParseResult | null>(null)

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setParsed(file ? parseDeliveryPointsCsv(await file.text()) : null)
  }

  const points = parsed?.points ?? []
  const errors = parsed?.errors ?? []
  const overCapacity = points.length > capacity

  const importPoints = async () => {
    const { created, failures } = await createPoints.mutateAsync(points)
    if (failures.length > 0) {
      notify(
        `${failures.length} ${failures.length === 1 ? 'ponto não foi importado' : 'pontos não foram importados'}.`,
        'danger',
      )
    }
    if (created.length > 0) {
      onAdded(created)
    }
  }

  return (
    <div className={styles.form}>
      <div>
        <label htmlFor="csv-file" className={styles.muted}>
          Arquivo CSV
        </label>
        <input id="csv-file" type="file" accept=".csv,text/csv" onChange={readFile} />
      </div>
      <p className={styles.muted}>
        Colunas: nome, endereco, latitude, longitude.{' '}
        <a href={TEMPLATE_HREF} download="modelo-pontos.csv">
          Baixar modelo
        </a>
      </p>
      {parsed && (
        <>
          <p role="status" className={styles.summary}>
            {points.length} {points.length === 1 ? 'ponto válido' : 'pontos válidos'}
            {errors.length > 0 &&
              `, ${errors.length} ${errors.length === 1 ? 'linha com erro' : 'linhas com erro'}`}
            .
          </p>
          {errors.length > 0 && (
            <ul className={styles.errors}>
              {errors.slice(0, VISIBLE_ERRORS).map((error) => (
                <li key={`${error.line}-${error.message}`}>
                  Linha {error.line}: {error.message}
                </li>
              ))}
              {errors.length > VISIBLE_ERRORS && (
                <li>e mais {errors.length - VISIBLE_ERRORS} com erro.</li>
              )}
            </ul>
          )}
          {overCapacity && (
            <p role="alert" className={styles.errors}>
              A rota comporta mais {capacity} {capacity === 1 ? 'ponto' : 'pontos'}. Reduza o
              arquivo.
            </p>
          )}
        </>
      )}
      <div className={styles.actions}>
        <Button
          disabled={points.length === 0 || overCapacity}
          loading={createPoints.isPending}
          onClick={importPoints}
        >
          {`Importar ${points.length} ${points.length === 1 ? 'ponto' : 'pontos'}`}
        </Button>
      </div>
    </div>
  )
}
