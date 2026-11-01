import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import styles from '@/components/Schedule/CancelRouteDialog.module.css'
import SelectField from '@/components/SelectField/SelectField'
import TextArea from '@/components/TextArea/TextArea'

const MIN_JUSTIFICATION = 10
const MAX_REASON = 500

const OTHER = 'Outro motivo'
const QUICK_REASONS = [
  'Cliente ausente',
  'Pedido cancelado pelo cliente',
  'Problema no veículo',
  'Impedimento na via ou trânsito',
  OTHER,
] as const

function buildReason(quick: string, justification: string): string {
  const text = justification.trim()
  return quick === OTHER ? text : `${quick}. ${text}`
}

type CancelRouteDialogProps = {
  open: boolean
  title: string
  confirmLabel: string
  loading: boolean
  onBack: () => void
  onConfirm: (reason: string) => void
}

export default function CancelRouteDialog({
  open,
  title,
  confirmLabel,
  loading,
  onBack,
  onConfirm,
}: CancelRouteDialogProps) {
  const [quick, setQuick] = useState<string>(OTHER)
  const [justification, setJustification] = useState('')
  const [touched, setTouched] = useState(false)

  const trimmed = justification.trim()
  const reason = buildReason(quick, justification)
  const tooShort = trimmed.length < MIN_JUSTIFICATION
  const tooLong = reason.length > MAX_REASON
  const error = touched
    ? tooShort
      ? `Descreva o motivo com pelo menos ${MIN_JUSTIFICATION} caracteres.`
      : tooLong
        ? `O motivo pode ter no máximo ${MAX_REASON} caracteres.`
        : undefined
    : undefined

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched(true)
    if (!tooShort && !tooLong) {
      onConfirm(reason)
    }
  }

  return (
    <Modal open={open} title={title} onClose={onBack}>
      <form onSubmit={submit} className={styles.form} noValidate>
        <p className={styles.lead}>
          Informe por que a rota está sendo cancelada. O motivo fica registrado junto com o seu
          usuário e a data.
        </p>
        <SelectField label="Motivo" value={quick} onChange={(event) => setQuick(event.target.value)}>
          {QUICK_REASONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
        <TextArea
          label="Justificativa"
          value={justification}
          error={error}
          counter={`${reason.length}/${MAX_REASON}`}
          onChange={(event) => setJustification(event.target.value)}
          onBlur={() => setTouched(true)}
        />
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onBack} disabled={loading}>
            Voltar
          </Button>
          <Button type="submit" variant="danger" loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
