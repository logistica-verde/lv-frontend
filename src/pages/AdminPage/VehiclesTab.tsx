import { Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog'
import EmptyState from '@/components/EmptyState/EmptyState'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Pagination from '@/components/Pagination/Pagination'
import Skeleton from '@/components/Skeleton/Skeleton'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import Table, { Td, Th } from '@/components/Table/Table'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useAllVehicles, useSetVehicleActive } from '@/hooks/useAdmin'
import { useFitRows } from '@/hooks/useFitRows'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import { formatNumber } from '@/lib/format'
import listStyles from '@/pages/AdminPage/AdminList.module.css'
import styles from '@/pages/AdminPage/AdminPage.module.css'
import RegisterVehicleDialog from '@/pages/AdminPage/RegisterVehicleDialog'
import { describeError } from '@/services/errors'
import type { Vehicle } from '@/services/schemas/vehicle'

const ROW_PX = 41
const HEADER_PX = 36
const LIST_ROW_PX = 68
const FALLBACK_ROWS = 7
const DESKTOP_QUERY = '(min-width: 64rem)'

type StatusOfProps = {
  vehicle: Vehicle
}

function StatusOf({ vehicle }: StatusOfProps) {
  return (
    <StatusBadge tone={vehicle.ativo ? 'success' : 'neutral'}>
      {vehicle.ativo ? 'Ativo' : 'Inativo'}
    </StatusBadge>
  )
}

export default function VehiclesTab() {
  const vehicles = useAllVehicles()
  const setActive = useSetVehicleActive()
  const { notify } = useToast()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const { ref, rows } = useFitRows(
    isDesktop ? ROW_PX : LIST_ROW_PX,
    FALLBACK_ROWS,
    isDesktop ? HEADER_PX : 0,
  )
  const [requestedPage, setRequestedPage] = useState(1)
  const [registering, setRegistering] = useState(false)
  const [deactivating, setDeactivating] = useState<Vehicle | null>(null)

  const change = async (vehicle: Vehicle, ativo: boolean) => {
    try {
      await setActive.mutateAsync({ id: vehicle.id, ativo })
      notify(`Veículo ${vehicle.placa} ${ativo ? 'reativado' : 'desativado'}.`, 'success')
    } catch (error) {
      notify(
        error instanceof Error ? describeError(error) : 'Ocorreu um erro inesperado.',
        'danger',
      )
    } finally {
      setDeactivating(null)
    }
  }

  const all = vehicles.data ?? []
  const pageCount = Math.max(1, Math.ceil(all.length / rows))
  const page = Math.min(requestedPage, pageCount)
  const visible = all.slice((page - 1) * rows, page * rows)

  const toggleButton = (vehicle: Vehicle) =>
    vehicle.ativo ? (
      <Button variant="secondary" size="sm" onClick={() => setDeactivating(vehicle)}>
        Desativar <VisuallyHidden>veículo {vehicle.placa}</VisuallyHidden>
      </Button>
    ) : (
      <Button
        variant="secondary"
        size="sm"
        loading={setActive.isPending && setActive.variables?.id === vehicle.id}
        onClick={() => change(vehicle, true)}
      >
        Reativar <VisuallyHidden>veículo {vehicle.placa}</VisuallyHidden>
      </Button>
    )

  return (
    <Card
      title="Veículos"
      fill
      actions={
        <Button size="sm" onClick={() => setRegistering(true)}>
          <Plus size={16} aria-hidden="true" />
          Cadastrar veículo
        </Button>
      }
    >
      <div ref={ref} className={styles.tableArea}>
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
        {vehicles.isSuccess && all.length === 0 && (
          <EmptyState
            title="Nenhum veículo cadastrado"
            description="Cadastre o primeiro veículo para poder calcular rotas."
          />
        )}
        {vehicles.isSuccess && all.length > 0 && isDesktop && (
          <Table dense caption="Veículos cadastrados">
            <thead>
              <tr>
                <Th>Placa</Th>
                <Th numeric>Massa (kg)</Th>
                <Th>Combustível</Th>
                <Th>Situação</Th>
                <Th numeric>Ação</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((vehicle) => (
                <tr key={vehicle.id}>
                  <Th scope="row">{vehicle.placa}</Th>
                  <Td numeric>{formatNumber(vehicle.massaKg)}</Td>
                  <Td>{vehicle.tipoCombustivel}</Td>
                  <Td>
                    <StatusOf vehicle={vehicle} />
                  </Td>
                  <Td numeric>{toggleButton(vehicle)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {vehicles.isSuccess && all.length > 0 && !isDesktop && (
          <ul aria-label="Veículos cadastrados" className={listStyles.list}>
            {visible.map((vehicle) => (
              <li key={vehicle.id} className={listStyles.item}>
                <div className={listStyles.main}>
                  <span className={listStyles.title}>{vehicle.placa}</span>
                  <span className={listStyles.meta}>
                    {formatNumber(vehicle.massaKg)} kg · {vehicle.tipoCombustivel}
                  </span>
                </div>
                <div className={listStyles.side}>
                  <StatusOf vehicle={vehicle} />
                  {toggleButton(vehicle)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={setRequestedPage}
        label="Paginação dos veículos"
      />
      <RegisterVehicleDialog open={registering} onClose={() => setRegistering(false)} />
      <ConfirmDialog
        open={deactivating !== null}
        title="Desativar veículo"
        description={`O veículo ${deactivating?.placa ?? ''} deixa de aparecer no planejamento de rotas. As rotas já calculadas continuam no histórico.`}
        confirmLabel="Desativar veículo"
        tone="danger"
        loading={setActive.isPending}
        onConfirm={() => deactivating && change(deactivating, false)}
        onCancel={() => setDeactivating(null)}
      />
    </Card>
  )
}
