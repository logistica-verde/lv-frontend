import { Link } from 'react-router'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Página não encontrada')

  return (
    <>
      <h1>Página não encontrada</h1>
      <p>O endereço acessado não existe nesta aplicação.</p>
      <Link to="/">Voltar ao planejamento</Link>
    </>
  )
}
