import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import PlanningPage from '@/pages/PlanningPage/PlanningPage'
import { apiUrl } from '@/test/api'
import { deliveryPointFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

const secondPoint = { ...deliveryPointFixture, id: 11, nome: 'MASP', latitude: -23.56 }

describe('PlanningPage', () => {
  it('shows the map and a loading message while the points load', async () => {
    server.use(
      http.get(apiUrl('/api/delivery-points'), async () => {
        await delay(30)
        return HttpResponse.json([deliveryPointFixture])
      }),
    )

    renderWithProviders(<PlanningPage />)

    expect(screen.getByRole('region', { name: 'Mapa dos pontos de entrega' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Carregando pontos de entrega…')
    expect(await screen.findByText('1 ponto de entrega cadastrado.')).toBeVisible()
  })

  it('places a marker for every delivery point', async () => {
    server.use(
      http.get(apiUrl('/api/delivery-points'), () =>
        HttpResponse.json([deliveryPointFixture, secondPoint]),
      ),
    )

    renderWithProviders(<PlanningPage />)

    expect(await screen.findByRole('button', { name: 'Praça da Sé' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'MASP' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 pontos de entrega cadastrados.')
  })

  it('says so when there are no points yet', async () => {
    server.use(http.get(apiUrl('/api/delivery-points'), () => HttpResponse.json([])))

    renderWithProviders(<PlanningPage />)

    expect(await screen.findByText('Nenhum ponto de entrega cadastrado.')).toBeVisible()
  })

  it('explains a failure and recovers on retry', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/api/delivery-points'), () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 500, detail: 'boom' }, { status: 500 })
          : HttpResponse.json([deliveryPointFixture])
      }),
    )
    renderWithProviders(<PlanningPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('button', { name: 'Praça da Sé' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
