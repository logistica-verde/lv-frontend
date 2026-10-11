import { useState } from 'react'
import Button from '@/components/Button/Button'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import HashText from '@/components/HashText/HashText'
import Skeleton from '@/components/Skeleton/Skeleton'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useIntegrity } from '@/hooks/useIntegrity'
import { formatDateTime } from '@/lib/format'
import { integrityPresentation } from '@/pages/ComparisonPage/integrityPresentation'
import styles from '@/pages/ComparisonPage/IntegrityPanel.module.css'
import { describeError } from '@/services/errors'

type IntegrityPanelProps = {
  routeId: number
  title: string
}

const MISSING = '—'

export default function IntegrityPanel({ routeId, title }: IntegrityPanelProps) {
  const integrity = useIntegrity(routeId)
  const [checking, setChecking] = useState(false)

  const verify = () => {
    setChecking(true)
    void integrity.refetch().finally(() => setChecking(false))
  }

  if (integrity.isPending) {
    return (
      <div role="status" className={styles.panel}>
        <VisuallyHidden>{`Verificando integridade: ${title}`}</VisuallyHidden>
        <Skeleton height="1.5rem" />
      </div>
    )
  }

  if (integrity.isError) {
    return (
      <div className={styles.panel}>
        <ErrorMessage message={describeError(integrity.error)} onRetry={verify} />
      </div>
    )
  }

  const report = integrity.data
  const { tone, label, message, Icon } = integrityPresentation[report.status]

  return (
    <section aria-label={`Integridade: ${title}`} className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <StatusBadge tone={tone}>
          <Icon size={14} aria-hidden="true" />
          {label}
        </StatusBadge>
      </div>
      <p role={report.status === 'TAMPERED' ? 'alert' : 'status'} className={styles.message}>
        {message}
      </p>
      <dl className={styles.details}>
        <div>
          <dt>Hash no banco</dt>
          <dd>
            <HashText full value={report.databaseHash} label={`hash no banco (${title})`} />
          </dd>
        </div>
        <div>
          <dt>Hash na blockchain</dt>
          <dd>
            {report.ledgerHash ? (
              <HashText full value={report.ledgerHash} label={`hash na blockchain (${title})`} />
            ) : (
              MISSING
            )}
          </dd>
        </div>
        <div>
          <dt>Transação</dt>
          <dd>
            {report.txHash ? (
              <HashText full value={report.txHash} label={`transação (${title})`} />
            ) : (
              MISSING
            )}
          </dd>
        </div>
        <div>
          <dt>Bloco</dt>
          <dd>{report.blockNumber ?? MISSING}</dd>
        </div>
        <div>
          <dt>Registrada em</dt>
          <dd>{report.anchoredAt ? formatDateTime(report.anchoredAt) : MISSING}</dd>
        </div>
      </dl>
      <div className={styles.actions}>
        <Button variant="secondary" loading={checking} onClick={verify}>
          Verificar novamente
        </Button>
      </div>
    </section>
  )
}
