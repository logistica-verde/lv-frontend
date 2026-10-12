import type { ComponentProps } from 'react'
import { useId } from 'react'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import styles from '@/components/SelectField/SelectField.module.css'
import { classNames } from '@/lib/classNames'

type SelectFieldProps = Omit<ComponentProps<'select'>, 'id'> & {
  label: string
  hideLabel?: boolean
  hint?: string
  error?: string
}

export default function SelectField({
  label,
  hideLabel = false,
  hint,
  error,
  className,
  children,
  ...selectProps
}: SelectFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={hideLabel ? undefined : styles.label}>
        {hideLabel ? <VisuallyHidden>{label}</VisuallyHidden> : label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={classNames(styles.select, error && styles.invalid, className)}
        {...selectProps}
      >
        {children}
      </select>
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
