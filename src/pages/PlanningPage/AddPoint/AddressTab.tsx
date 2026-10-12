import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/Button/Button'
import TextField from '@/components/TextField/TextField'
import { useCreateDeliveryPoints } from '@/hooks/useDeliveryPoints'
import { useToast } from '@/hooks/useToast'
import styles from '@/pages/PlanningPage/AddPoint/AddPointTabs.module.css'
import { describeError } from '@/services/errors'
import { searchAddress } from '@/services/geocodeService'
import type { AddressMatch } from '@/services/geocodeService'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'

type AddressTabProps = {
  onAdded: (points: DeliveryPoint[]) => void
}

const MIN_QUERY_LENGTH = 3

function suggestName(label: string): string {
  return label.split(',')[0]?.trim() ?? label
}

export default function AddressTab({ onAdded }: AddressTabProps) {
  const search = useMutation({ mutationFn: (query: string) => searchAddress(query) })
  const createPoints = useCreateDeliveryPoints()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [tooShort, setTooShort] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const [name, setName] = useState('')

  const matches: AddressMatch[] = search.data ?? []
  const match = chosen === null ? undefined : matches[chosen]

  const runSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setTooShort(true)
      return
    }
    setTooShort(false)
    setChosen(null)
    setName('')
    search.mutate(trimmed)
  }

  const choose = (index: number) => {
    setChosen(index)
    const picked = matches[index]
    setName(picked ? suggestName(picked.label) : '')
  }

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!match || name.trim() === '') {
      return
    }
    const { created, failures } = await createPoints.mutateAsync([
      {
        nome: name.trim(),
        endereco: match.label,
        latitude: match.latitude,
        longitude: match.longitude,
      },
    ])
    const failure = failures[0]
    if (failure) {
      notify(describeError(failure.error), 'danger')
      return
    }
    onAdded(created)
  }

  return (
    <div className={styles.form}>
      <form onSubmit={runSearch} className={styles.row}>
        <div className={styles.grow}>
          <TextField
            label="Endereço"
            autoComplete="off"
            hint="Ex.: Avenida Paulista, 1578"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setTooShort(false)
            }}
          />
        </div>
        <Button type="submit" variant="secondary" loading={search.isPending}>
          Buscar endereço
        </Button>
      </form>
      {tooShort && (
        <p role="alert" className={styles.errors}>
          Digite ao menos {MIN_QUERY_LENGTH} caracteres do endereço.
        </p>
      )}
      {search.isError && (
        <p role="alert" className={styles.errors}>
          {describeError(search.error)} Tente de novo ou use as coordenadas.
        </p>
      )}
      {search.isSuccess && matches.length === 0 && (
        <p role="status" className={styles.muted}>
          Nenhum endereço encontrado. Confira o texto ou use as coordenadas.
        </p>
      )}
      {matches.length > 0 && (
        <form onSubmit={add} className={styles.form}>
          <fieldset className={styles.options}>
            <legend>Resultados</legend>
            {matches.map((item, index) => (
              <label key={item.label} className={styles.option}>
                <input
                  type="radio"
                  name="endereco"
                  checked={chosen === index}
                  onChange={() => choose(index)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </fieldset>
          {match && (
            <TextField
              label="Nome do ponto"
              autoComplete="off"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
          <div className={styles.actions}>
            <Button
              type="submit"
              disabled={!match || name.trim() === ''}
              loading={createPoints.isPending}
            >
              Adicionar ponto
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
