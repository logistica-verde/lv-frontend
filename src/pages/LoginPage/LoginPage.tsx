import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import BrandMark from '@/components/BrandMark/BrandMark'
import Button from '@/components/Button/Button'
import IconButton from '@/components/IconButton/IconButton'
import TextField from '@/components/TextField/TextField'
import { isMockMode } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSession } from '@/hooks/useSession'
import { homeFor } from '@/lib/permissions'
import { setSession } from '@/lib/session'
import styles from '@/pages/LoginPage/LoginPage.module.css'
import RouteIllustration from '@/pages/LoginPage/RouteIllustration'
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
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [forgotOpen, setForgotOpen] = useState(false)
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
      setSession(next, remember)
      navigate(from ?? homeFor(next.usuario.perfil), { replace: true })
    } catch {
      return
    }
  })

  return (
    <div className={styles.page}>
      <aside className={styles.pitch}>
        <div className={styles.brand}>
          <BrandMark size={40} />
          <span>Lastro</span>
        </div>
        <div className={styles.pitchBody}>
          <p className={styles.eyebrow}>Roteirização sustentável · auditoria em blockchain</p>
          <h2 className={styles.headline}>
            Compare a rota mais curta com a de menor emissão e prove que os dados não mudaram.
          </h2>
          <p className={styles.lead}>
            O Lastro calcula as duas rotas com um algoritmo genético e o modelo de emissões MEET, e
            registra o hash de cada operação em um nó Hyperledger Besu para que auditores confiem na
            integridade do histórico.
          </p>
          <RouteIllustration />
          <ul className={styles.legend} aria-label="Legenda da ilustração">
            <li>
              <span className={styles.lineEmission} aria-hidden="true" />
              Menor emissão
            </li>
            <li>
              <span className={styles.lineDistance} aria-hidden="true" />
              Menor distância
            </li>
            <li>
              <span className={styles.depot} aria-hidden="true" />
              Centro de distribuição
            </li>
          </ul>
        </div>
        <p className={styles.stack}>SHA-256 · Hyperledger Besu · OpenStreetMap · modelo MEET</p>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.formBlock}>
          <h1 className={styles.title}>Entrar no Lastro</h1>
          <p className={styles.subtitle}>
            {from
              ? 'Entre para continuar de onde parou.'
              : 'Use o e-mail e a senha cadastrados pelo administrador da sua transportadora.'}
          </p>
          <form onSubmit={submit} noValidate className={styles.form}>
            <TextField
              label="E-mail"
              type="email"
              placeholder="nome@transportadora.com.br"
              autoComplete="username"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              error={errors.senha?.message}
              labelAction={
                <button
                  type="button"
                  className={styles.linkButton}
                  aria-expanded={forgotOpen}
                  onClick={() => setForgotOpen((open) => !open)}
                >
                  Esqueci minha senha
                </button>
              }
              adornment={
                <IconButton
                  label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((shown) => !shown)}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </IconButton>
              }
              {...register('senha')}
            />
            {forgotOpen && (
              <p role="note" className={styles.forgot}>
                A redefinição de senha é feita pelo administrador da sua transportadora. Peça a ele
                uma nova senha.
              </p>
            )}
            <label className={styles.remember}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Manter conectado neste dispositivo
            </label>
            {signIn.isError && (
              <p role="alert" className={styles.failure}>
                {describeLoginError(signIn.error)}
              </p>
            )}
            <Button type="submit" loading={signIn.isPending} className={styles.submit}>
              Entrar
            </Button>
          </form>
          <hr className={styles.rule} />
          <p className={styles.access}>
            Ainda não tem acesso? O administrador da sua transportadora cria o usuário com o perfil
            de Operador, Auditor ou Administrador.
          </p>
          {isMockMode() && (
            <p role="note" className={styles.notice}>
              Ambiente com dados simulados. As contas de teste estão no arquivo de dados do mock.
            </p>
          )}
        </div>
        <footer className={styles.footer}>
          <span className={styles.secure}>
            <Lock size={14} aria-hidden="true" />
            {window.location.protocol === 'https:' ? 'Conexão protegida por HTTPS · ' : ''}
            sessão válida por 8 horas
          </span>
          <span>TCC · Ciência da Computação · UNIP · 2026</span>
        </footer>
      </main>
    </div>
  )
}
