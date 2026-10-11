import { Link, useParams } from 'react-router'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import ComparisonView from '@/pages/ComparisonPage/ComparisonView'
import styles from '@/pages/ComparisonPage/ComparisonPage.module.css'
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'

function parseId(value: string | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export default function ComparisonPage() {
  useDocumentTitle('Comparação de rotas')
  const { emissionId, distanceId } = useParams()
  const emission = parseId(emissionId)
  const distance = parseId(distanceId)

  if (emission === null || distance === null) {
    return <NotFoundPage />
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        Voltar ao planejamento
      </Link>
      <h1>Comparação de rotas</h1>
      <ComparisonView emissionId={emission} distanceId={distance} />
    </div>
  )
}
