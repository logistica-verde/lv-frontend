import type { ReactNode } from 'react'
import Tabs from '@/components/Tabs/Tabs'
import styles from '@/components/SplitLayout/SplitLayout.module.css'
import { useIsDesktop } from '@/hooks/useMediaQuery'

type SplitLayoutProps = {
  panelLabel: string
  mapLabel: string
  panel: ReactNode
  map: ReactNode
}

export default function SplitLayout({ panelLabel, mapLabel, panel, map }: SplitLayoutProps) {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <div className={styles.split}>
        <div className={styles.panel}>{panel}</div>
        <div className={styles.map}>{map}</div>
      </div>
    )
  }

  return (
    <Tabs
      label="Painel ou mapa"
      className={styles.tabs}
      items={[
        { id: 'panel', label: panelLabel, content: <div className={styles.fill}>{panel}</div> },
        { id: 'map', label: mapLabel, content: <div className={styles.fill}>{map}</div> },
      ]}
    />
  )
}
