import { useState } from 'react'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import HashText from '@/components/HashText/HashText'
import Skeleton from '@/components/Skeleton/Skeleton'
import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { useIntegrity } from '@/hooks/useIntegrity'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatDateTime } from '@/lib/format'
import { integrityPresentation } from '@/lib/integrityPresentation'
import { classNames } from '@/lib/classNames'
import styles from '@/pages/VerificationPage/VerdictCard.module.css'
import { describeError } from '@/services/errors'

type VerdictCardProps = {
  routeId: number
}

const MISSING = '—'
const DESKTOP_QUERY = '(min-width: 64rem)'

export default function VerdictCard({ routeId }: VerdictCardProps) {
  const integrity = useIntegrity(routeId)
  const [checking, setChecking] = useState(false)
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  const verify = () => {
    setChecking(true)
    void integrity.refetch().finally(() => setChecking(false))
  }

  if (integrity.isPending) {
    return (
      <Card fill>
        <div role="status" className={styles.loading}>
          <VisuallyHidden>Verificando integridade</VisuallyHidden>
          <Skeleton height="4rem" />
          <Skeleton height="6rem" />
        </div>
      </Card>
    )
  }

  if (integrity.isError) {
    return (
      <Card fill>
        <ErrorMessage message={describeError(integrity.error)} onRetry={verify} />
      </Card>
    )
  }

  const report = integrity.data
  const { tone, label, message, Icon } = integrityPresentation[report.status]
  const bothHashes = report.ledgerHash !== null
  const identical = report.ledgerHash === report.databaseHash

  return (
    <Card fill>
      <section aria-label="Resultado da verificação" className={styles.result}>
        <div className={classNames(styles.verdict, styles[tone])}>
          <Icon size={28} aria-hidden="true" />
          <div>
            <p className={styles.label}>{label}</p>
            <p role={report.status === 'TAMPERED' ? 'alert' : 'status'} className={styles.message}>
              {message}
            </p>
          </div>
        </div>
        <div className={styles.hashes}>
          <div>
            <h3 className={styles.hashTitle}>Hash recalculado (banco)</h3>
            <HashText full={isDesktop} value={report.databaseHash} label="hash recalculado" />
          </div>
          <div>
            <h3 className={styles.hashTitle}>Hash ancorado (blockchain)</h3>
            {report.ledgerHash ? (
              <HashText full={isDesktop} value={report.ledgerHash} label="hash ancorado" />
            ) : (
              <span>{MISSING}</span>
            )}
          </div>
        </div>
        {bothHashes && (
          <p className={styles.comparison}>
            {identical ? 'Os dois hashes são idênticos.' : 'Os dois hashes são diferentes.'}
          </p>
        )}
        <dl className={styles.details}>
          <div>
            <dt>Transação</dt>
            <dd>
              {report.txHash ? (
                <HashText full={isDesktop} value={report.txHash} label="transação" />
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
    </Card>
  )
}
