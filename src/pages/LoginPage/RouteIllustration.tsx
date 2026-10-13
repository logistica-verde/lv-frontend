import styles from '@/pages/LoginPage/RouteIllustration.module.css'

const EMISSION_PATH = [
  [150, 965],
  [279, 952],
  [455, 976],
  [549, 847],
  [455, 764],
  [338, 847],
  [208, 788],
]

const POINTS = [
  { n: 1, x: 279, y: 952 },
  { n: 2, x: 455, y: 976 },
  { n: 3, x: 549, y: 847 },
  { n: 4, x: 455, y: 764 },
  { n: 5, x: 338, y: 847 },
  { n: 6, x: 208, y: 788 },
]

const OFFSET_X = 78
const OFFSET_Y = 682

function toPoints(path: number[][]): string {
  return path.map(([x, y]) => `${(x ?? 0) - OFFSET_X},${(y ?? 0) - OFFSET_Y}`).join(' ')
}

export default function RouteIllustration() {
  return (
    <svg viewBox="0 0 566 354" className={styles.illustration} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="login-grid" width="46" height="46" patternUnits="userSpaceOnUse">
          <path d="M46 0H0V46" fill="none" className={styles.grid} />
        </pattern>
      </defs>
      <rect width="566" height="354" rx="10" className={styles.frame} />
      <rect width="566" height="354" rx="10" fill="url(#login-grid)" />
      <line x1="0" y1="354" x2="566" y2="30" className={styles.avenue} />
      <polyline points={toPoints(EMISSION_PATH)} className={styles.emission} fill="none" />
      <polyline
        points="130,106 377,82"
        className={styles.distance}
        fill="none"
        strokeDasharray="6 5"
      />
      <polyline
        points="260,165 471,165"
        className={styles.distance}
        fill="none"
        strokeDasharray="6 5"
      />
      {POINTS.map((point) => (
        <g key={point.n} transform={`translate(${point.x - OFFSET_X} ${point.y - OFFSET_Y})`}>
          <circle r="13" className={styles.node} />
          <text className={styles.nodeLabel} textAnchor="middle" dy="4">
            {point.n}
          </text>
        </g>
      ))}
      <g transform={`translate(${150 - OFFSET_X - 15} ${965 - OFFSET_Y - 13})`}>
        <rect width="30" height="26" rx="4" className={styles.depot} />
        <text x="15" y="17" textAnchor="middle" className={styles.depotLabel}>
          CD
        </text>
      </g>
    </svg>
  )
}
