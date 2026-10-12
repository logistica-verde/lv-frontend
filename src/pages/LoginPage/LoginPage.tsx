import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Route } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import Button from '@/components/Button/Button'
import TextField from '@/components/TextField/TextField'
import { isMockMode } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSession } from '@/hooks/useSession'
import { homeFor } from '@/lib/permissions'
import { setSession } from '@/lib/session'
import styles from '@/pages/LoginPage/LoginPage.module.css'
import { login } from '@/services/authService'
import { ApiError, describeError } from '@/services/errors'
import { loginInputSchema } from '@/services/schemas/auth'
import type { LoginInput } from '@/services/schemas/auth'

const locationStateSchema = z.object({ from: z.string().startsWith('/') })

function describeLoginError(error: Error): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'E-mail ou senha incorretos. Confira os dados e tente de novo.'
  }
  if (error instanceof ApiError && error.status === 403) {
    return 'Este usuário está desativado. Fale com um administrador.'
  }
  return describeError(error)
}

export default function LoginPage() {
  useDocumentTitle('Entrar')
  const session = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const redirected = locationStateSchema.safeParse(location.state)
  const from = redirected.success ? redirected.data.from : null
  const signIn = useMutation({ mutationFn: login })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginInputSchema), mode: 'onTouched' })

  if (session) {
    return <Navigate to={from ?? homeFor(session.usuario.perfil)} replace />
  }

  const submit = handleSubmit(async (input) => {
    try {
      const next = await signIn.mutateAsync(input)
      setSession(next)
      navigate(from ?? homeFor(next.usuario.perfil), { replace: true })
    } catch {
      return
    }
  })

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <Route size={20} />
          </span>
          <span className={styles.brandName}>Logística Verde</span>
        </div>
        <h1 className={styles.title}>Entrar</h1>
        <p className={styles.subtitle}>
          {from
            ? 'Entre para continuar de onde parou.'
            : 'Use o e-mail e a senha da sua conta para acessar o sistema.'}
        </p>
        <form onSubmit={submit} noValidate className={styles.form}>
          <TextField
            label="E-mail"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Senha"
            type="password"
            autoComplete="current-password"
            error={errors.senha?.message}
            {...register('senha')}
          />
          {signIn.isError && (
            <p role="alert" className={styles.failure}>
              {describeLoginError(signIn.error)}
            </p>
          )}
          <Button type="submit" loading={signIn.isPending} className={styles.submit}>
            Entrar
          </Button>
        </form>
        {isMockMode() && (
          <p role="note" className={styles.notice}>
            Ambiente com dados simulados. As contas de teste estão no arquivo de dados do mock.
          </p>
        )}
      </div>
    </main>
  )
}
