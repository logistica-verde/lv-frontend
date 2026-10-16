import styles from '@/components/Mascot/Mascot.module.css'
import { classNames } from '@/lib/classNames'

type MascotProps = {
  size?: number
  tone?: 'light' | 'dark'
  className?: string
}

type Hexagon = { x: number; y: number; radius: number; core?: boolean }

const HEXAGONS: Hexagon[] = [
  { x: 120, y: 85, radius: 20 },
  { x: 77, y: 107, radius: 14 },
  { x: 163, y: 107, radius: 14 },
  { x: 77, y: 152, radius: 14 },
  { x: 163, y: 152, radius: 14 },
  { x: 120, y: 175, radius: 20 },
  { x: 120, y: 130, radius: 20, core: true },
]

const HALF_WIDTH = Math.sqrt(3) / 2
const VIEW_WIDTH = 240
const VIEW_HEIGHT = 230

function hexagonPoints({ x, y, radius }: Hexagon): string {
  const side = radius * HALF_WIDTH
  return [
    [x, y - radius],
    [x + side, y - radius / 2],
    [x + side, y + radius / 2],
    [x, y + radius],
    [x - side, y + radius / 2],
    [x - side, y - radius / 2],
  ]
    .map(([px, py]) => `${px},${py}`)
    .join(' ')
}

const FRONT_FLIPPER = 'M70 90 Q30 70 2 58 Q28 102 62 124 Z'
const REAR_FLIPPER = 'M66 172 Q50 190 40 212 Q64 205 80 190 Z'

export default function Mascot({ size = 96, tone = 'light', className }: MascotProps) {
  const mirrored = `translate(${VIEW_WIDTH} 0) scale(-1 1)`

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      width={size}
      height={(size * VIEW_HEIGHT) / VIEW_WIDTH}
      className={classNames(styles.mascot, tone === 'dark' && styles.dark, className)}
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.limb}>
        <path d={FRONT_FLIPPER} />
        <path d={FRONT_FLIPPER} transform={mirrored} />
        <path d={REAR_FLIPPER} />
        <path d={REAR_FLIPPER} transform={mirrored} />
        <path d="M113 209 L120 226 L127 209 Z" className={styles.tail} />
        <circle cx="120" cy="33" r="17" />
      </g>
      <ellipse cx="120" cy="130" rx="66" ry="82" className={styles.shell} />
      <g className={styles.links}>
        <path d="M120 105 V110 M120 150 V155" />
      </g>
      {HEXAGONS.map((hexagon) => (
        <polygon
          key={`${hexagon.x}-${hexagon.y}`}
          points={hexagonPoints(hexagon)}
          className={hexagon.core ? styles.core : styles.cell}
        />
      ))}
    </svg>
  )
}
