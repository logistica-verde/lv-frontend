import StatusBadge from '@/components/StatusBadge/StatusBadge'
import { integrityPresentation } from '@/lib/integrityPresentation'
import type { IntegrityStatus } from '@/services/schemas/integrity'

type IntegrityBadgeProps = {
  status: IntegrityStatus
}

export default function IntegrityBadge({ status }: IntegrityBadgeProps) {
  const { tone, label, Icon } = integrityPresentation[status]

  return (
    <StatusBadge tone={tone}>
      <Icon size={14} aria-hidden="true" />
      {label}
    </StatusBadge>
  )
}
