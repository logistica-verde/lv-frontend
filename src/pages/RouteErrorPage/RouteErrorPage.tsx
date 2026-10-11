import Button from '@/components/Button/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function RouteErrorPage() {
  useDocumentTitle('Erro')

  return (
    <div role="alert">
      <h1>Algo deu errado</h1>
      <p>Não foi possível exibir esta página.</p>
      <Button onClick={() => window.location.reload()}>Recarregar a página</Button>
    </div>
  )
}
