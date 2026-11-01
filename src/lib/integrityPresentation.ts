import { Clock, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { IntegrityStatus } from '@/services/schemas/integrity'

type IntegrityPresentation = {
  tone: 'success' | 'danger' | 'warning'
  label: string
  message: string
  Icon: LucideIcon
}

export const integrityPresentation: Record<IntegrityStatus, IntegrityPresentation> = {
  VALID: {
    tone: 'success',
    label: 'Íntegra',
    message: 'Os dados da rota conferem com o registro na blockchain.',
    Icon: ShieldCheck,
  },
  TAMPERED: {
    tone: 'danger',
    label: 'Alterada',
    message: 'Os dados da rota no banco diferem do registro na blockchain.',
    Icon: ShieldAlert,
  },
  NOT_ANCHORED: {
    tone: 'warning',
    label: 'Aguardando registro',
    message: 'A rota ainda não foi registrada na blockchain. A verificação se repete sozinha.',
    Icon: Clock,
  },
  ANCHOR_FAILED: {
    tone: 'danger',
    label: 'Registro não concluído',
    message:
      'O registro na blockchain falhou em todas as tentativas. Os dados desta rota não estão protegidos; avise o administrador.',
    Icon: ShieldOff,
  },
}
