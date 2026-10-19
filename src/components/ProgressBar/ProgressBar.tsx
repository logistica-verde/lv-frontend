import styles from '@/components/ProgressBar/ProgressBar.module.css'

type ProgressBarProps = {
  label: string
  value: number
}

export default function ProgressBar({ label, value }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(value)))

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={styles.track}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  )
}
