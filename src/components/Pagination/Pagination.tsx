import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import Button from '@/components/Button/Button'
import { pageItems } from '@/components/Pagination/pageItems'
import styles from '@/components/Pagination/Pagination.module.css'
import { classNames } from '@/lib/classNames'

type PaginationProps = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  label?: string
  numbered?: boolean
  summary?: ReactNode
}

export default function Pagination({
  page,
  pageCount,
  onPageChange,
  label = 'Paginação',
  numbered = false,
  summary,
}: PaginationProps) {
  if (pageCount <= 1 && !summary) {
    return null
  }

  const previous = (
    <Button
      variant="secondary"
      size="sm"
      disabled={page <= 1}
      onClick={() => onPageChange(page - 1)}
    >
      <ChevronLeft size={16} aria-hidden="true" />
      Anterior
    </Button>
  )
  const next = (
    <Button
      variant="secondary"
      size="sm"
      disabled={page >= pageCount}
      onClick={() => onPageChange(page + 1)}
    >
      Próxima
      <ChevronRight size={16} aria-hidden="true" />
    </Button>
  )

  if (!numbered) {
    return (
      <nav aria-label={label} className={styles.pagination}>
        {previous}
        <span aria-live="polite" className={styles.status}>
          Página {page} de {pageCount}
        </span>
        {next}
      </nav>
    )
  }

  return (
    <nav aria-label={label} className={styles.pagination}>
      <span aria-live="polite" className={styles.status}>
        {summary ?? `Página ${page} de ${pageCount}`}
      </span>
      <div className={styles.numbers}>
        {previous}
        {pageItems(page, pageCount).map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              aria-label={`Ir para a página ${item}`}
              aria-current={item === page ? 'page' : undefined}
              className={classNames(styles.number, item === page && styles.current)}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ) : (
            <span key={`gap-${item.gapAfter}`} className={styles.gap} aria-hidden="true">
              …
            </span>
          ),
        )}
        {next}
      </div>
    </nav>
  )
}
