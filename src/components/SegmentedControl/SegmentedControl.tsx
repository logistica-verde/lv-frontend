import { useId } from 'react'
import styles from '@/components/SegmentedControl/SegmentedControl.module.css'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'

type SegmentedOption<T extends string> = {
  value: T
  label: string
}

type SegmentedControlProps<T extends string> = {
  legend: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

export default function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId()

  return (
    <fieldset className={styles.group}>
      <legend>
        <VisuallyHidden>{legend}</VisuallyHidden>
      </legend>
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className={styles.input}
          />
          <span className={styles.label}>{option.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
