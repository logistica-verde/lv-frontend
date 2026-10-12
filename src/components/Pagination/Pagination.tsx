import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '@/components/Button/Button'
import styles from '@/components/Pagination/Pagination.module.css'

type PaginationProps = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  label?: string
}

export default function Pagination({
  page,
  pageCount,
  onPageChange,
  label = 'Paginação',
}: PaginationProps) {
  if (pageCount <= 1) {
    return null
  }

  return (
    <nav aria-label={label} className={styles.pagination}>
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Anterior
      </Button>
      <span aria-live="polite" className={styles.status}>
        Página {page} de {pageCount}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
        <ChevronRight size={16} aria-hidden="true" />
      </Button>
    </nav>
  )
}
