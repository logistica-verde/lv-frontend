import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSession } from '@/hooks/useSession'
import { canAccess, homeFor } from '@/lib/permissions'
import type { Role } from '@/services/schemas/user'

type RequireAuthProps = {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const session = useSession()
  const location = useLocation()

  if (!session) {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    )
  }
  return children
}

type RequireRoleProps = {
  roles: readonly Role[]
  redirectToHome?: boolean
  children: ReactNode
}

function ForbiddenPage({ home }: { home: string }) {
  useDocumentTitle('Sem permissão')

  return (
    <>
      <h1>Sem permissão para acessar esta página</h1>
      <p>Seu perfil não inclui esta área. Fale com um administrador se precisar de acesso.</p>
      <Link to={home}>Ir para o início</Link>
    </>
  )
}

export function RequireRole({ roles, redirectToHome = false, children }: RequireRoleProps) {
  const session = useSession()

  if (!session) {
    return null
  }
  if (canAccess(session.usuario.perfil, roles)) {
    return children
  }
  const home = homeFor(session.usuario.perfil)
  return redirectToHome ? <Navigate to={home} replace /> : <ForbiddenPage home={home} />
}
