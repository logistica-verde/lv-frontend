import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import SelectField from '@/components/SelectField/SelectField'
import TextField from '@/components/TextField/TextField'
import { formatNumber } from '@/lib/format'
import { numericInputProps, sanitizeNumeric } from '@/lib/inputMask'
import styles from '@/pages/PlanningPage/Calculation/ConfirmCalculationDialog.module.css'
import { readStoredBase, storeBase } from '@/lib/baseChoice'
import type { Base } from '@/services/schemas/base'
import { VEHICLE_IMAGE_LABELS } from '@/services/schemas/vehicle'
import type { Vehicle } from '@/services/schemas/vehicle'

export const MAX_CARGO_KG = 100_000

type ConfirmCalculationDialogProps = {
  open: boolean
  vehicle: Vehicle | undefined
  pointCount: number
  hasOrigin: boolean
  bases: Base[]
  submitting: boolean
  onCancel: () => void
  onConfirm: (cargoKg: number, baseId: number | null) => void
}

type ParsedCargo = { ok: true; value: number } | { ok: false; message: string }

function parseCargo(text: string): ParsedCargo {
  const normalized = text.trim().replace(',', '.')
  if (normalized === '') {
    return { ok: true, value: 0 }
  }
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, message: 'Informe um peso igual ou maior que zero.' }
  }
  if (value > MAX_CARGO_KG) {
    return { ok: false, message: `O peso máximo é ${formatNumber(MAX_CARGO_KG)} kg.` }
  }
  return { ok: true, value }
}

export default function ConfirmCalculationDialog({
  open,
  vehicle,
  pointCount,
  hasOrigin,
  bases,
  submitting,
  onCancel,
  onConfirm,
}: ConfirmCalculationDialogProps) {
  const [cargoText, setCargoText] = useState('')
  const [chosenBase, setChosenBase] = useState<number | null>(() => readStoredBase())
  const cargo = parseCargo(cargoText)
  const base = bases.find((candidate) => candidate.id === chosenBase) ?? null
  const needsMorePoints = base === null && !hasOrigin && pointCount < 2

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (cargo.ok && vehicle && !needsMorePoints) {
      storeBase(base?.id ?? null)
      onConfirm(cargo.value, base?.id ?? null)
    }
  }

  const stops = base !== null || hasOrigin ? pointCount : pointCount - 1
  const departure = base ? `${base.nome} (com retorno)` : hasOrigin ? 'Minha localização' : 'Primeiro ponto da lista'

  return (
    <Modal open={open} title="Confirmar cálculo da rota" onClose={onCancel}>
      <form onSubmit={submit} className={styles.form}>
        <dl className={styles.summary}>
          <div>
            <dt>Veículo</dt>
            <dd>{vehicle ? `${vehicle.placa} · ${VEHICLE_IMAGE_LABELS[vehicle.imagem]}` : '—'}</dd>
          </div>
          <div>
            <dt>Massa do veículo</dt>
            <dd>{vehicle ? `${formatNumber(vehicle.massaKg)} kg` : '—'}</dd>
          </div>
          <div>
            <dt>Paradas</dt>
            <dd>{stops}</dd>
          </div>
          <div>
            <dt>Saída</dt>
            <dd>{departure}</dd>
          </div>
        </dl>
        {bases.length > 0 && (
          <SelectField
            label="Base (saída e retorno)"
            value={base?.id ?? ''}
            hint="A rota parte da base e volta a ela depois da última parada."
            onChange={(event) =>
              setChosenBase(event.target.value === '' ? null : Number(event.target.value))
            }
          >
            <option value="">Sem base (saída pelo primeiro ponto ou pela minha localização)</option>
            {bases.map((option) => (
              <option key={option.id} value={option.id}>
                {option.nome}
              </option>
            ))}
          </SelectField>
        )}
        <TextField
          label="Peso da carga (kg)"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          hint="É somado à massa do veículo no cálculo da emissão."
          error={cargo.ok ? undefined : cargo.message}
          value={cargoText}
          {...numericInputProps({ decimal: true })}
          onChange={(event) => setCargoText(sanitizeNumeric(event.target.value, { decimal: true }))}
        />
        <p className={styles.total}>
          Massa total considerada:{' '}
          <strong>
            {vehicle && cargo.ok ? `${formatNumber(vehicle.massaKg + cargo.value)} kg` : '—'}
          </strong>
        </p>
        {needsMorePoints && (
          <p role="alert" className={styles.note}>
            Sem base nem localização, a rota precisa de pelo menos 2 pontos.
          </p>
        )}
        <p className={styles.note}>
          Serão calculadas a rota de menor emissão e a de menor distância para os mesmos pontos.
        </p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!cargo.ok || !vehicle || needsMorePoints}
            loading={submitting}
          >
            Confirmar e calcular
          </Button>
        </div>
      </form>
    </Modal>
  )
}
