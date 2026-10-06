import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Skeleton from '@/components/Skeleton/Skeleton'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useVehicles } from '@/hooks/useVehicles'
import VehicleForm from '@/pages/VehiclesPage/VehicleForm'
import VehicleTable from '@/pages/VehiclesPage/VehicleTable'
import styles from '@/pages/VehiclesPage/VehiclesPage.module.css'
import { describeError } from '@/services/errors'

export default function VehiclesPage() {
  useDocumentTitle('Veículos')
  const vehicles = useVehicles()

  return (
    <div className={styles.page}>
      <h1>Veículos</h1>
      <VehicleForm />
      <Card title="Veículos cadastrados">
        {vehicles.isPending && (
          <div role="status" className={styles.loading}>
            <VisuallyHidden>Carregando veículos</VisuallyHidden>
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
          </div>
        )}
        {vehicles.isError && (
          <ErrorMessage
            message={describeError(vehicles.error)}
            onRetry={() => vehicles.refetch()}
          />
        )}
        {vehicles.isSuccess && vehicles.data.length === 0 && (
          <EmptyState
            title="Nenhum veículo cadastrado"
            description="Cadastre o primeiro veículo no formulário acima para poder calcular rotas."
          />
        )}
        {vehicles.isSuccess && vehicles.data.length > 0 && (
          <VehicleTable vehicles={vehicles.data} />
        )}
      </Card>
    </div>
  )
}
