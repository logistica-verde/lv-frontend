export const CHART_STYLE = {
  emission: 'var(--color-route-emission)',
  distance: 'var(--color-route-distance)',
  grid: 'var(--color-border)',
  axis: 'var(--color-border-strong)',
  tick: { fill: 'var(--color-text-muted)', fontSize: 12 },
  label: { fill: 'var(--color-text-muted)', fontSize: 12 },
  tooltip: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    boxShadow: 'var(--shadow-float)',
    color: 'var(--color-text)',
    fontSize: 13,
  },
  legend: { fontSize: 13 },
} as const
