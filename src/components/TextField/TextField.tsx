import type { ComponentProps, ReactNode } from 'react'
import { useId } from 'react'
import styles from '@/components/TextField/TextField.module.css'
import { classNames } from '@/lib/classNames'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  hint?: string
  error?: string
  labelAction?: ReactNode
  adornment?: ReactNode
}

export default function TextField({
  label,
  hint,
  error,
  labelAction,
  adornment,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  const input = (
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy || undefined}
      className={classNames(
        styles.input,
        error && styles.invalid,
        adornment ? styles.padded : undefined,
        className,
      )}
      {...inputProps}
    />
  )

  return (
    <div className={styles.field}>
      {labelAction ? (
        <div className={styles.labelRow}>
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      {adornment ? (
        <div className={styles.control}>
          {input}
          <div className={styles.adornment}>{adornment}</div>
        </div>
      ) : (
        input
      )}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
