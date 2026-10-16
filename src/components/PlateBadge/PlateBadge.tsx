import styles from '@/components/PlateBadge/PlateBadge.module.css'

type PlateBadgeProps = {
  plate: string
}

export default function PlateBadge({ plate }: PlateBadgeProps) {
  return <span className={styles.plate}>{plate}</span>
}
