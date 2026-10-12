import styles from '@/components/Spinner/Spinner.module.css'

type SpinnerProps = {
  label?: string
}

export default function Spinner({ label = 'Carregando' }: SpinnerProps) {
  return <span role="status" aria-label={label} className={styles.spinner} />
}
