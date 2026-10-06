import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function PlanningPage() {
  useDocumentTitle('Planejamento de rotas')

  return (
    <>
      <h1>Planejamento de rotas</h1>
      <p>Escolha os pontos de entrega para calcular e comparar rotas.</p>
    </>
  )
}
