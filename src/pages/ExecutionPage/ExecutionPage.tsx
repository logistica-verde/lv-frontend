import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import Button from '@/components/Button/Button'
import CancelRouteDialog from '@/components/Schedule/CancelRouteDialog'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Skeleton from '@/components/Skeleton/Skeleton'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useCancelExecution, useExecution, useStartExecution } from '@/hooks/useExecutions'
import { useRoute } from '@/hooks/useRoutes'
import { useToast } from '@/hooks/useToast'
import { formatShortDateTime } from '@/lib/format'
import NavigationView from '@/pages/ExecutionPage/NavigationView'
import styles from '@/pages/ExecutionPage/ExecutionPage.module.css'
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage'
import { describeError } from '@/services/errors'
import type { Execution } from '@/services/schemas/execution'

function parseId(value: string | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

type NoticeProps = {
  title: string
  children?: string
  action?: ReactNode
}

function Notice({ title, children, action }: NoticeProps) {
  return (
    <main className={styles.notice}>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
      <div className={styles.noticeActions}>
        {action}
        <Link to="/">Voltar ao planejamento</Link>
      </div>
    </main>
  )
}

function InProgress({ execution }: { execution: Execution }) {
  const route = useRoute(execution.operationId)

  if (route.isError) {
    return (
      <main className={styles.notice}>
        <ErrorMessage message={describeError(route.error)} onRetry={() => route.refetch()} />
      </main>
    )
  }
  if (!route.data) {
    return (
      <main className={styles.notice}>
        <Skeleton height="6rem" />
      </main>
    )
  }
  return <NavigationView execution={execution} route={route.data} />
}

function Scheduled({ execution }: { execution: Execution }) {
  const start = useStartExecution()
  const cancel = useCancelExecution()
  const { notify } = useToast()
  const [cancelling, setCancelling] = useState(false)

  return (
    <>
      <Notice
        title="Esta rota está agendada"
        action={
          <>
            <Button
              loading={start.isPending}
              onClick={() =>
                start.mutate(execution.id, {
                  onError: (error) => notify(describeError(error), 'danger'),
                })
              }
            >
              Iniciar agora
            </Button>
            <Button variant="ghost" onClick={() => setCancelling(true)}>
              Cancelar agendamento
            </Button>
          </>
        }
      >
        {execution.scheduledAt
          ? `Prevista para ${formatShortDateTime(execution.scheduledAt)}.`
          : undefined}
      </Notice>
      <CancelRouteDialog
        open={cancelling}
        title="Cancelar o agendamento"
        confirmLabel="Cancelar agendamento"
        loading={cancel.isPending}
        onBack={() => setCancelling(false)}
        onConfirm={(reason) =>
          cancel.mutate(
            { id: execution.id, reason },
            {
              onSuccess: () => {
                setCancelling(false)
                notify('Agendamento cancelado.', 'info')
              },
              onError: (error) => notify(describeError(error), 'danger'),
            },
          )
        }
      />
    </>
  )
}

export default function ExecutionPage() {
  useDocumentTitle('Navegação')
  const { id } = useParams()
  const executionId = parseId(id)
  const execution = useExecution(executionId ?? 0)

  if (executionId === null) {
    return <NotFoundPage />
  }
  if (execution.isError) {
    return (
      <main className={styles.notice}>
        <ErrorMessage message={describeError(execution.error)} onRetry={() => execution.refetch()} />
      </main>
    )
  }
  if (!execution.data) {
    return (
      <main className={styles.notice}>
        <Skeleton height="6rem" />
      </main>
    )
  }

  switch (execution.data.status) {
    case 'IN_PROGRESS':
      return <InProgress execution={execution.data} />
    case 'SCHEDULED':
      return <Scheduled execution={execution.data} />
    case 'FINISHED':
      return <Notice title="Esta rota já foi finalizada" />
    default:
      return (
        <Notice title="Esta rota foi cancelada">
          {execution.data.cancellationReason ? `Motivo: ${execution.data.cancellationReason}` : undefined}
        </Notice>
      )
  }
}
