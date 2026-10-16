import { Link } from 'react-router'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import IntegrityBadge from '@/components/IntegrityBadge/IntegrityBadge'
import { useRecentVerifications } from '@/hooks/useRecentVerifications'
import { useSession } from '@/hooks/useSession'
import { formatShortDateTime } from '@/lib/format'
import { clearRecentVerifications } from '@/lib/recentVerifications'
import styles from '@/pages/VerificationPage/RecentVerifications.module.css'

export default function RecentVerifications() {
  const session = useSession()
  const userId = session?.usuario.id ?? null
  const recent = useRecentVerifications(userId)

  return (
    <Card
      title="Suas verificações recentes"
      actions={
        recent.length > 0 && userId !== null ? (
          <Button variant="ghost" size="sm" onClick={() => clearRecentVerifications(userId)}>
            Limpar
          </Button>
        ) : undefined
      }
    >
      {recent.length === 0 ? (
        <p className={styles.empty}>As operações que você verificar aparecem aqui.</p>
      ) : (
        <ul aria-label="Verificações recentes" className={styles.list}>
          {recent.map((item) => (
            <li key={item.operationId} className={styles.item}>
              <Link to={`/verificacao/${item.operationId}`} className={styles.operation}>
                Operação #{item.operationId}
              </Link>
              <span className={styles.when}>{formatShortDateTime(item.checkedAt)}</span>
              <IntegrityBadge status={item.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
