import type { ComponentProps } from 'react'
import { useId } from 'react'
import styles from '@/components/TextArea/TextArea.module.css'
import { classNames } from '@/lib/classNames'

type TextAreaProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  label: string
  hint?: string
  error?: string
  counter?: string
}

export default function TextArea({ label, hint, error, counter, className, ...textareaProps }: TextAreaProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={classNames(styles.textarea, error && styles.invalid, className)}
        {...textareaProps}
      />
      <div className={styles.footer}>
        <div className={styles.messages}>
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
        {counter && <span className={styles.counter}>{counter}</span>}
      </div>
    </div>
  )
}
