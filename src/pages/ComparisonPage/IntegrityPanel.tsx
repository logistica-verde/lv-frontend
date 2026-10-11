import { useState } from 'react'
import Button from '@/components/Button/Button'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import Skeleton from '@/components/Skeleton/Skeleton'
import StatusBadge from '@/components/StatusBadge/StatusBadge'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useIntegrity } from '@/hooks/useIntegrity'
import { formatDateTime } from '@/lib/format'
import styles from '@/pages/ComparisonPage/IntegrityPanel.module.css'
import { describeError } from '@/services/errors'
import type { IntegrityStatus } from '@/services/schemas/integrity'

type IntegrityPanelProps = {
  routeId: number
}

type Presentation = {
  tone: 'success' | 'danger' | 'warning'
  label: string
  message: string
}

const PRESENTATIONS: Record<IntegrityStatus, Presentation> = {
  VALID: {
    tone: 'success',
    label: 'Íntegra',
    message: 'Os dados da rota conferem com o registro na blockchain.',
  },
  TAMPERED: {
    tone: 'danger',
    label: 'Adulterada',
    message: 'Os dados da rota no banco diferem do registro na blockchain.',
  },
  NOT_ANCHORED: {
    tone: 'warning',
    label: 'Aguardando registro',
    message: 'A rota ainda não foi registrada na blockchain. A verificação se repete sozinha.',
  },
}

const MISSING = '—'

export default function IntegrityPanel({ routeId }: IntegrityPanelProps) {
  const integrity = useIntegrity(routeId)
  const [checking, setChecking] = useState(false)

  const verify = () => {
    setChecking(true)
    void integrity.refetch().finally(() => setChecking(false))
  }

  if (integrity.isPending) {
    return (
      <div role="status" className={styles.panel}>
        <VisuallyHidden>Verificando integridade</VisuallyHidden>
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
  const presentation = PRESENTATIONS[report.status]

  return (
    <section aria-label="Integridade na blockchain" className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Integridade na blockchain</h3>
        <StatusBadge tone={presentation.tone}>{presentation.label}</StatusBadge>
      </div>
      <p role={report.status === 'TAMPERED' ? 'alert' : 'status'} className={styles.message}>
        {presentation.message}
      </p>
      <dl className={styles.details}>
        <div>
          <dt>Hash no banco</dt>
          <dd className={styles.hash}>{report.databaseHash}</dd>
        </div>
        <div>
          <dt>Hash na blockchain</dt>
          <dd className={styles.hash}>{report.ledgerHash ?? MISSING}</dd>
        </div>
        <div>
          <dt>Transação</dt>
          <dd className={styles.hash}>{report.txHash ?? MISSING}</dd>
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
