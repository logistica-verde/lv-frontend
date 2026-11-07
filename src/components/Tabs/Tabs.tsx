import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import styles from '@/components/Tabs/Tabs.module.css'
import { classNames } from '@/lib/classNames'

export type TabItem = {
  id: string
  label: string
  content: ReactNode
}

type TabsProps = {
  label: string
  items: TabItem[]
  initialId?: string
  className?: string
}

export default function Tabs({ label, items, initialId, className }: TabsProps) {
  const baseId = useId()
  const [selectedId, setSelectedId] = useState(initialId ?? items[0]?.id ?? '')
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  const reveal = (id: string) => {
    tabRefs.current.get(id)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }

  const select = (id: string) => {
    setSelectedId(id)
    tabRefs.current.get(id)?.focus()
    reveal(id)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === selectedId)
    const last = items.length - 1
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }
    const target = targets[event.key]
    const next = target === undefined ? undefined : items[target]
    if (next) {
      event.preventDefault()
      select(next.id)
    }
  }

  return (
    <div className={classNames(styles.tabs, className)}>
      <div role="tablist" aria-label={label} className={styles.list} onKeyDown={handleKeyDown}>
        {items.map((item) => (
          <button
            key={item.id}
            ref={(element) => {
              if (element) {
                tabRefs.current.set(item.id, element)
              } else {
                tabRefs.current.delete(item.id)
              }
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={item.id === selectedId}
            aria-controls={`${baseId}-panel-${item.id}`}
            tabIndex={item.id === selectedId ? 0 : -1}
            className={classNames(styles.tab, item.id === selectedId && styles.selected)}
            onClick={() => {
              setSelectedId(item.id)
              reveal(item.id)
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== selectedId}
          className={styles.panel}
        >
          {item.content}
        </div>
      ))}
    </div>
  )
}
