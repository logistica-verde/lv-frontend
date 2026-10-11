import styles from '@/components/Skeleton/Skeleton.module.css'

type SkeletonProps = {
  width?: string
  height?: string
}

export default function Skeleton({ width = '100%', height = '1rem' }: SkeletonProps) {
  return <span aria-hidden="true" className={styles.skeleton} style={{ width, height }} />
}
