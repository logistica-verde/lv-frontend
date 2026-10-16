import { Download, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router'
import Button from '@/components/Button/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRoute } from '@/hooks/useRoutes'
import { useSession } from '@/hooks/useSession'
import { useVehicles } from '@/hooks/useVehicles'
import { downloadCsv } from '@/lib/exportCsv'
import { formatShortDateTime } from '@/lib/format'
import { ACCESS, canAccess } from '@/lib/permissions'
import ComparisonView from '@/pages/ComparisonPage/ComparisonView'
import styles from '@/pages/ComparisonPage/ComparisonPage.module.css'
import { comparisonCsv } from '@/pages/ComparisonPage/exportComparison'
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'
import { VEHICLE_IMAGE_LABELS } from '@/services/schemas/vehicle'

function parseId(value: string | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

type ComparisonHeaderProps = {
  emissionId: number
  distanceId: number
}

function ComparisonHeader({ emissionId, distanceId }: ComparisonHeaderProps) {
  const session = useSession()
  const emission = useRoute(emissionId)
  const distance = useRoute(distanceId)
  const vehicles = useVehicles()
  const emissionRoute = emission.data
  const distanceRoute = distance.data
  const vehicle = vehicles.data?.find((candidate) => candidate.id === emissionRoute?.vehicleId)
  const canPlan = session !== null && canAccess(session.usuario.perfil, ACCESS.planning)

  const subtitle = [
    vehicle ? `${vehicle.placa} · ${VEHICLE_IMAGE_LABELS[vehicle.imagem]}` : null,
    emissionRoute ? `${emissionRoute.points.length} pontos` : null,
    emissionRoute ? `calculado em ${formatShortDateTime(emissionRoute.createdAt)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const exportCsv = () => {
    if (emissionRoute && distanceRoute) {
      downloadCsv(
        `lastro-comparacao-${emissionId}-${distanceId}.csv`,
        comparisonCsv([emissionRoute, distanceRoute]),
      )
    }
  }

  return (
    <header className={styles.header}>
      <nav aria-label="Você está em" className={styles.breadcrumb}>
        <Link to="/historico">Histórico</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">
          Operações #{emissionId} e #{distanceId}
        </span>
      </nav>
      <div className={styles.heading}>
        <div className={styles.titles}>
          <h1>Comparação de rotas</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            disabled={!emissionRoute || !distanceRoute}
            onClick={exportCsv}
          >
            <Download size={16} aria-hidden="true" />
            Exportar CSV
          </Button>
          {canPlan && (
            <Link to="/" className={styles.newRoute}>
              <Plus size={16} aria-hidden="true" />
              Nova rota
            </Link>
          )}
        </div>
      </div>
    </header>
  )
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
      <ComparisonHeader emissionId={emission} distanceId={distance} />
      <ComparisonView emissionId={emission} distanceId={distance} />
    </div>
  )
}
