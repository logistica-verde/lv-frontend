import type { ReactNode } from 'react'
import styles from '@/components/VehicleImage/VehicleImage.module.css'
import { classNames } from '@/lib/classNames'
import type { VehicleImageKey } from '@/services/schemas/vehicle'

type WheelProps = {
  cx: number
}

function Wheel({ cx }: WheelProps) {
  return (
    <g>
      <circle cx={cx} cy={46} r={7} className={styles.tire} />
      <circle cx={cx} cy={46} r={3} className={styles.hub} />
    </g>
  )
}

const SHAPES: Record<VehicleImageKey, ReactNode> = {
  van: (
    <>
      <path d="M6 44V16q0-4 4-4h44q6 0 11 6l17 15q5 3 5 8v3z" className={styles.body} />
      <path d="M58 17l12 14H58z" className={styles.glass} />
      <rect x={14} y={19} width={30} height={10} rx={2} className={styles.glass} />
      <Wheel cx={24} />
      <Wheel cx={72} />
    </>
  ),
  pickup: (
    <>
      <path d="M8 26h20l10 11v7H8z" className={styles.body} />
      <path d="M16 29h10l6 8H16z" className={styles.glass} />
      <path d="M42 30h46v14H42z" className={styles.bed} />
      <Wheel cx={24} />
      <Wheel cx={72} />
    </>
  ),
  vuc: (
    <>
      <rect x={4} y={10} width={54} height={34} rx={3} className={styles.body} />
      <path d="M60 24h14l12 11v9H60z" className={styles.body} />
      <path d="M65 28h8l6 7H65z" className={styles.glass} />
      <Wheel cx={22} />
      <Wheel cx={72} />
    </>
  ),
  truck: (
    <>
      <rect x={2} y={6} width={62} height={38} rx={3} className={styles.body} />
      <path d="M66 20h14l12 14v10H66z" className={styles.body} />
      <path d="M71 24h8l7 10H71z" className={styles.glass} />
      <Wheel cx={14} />
      <Wheel cx={30} />
      <Wheel cx={78} />
    </>
  ),
  semi: (
    <>
      <rect x={2} y={8} width={58} height={30} rx={3} className={styles.body} />
      <rect x={2} y={38} width={58} height={4} className={styles.chassis} />
      <path d="M64 18h14l14 14v10H64z" className={styles.body} />
      <path d="M69 22h8l8 10H69z" className={styles.glass} />
      <Wheel cx={14} />
      <Wheel cx={30} />
      <Wheel cx={76} />
    </>
  ),
  motorcycle: (
    <>
      <circle cx={22} cy={40} r={11} className={styles.rim} />
      <circle cx={74} cy={40} r={11} className={styles.rim} />
      <path d="M22 40l16-14h22l14 14" className={styles.frame} />
      <path d="M38 26l-4-10h-8" className={styles.frame} />
      <path d="M60 26l8-12h8" className={styles.frame} />
      <rect x={36} y={20} width={24} height={8} rx={4} className={styles.body} />
    </>
  ),
}

type VehicleImageProps = {
  image: VehicleImageKey
  solid?: boolean
  className?: string
}

export default function VehicleImage({ image, solid = false, className }: VehicleImageProps) {
  return (
    <svg
      viewBox="0 0 96 56"
      aria-hidden="true"
      focusable="false"
      className={classNames(styles.image, !solid && styles.outline, className)}
    >
      {SHAPES[image]}
    </svg>
  )
}
