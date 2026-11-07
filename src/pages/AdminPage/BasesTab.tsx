import { Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Skeleton from '@/components/Skeleton/Skeleton'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import Table, { Td, Th } from '@/components/Table/Table'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useAllBases, useSetBaseActive } from '@/hooks/useBases'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import { formatNumber } from '@/lib/format'
import listStyles from '@/pages/AdminPage/AdminList.module.css'
import RegisterBaseDialog from '@/pages/AdminPage/RegisterBaseDialog'
import { describeError, failureMessage } from '@/services/errors'
import type { Base } from '@/services/schemas/base'

export default function BasesTab() {
  const bases = useAllBases()
  const setActive = useSetBaseActive()
  const { notify } = useToast()
  const [registering, setRegistering] = useState(false)
  const isDesktop = useIsDesktop()

  const change = async (base: Base, ativo: boolean) => {
    try {
      await setActive.mutateAsync({ id: base.id, ativo })
      notify(`Base ${base.nome} ${ativo ? 'reativada' : 'desativada'}.`, 'success')
    } catch (error) {
      notify(failureMessage(error), 'danger')
    }
  }

  const all = bases.data ?? []

  const status = (base: Base) => (
    <StatusBadge tone={base.ativo ? 'success' : 'neutral'}>
      {base.ativo ? 'Ativa' : 'Inativa'}
    </StatusBadge>
  )

  const toggleButton = (base: Base) => (
    <Button
      variant="secondary"
      size="sm"
      loading={setActive.isPending && setActive.variables?.id === base.id}
      onClick={() => change(base, !base.ativo)}
    >
      {base.ativo ? 'Desativar' : 'Reativar'}
      <VisuallyHidden> base {base.nome}</VisuallyHidden>
    </Button>
  )

  return (
    <Card
      title="Bases"
      actions={
        <Button size="sm" onClick={() => setRegistering(true)}>
          <Plus size={16} aria-hidden="true" />
          Cadastrar base
        </Button>
      }
    >
      {bases.isPending && (
        <div role="status">
          <VisuallyHidden>Carregando bases</VisuallyHidden>
          <Skeleton height="6rem" />
        </div>
      )}
      {bases.isError && (
        <ErrorMessage message={describeError(bases.error)} onRetry={() => bases.refetch()} />
      )}
      {bases.isSuccess && all.length === 0 && (
        <EmptyState
          title="Nenhuma base cadastrada"
          description="Cadastre a base para que as rotas partam dela e voltem a ela no fim do percurso."
        />
      )}
      {all.length > 0 && !isDesktop && (
        <ul aria-label="Bases cadastradas" className={listStyles.list}>
          {all.map((base) => (
            <li key={base.id} className={listStyles.item}>
              <div className={listStyles.main}>
                <span className={listStyles.title}>{base.nome}</span>
                <span className={listStyles.meta}>
                  {base.endereco ?? `${formatNumber(base.latitude)}, ${formatNumber(base.longitude)}`}
                </span>
              </div>
              <div className={listStyles.side}>
                {status(base)}
                {toggleButton(base)}
              </div>
            </li>
          ))}
        </ul>
      )}
      {all.length > 0 && isDesktop && (
        <Table caption="Bases cadastradas">
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Endereço</Th>
              <Th>Latitude</Th>
              <Th>Longitude</Th>
              <Th>Situação</Th>
              <Th>Ação</Th>
            </tr>
          </thead>
          <tbody>
            {all.map((base) => (
              <tr key={base.id}>
                <Th scope="row">{base.nome}</Th>
                <Td>{base.endereco ?? '—'}</Td>
                <Td>{formatNumber(base.latitude)}</Td>
                <Td>{formatNumber(base.longitude)}</Td>
                <Td>{status(base)}</Td>
                <Td>{toggleButton(base)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <RegisterBaseDialog open={registering} onClose={() => setRegistering(false)} />
    </Card>
  )
}
