import type { CSSProperties, ComponentProps, ReactNode } from 'react'
import styles from '@/components/Table/Table.module.css'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { classNames } from '@/lib/classNames'

type TableProps = {
  caption: string
  maxHeight?: string
  dense?: boolean
  children: ReactNode
}

export default function Table({ caption, maxHeight, dense = false, children }: TableProps) {
  const style: CSSProperties | undefined = maxHeight ? { maxHeight } : undefined

  return (
    <div className={styles.scroll} style={style}>
      <table className={classNames(styles.table, dense && styles.dense)}>
        <caption>
          <VisuallyHidden>{caption}</VisuallyHidden>
        </caption>
        {children}
      </table>
    </div>
  )
}

type CellProps = {
  numeric?: boolean
}

export function Th({
  numeric,
  className,
  scope = 'col',
  ...props
}: ComponentProps<'th'> & CellProps) {
  return (
    <th scope={scope} className={classNames(numeric && styles.numeric, className)} {...props} />
  )
}

export function Td({ numeric, className, ...props }: ComponentProps<'td'> & CellProps) {
  return <td className={classNames(numeric && styles.numeric, className)} {...props} />
}
