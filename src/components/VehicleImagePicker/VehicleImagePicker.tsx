import type { ComponentProps } from 'react'
import styles from '@/components/VehicleImagePicker/VehicleImagePicker.module.css'
import VehicleImage from '@/components/VehicleImage/VehicleImage'
import { VEHICLE_IMAGE_KEYS, VEHICLE_IMAGE_LABELS } from '@/services/schemas/vehicle'

type VehicleImagePickerProps = Omit<ComponentProps<'input'>, 'type' | 'value' | 'defaultValue'> & {
  legend: string
}

export default function VehicleImagePicker({ legend, ...inputProps }: VehicleImagePickerProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {VEHICLE_IMAGE_KEYS.map((key) => (
          <label key={key} className={styles.option}>
            <input type="radio" value={key} className={styles.input} {...inputProps} />
            <span className={styles.card}>
              <VehicleImage image={key} className={styles.picture} />
              <span className={styles.name}>{VEHICLE_IMAGE_LABELS[key]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
