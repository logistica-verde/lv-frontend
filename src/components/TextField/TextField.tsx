import type { ComponentProps } from 'react'
import { useId } from 'react'
import styles from '@/components/TextField/TextField.module.css'
import { classNames } from '@/lib/classNames'

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string
  hint?: string
  error?: string
}

export default function TextField({
  label,
  hint,
  error,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={classNames(styles.input, error && styles.invalid, className)}
        {...inputProps}
      />
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
