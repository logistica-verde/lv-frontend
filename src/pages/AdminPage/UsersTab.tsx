import { useState } from 'react'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog'
import EmptyState from '@/components/EmptyState/EmptyState'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Pagination from '@/components/Pagination/Pagination'
import SelectField from '@/components/SelectField/SelectField'
import Skeleton from '@/components/Skeleton/Skeleton'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import Table, { Td, Th } from '@/components/Table/Table'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useUpdateUser, useUsers } from '@/hooks/useAdmin'
import { useFitRows } from '@/hooks/useFitRows'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import listStyles from '@/pages/AdminPage/AdminList.module.css'
import styles from '@/pages/AdminPage/AdminPage.module.css'
import { ApiError, describeError } from '@/services/errors'
import { ROLE_LABELS, ROLES } from '@/services/schemas/user'
import type { Role, User, UserUpdate } from '@/services/schemas/user'

const ROW_PX = 45
const HEADER_PX = 36
const LIST_ROW_PX = 68
const FALLBACK_ROWS = 7
const DESKTOP_QUERY = '(min-width: 64rem)'

type PendingChange = { kind: 'role'; user: User; role: Role } | { kind: 'deactivate'; user: User }

function describeUpdateError(error: Error): string {
  if (error instanceof ApiError && error.status === 409) {
    return 'Não é possível remover o último administrador ativo.'
  }
  return describeError(error)
}

function describeChange(change: PendingChange): { title: string; text: string; label: string } {
  if (change.kind === 'role') {
    return {
      title: 'Alterar perfil',
      text: `${change.user.nome} passa a ter o perfil ${ROLE_LABELS[change.role]} e as permissões correspondentes no próximo acesso.`,
      label: 'Alterar perfil',
    }
  }
  return {
    title: 'Desativar usuário',
    text: `${change.user.nome} perde o acesso ao sistema. O histórico de operações dessa pessoa é mantido.`,
    label: 'Desativar usuário',
  }
}

export default function UsersTab() {
  const users = useUsers()
  const updateUser = useUpdateUser()
  const { notify } = useToast()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const { ref, rows } = useFitRows(
    isDesktop ? ROW_PX : LIST_ROW_PX,
    FALLBACK_ROWS,
    isDesktop ? HEADER_PX : 0,
  )
  const [requestedPage, setRequestedPage] = useState(1)
  const [pending, setPending] = useState<PendingChange | null>(null)

  const apply = async (user: User, update: UserUpdate, success: string) => {
    try {
      await updateUser.mutateAsync({ id: user.id, update })
      notify(success, 'success')
    } catch (error) {
      notify(
        error instanceof Error ? describeUpdateError(error) : 'Ocorreu um erro inesperado.',
        'danger',
      )
    } finally {
      setPending(null)
    }
  }

  const confirm = () => {
    if (!pending) {
      return
    }
    if (pending.kind === 'role') {
      return apply(
        pending.user,
        { perfil: pending.role },
        `Perfil de ${pending.user.nome} alterado para ${ROLE_LABELS[pending.role]}.`,
      )
    }
    return apply(pending.user, { ativo: false }, `${pending.user.nome} foi desativado.`)
  }

  const all = users.data ?? []
  const pageCount = Math.max(1, Math.ceil(all.length / rows))
  const page = Math.min(requestedPage, pageCount)
  const visible = all.slice((page - 1) * rows, page * rows)

  const roleSelect = (user: User) => (
    <SelectField
      label={`Perfil de ${user.nome}`}
      hideLabel
      value={user.perfil}
      className={styles.roleSelect}
      onChange={(event) => setPending({ kind: 'role', user, role: event.target.value as Role })}
    >
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </SelectField>
  )

  const toggleButton = (user: User) =>
    user.ativo ? (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setPending({ kind: 'deactivate', user })}
      >
        Desativar <VisuallyHidden>usuário {user.nome}</VisuallyHidden>
      </Button>
    ) : (
      <Button
        variant="secondary"
        size="sm"
        loading={updateUser.isPending && updateUser.variables?.id === user.id}
        onClick={() => apply(user, { ativo: true }, `${user.nome} foi reativado.`)}
      >
        Reativar <VisuallyHidden>usuário {user.nome}</VisuallyHidden>
      </Button>
    )

  const status = (user: User) => (
    <StatusBadge tone={user.ativo ? 'success' : 'neutral'}>
      {user.ativo ? 'Ativo' : 'Inativo'}
    </StatusBadge>
  )

  const description = pending ? describeChange(pending) : null

  return (
    <Card title="Usuários e perfis" fill>
      <div ref={ref} className={styles.tableArea}>
        {users.isPending && (
          <div role="status" className={styles.loading}>
            <VisuallyHidden>Carregando usuários</VisuallyHidden>
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
            <Skeleton height="1.5rem" />
          </div>
        )}
        {users.isError && (
          <ErrorMessage message={describeError(users.error)} onRetry={() => users.refetch()} />
        )}
        {users.isSuccess && all.length === 0 && (
          <EmptyState
            title="Nenhum usuário cadastrado"
            description="Os usuários aparecem aqui assim que forem criados."
          />
        )}
        {users.isSuccess && all.length > 0 && isDesktop && (
          <Table dense caption="Usuários e seus perfis">
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>E-mail</Th>
                <Th>Perfil</Th>
                <Th>Situação</Th>
                <Th numeric>Ação</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => (
                <tr key={user.id}>
                  <Th scope="row">{user.nome}</Th>
                  <Td>{user.email}</Td>
                  <Td>{roleSelect(user)}</Td>
                  <Td>{status(user)}</Td>
                  <Td numeric>{toggleButton(user)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {users.isSuccess && all.length > 0 && !isDesktop && (
          <ul aria-label="Usuários e seus perfis" className={listStyles.list}>
            {visible.map((user) => (
              <li key={user.id} className={listStyles.item}>
                <div className={listStyles.main}>
                  <span className={listStyles.title}>
                    {user.nome}
                    {status(user)}
                  </span>
                  <span className={listStyles.meta}>{user.email}</span>
                </div>
                <div className={listStyles.side}>
                  {roleSelect(user)}
                  {toggleButton(user)}
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
        label="Paginação dos usuários"
      />
      <ConfirmDialog
        open={pending !== null}
        title={description?.title ?? ''}
        description={description?.text ?? ''}
        confirmLabel={description?.label ?? ''}
        tone={pending?.kind === 'deactivate' ? 'danger' : 'primary'}
        loading={updateUser.isPending}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </Card>
  )
}
