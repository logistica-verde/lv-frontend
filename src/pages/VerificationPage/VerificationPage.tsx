import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import Button from '@/components/Button/Button'
import Card from '@/components/Card/Card'
import EmptyState from '@/components/EmptyState/EmptyState'
import Tabs from '@/components/Tabs/Tabs'
import TextField from '@/components/TextField/TextField'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import OperationData from '@/pages/VerificationPage/OperationData'
import VerdictCard from '@/pages/VerificationPage/VerdictCard'
import styles from '@/pages/VerificationPage/VerificationPage.module.css'
import { verificationSchema } from '@/pages/VerificationPage/verificationSchema'
import type { VerificationInput } from '@/pages/VerificationPage/verificationSchema'

const DESKTOP_QUERY = '(min-width: 64rem)'

function parseId(value: string | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export default function VerificationPage() {
  useDocumentTitle('Verificação de integridade')
  const { routeId } = useParams()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const id = parseId(routeId)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationInput>({
    resolver: zodResolver(verificationSchema),
    values: { routeId: id ?? Number.NaN },
  })

  const submit = handleSubmit(({ routeId: next }) => navigate(`/verificacao/${next}`))

  const verdict = id === null ? null : <VerdictCard key={id} routeId={id} />
  const data = id === null ? null : <OperationData key={id} routeId={id} />

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1>Verificação de integridade</h1>
        <form onSubmit={submit} noValidate className={styles.search}>
          <TextField
            label="ID da operação"
            type="number"
            inputMode="numeric"
            min={1}
            error={errors.routeId?.message}
            {...register('routeId', { valueAsNumber: true })}
          />
          <Button type="submit">Verificar integridade</Button>
        </form>
      </div>
      {routeId !== undefined && id === null && (
        <p role="alert" className={styles.invalid}>
          O ID informado na URL não é válido. Use um número inteiro maior que zero.
        </p>
      )}
      {id === null && routeId === undefined && (
        <Card>
          <EmptyState
            title="Nenhuma operação selecionada"
            description="Informe o ID de uma operação para comparar o hash do banco com o hash ancorado na blockchain."
          />
        </Card>
      )}
      {verdict && data && isDesktop && (
        <div className={styles.workspace}>
          {verdict}
          {data}
        </div>
      )}
      {verdict && data && !isDesktop && (
        <Tabs
          label="Seções da verificação"
          className={styles.tabs}
          items={[
            { id: 'verdict', label: 'Veredito', content: verdict },
            { id: 'data', label: 'Dados', content: data },
          ]}
        />
      )}
    </div>
  )
}
