import styles from '@/components/BrandMark/BrandMark.module.css'
import { classNames } from '@/lib/classNames'

type BrandMarkProps = {
  size?: number
  className?: string
}

export default function BrandMark({ size = 32, className }: BrandMarkProps) {
  return (
    <span
      className={classNames(styles.mark, className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
        <path
          d="M4 17l5-6 4 3 7-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="4" cy="17" r="1.6" fill="currentColor" />
        <circle cx="20" cy="6" r="1.6" fill="currentColor" />
      </svg>
    </span>
  )
}
