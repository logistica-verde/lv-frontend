import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import PlanningPage from '@/pages/PlanningPage/PlanningPage'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import { apiUrl } from '@/test/api'
import { deliveryPointFixture, vehicleFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

const secondPoint: DeliveryPoint = {
  ...deliveryPointFixture,
  id: 11,
  nome: 'MASP',
  latitude: -23.56,
}

const postedPointSchema = z.object({
  nome: z.string(),
  endereco: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
})

type FakeApi = {
  points: DeliveryPoint[]
  posted: z.infer<typeof postedPointSchema>[]
}

function useDeliveryPointsApi(initial: DeliveryPoint[]): FakeApi {
  const api: FakeApi = { points: [...initial], posted: [] }
  server.use(
    http.get(apiUrl('/api/delivery-points'), () => HttpResponse.json(api.points)),
    http.post(apiUrl('/api/delivery-points'), async ({ request }) => {
      const body = postedPointSchema.parse(await request.json())
      api.posted.push(body)
      const created = {
        ...deliveryPointFixture,
        ...body,
        endereco: body.endereco ?? null,
        id: api.points.length + 100,
      }
      api.points.push(created)
      return HttpResponse.json(created, { status: 201 })
    }),
  )
  return api
}

beforeEach(() => {
  server.use(http.get(apiUrl('/api/vehicles'), () => HttpResponse.json([vehicleFixture])))
})

describe('PlanningPage points', () => {
  it('shows the map and a loading state while the points load', async () => {
    server.use(
      http.get(apiUrl('/api/delivery-points'), async () => {
        await delay(30)
        return HttpResponse.json([deliveryPointFixture])
      }),
    )

    renderWithProviders(<PlanningPage />)

    expect(screen.getByRole('region', { name: 'Mapa dos pontos de entrega' })).toBeInTheDocument()
    expect(await screen.findByRole('checkbox', { name: 'Praça da Sé' })).toBeInTheDocument()
  })

  it('places a marker and a list entry for every delivery point', async () => {
    useDeliveryPointsApi([deliveryPointFixture, secondPoint])

    renderWithProviders(<PlanningPage />)

    expect(await screen.findByRole('button', { name: 'Praça da Sé' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'MASP' })).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('invites the user to create the first point when there is none', async () => {
    useDeliveryPointsApi([])

    renderWithProviders(<PlanningPage />)

    expect(await screen.findByRole('heading', { name: 'Nenhum ponto de entrega' })).toBeVisible()
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

describe('PlanningPage selection', () => {
  it('explains the limits before anything is selected', async () => {
    useDeliveryPointsApi([deliveryPointFixture, secondPoint])

    renderWithProviders(<PlanningPage />)

    expect(
      await screen.findByText('Selecione de 2 a 30 pontos para calcular a rota.'),
    ).toBeVisible()
  })

  it('selects points from the list and updates the count and the markers', async () => {
    useDeliveryPointsApi([deliveryPointFixture, secondPoint])
    renderWithProviders(<PlanningPage />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('checkbox', { name: 'Praça da Sé' }))

    expect(screen.getByText('1 ponto selecionado. Selecione pelo menos 2.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Praça da Sé' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'MASP' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('checkbox', { name: 'MASP' }))

    expect(screen.getByText('2 pontos selecionados.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'MASP' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('checkbox', { name: 'MASP' }))

    expect(screen.getByText('1 ponto selecionado. Selecione pelo menos 2.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'MASP' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('blocks new selections once the maximum is reached', async () => {
    const many = Array.from({ length: 31 }, (_, index) => ({
      ...deliveryPointFixture,
      id: index + 1,
      nome: `Ponto ${index + 1}`,
      latitude: -23.5 - index / 1000,
    }))
    useDeliveryPointsApi(many)
    renderWithProviders(<PlanningPage />)
    const user = userEvent.setup()
    await screen.findByRole('checkbox', { name: 'Ponto 1' })

    for (let index = 1; index <= 30; index += 1) {
      await user.click(screen.getByRole('checkbox', { name: `Ponto ${index}` }))
    }

    expect(screen.getByText('30 pontos selecionados. Limite máximo atingido.')).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Ponto 31' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Ponto 1' })).toBeEnabled()
  }, 20000)
})

describe('PlanningPage new point form', () => {
  it('asks for the name and coordinates and sends nothing when empty', async () => {
    const api = useDeliveryPointsApi([deliveryPointFixture])
    renderWithProviders(<PlanningPage />)
    await screen.findByRole('checkbox', { name: 'Praça da Sé' })

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar ponto' }))

    expect(await screen.findByText('Informe o nome')).toBeVisible()
    expect(screen.getByText('Informe a latitude')).toBeVisible()
    expect(screen.getByText('Informe a longitude')).toBeVisible()
    expect(api.posted).toHaveLength(0)
  })

  it('rejects coordinates outside the valid range', async () => {
    const api = useDeliveryPointsApi([deliveryPointFixture])
    renderWithProviders(<PlanningPage />)
    await screen.findByRole('checkbox', { name: 'Praça da Sé' })
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Nome'), 'Longe')
    await user.type(screen.getByLabelText('Latitude'), '95')
    await user.type(screen.getByLabelText('Longitude'), '-200')
    await user.click(screen.getByRole('button', { name: 'Cadastrar ponto' }))

    expect(await screen.findByText('Latitude máxima: 90')).toBeVisible()
    expect(screen.getByText('Longitude mínima: -180')).toBeVisible()
    expect(api.posted).toHaveLength(0)
  })

  it('registers a point, confirms, selects it and clears the form', async () => {
    const api = useDeliveryPointsApi([deliveryPointFixture])
    renderWithProviders(<PlanningPage />)
    await screen.findByRole('checkbox', { name: 'Praça da Sé' })
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Nome'), '  Parque Ibirapuera  ')
    await user.type(screen.getByLabelText('Latitude'), '-23.5874')
    await user.type(screen.getByLabelText('Longitude'), '-46.6576')
    await user.click(screen.getByRole('button', { name: 'Cadastrar ponto' }))

    expect(await screen.findByText('Ponto Parque Ibirapuera cadastrado.')).toBeVisible()
    expect(api.posted).toEqual([
      { nome: 'Parque Ibirapuera', latitude: -23.5874, longitude: -46.6576 },
    ])
    expect(await screen.findByRole('checkbox', { name: 'Parque Ibirapuera' })).toBeChecked()
    expect(screen.getByLabelText('Nome')).toHaveValue('')
    expect(screen.getByLabelText('Latitude')).toHaveValue(null)
  })

  it('shows a preview marker while valid coordinates are typed', async () => {
    useDeliveryPointsApi([deliveryPointFixture])
    renderWithProviders(<PlanningPage />)
    await screen.findByRole('checkbox', { name: 'Praça da Sé' })
    const user = userEvent.setup()

    expect(screen.queryByRole('button', { name: 'Novo ponto' })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Latitude'), '-23.58')
    await user.type(screen.getByLabelText('Longitude'), '-46.65')

    expect(await screen.findByRole('button', { name: 'Novo ponto' })).toBeInTheDocument()
  })

  it('keeps what was typed and shows the API message when registering fails', async () => {
    server.use(
      http.get(apiUrl('/api/delivery-points'), () => HttpResponse.json([deliveryPointFixture])),
      http.post(apiUrl('/api/delivery-points'), () =>
        HttpResponse.json({ status: 400, detail: 'Invalid request content.' }, { status: 400 }),
      ),
    )
    renderWithProviders(<PlanningPage />)
    await screen.findByRole('checkbox', { name: 'Praça da Sé' })
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Nome'), 'Teste')
    await user.type(screen.getByLabelText('Latitude'), '-23.5')
    await user.type(screen.getByLabelText('Longitude'), '-46.6')
    await user.click(screen.getByRole('button', { name: 'Cadastrar ponto' }))

    expect(await screen.findByText('Invalid request content.')).toBeVisible()
    expect(screen.getByLabelText('Nome')).toHaveValue('Teste')
    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('checkbox')).toHaveLength(1)
  })
})
