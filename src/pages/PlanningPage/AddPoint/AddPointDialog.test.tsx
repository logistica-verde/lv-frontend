import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import AddPointDialog from '@/pages/PlanningPage/AddPoint/AddPointDialog'
import type { AddPointTab } from '@/pages/PlanningPage/AddPoint/AddPointDialog'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import { apiUrl } from '@/test/api'
import { useDeliveryPointsApi } from '@/test/fakeApi'
import { deliveryPointFixture } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'

function point(id: number, overrides: Partial<DeliveryPoint> = {}): DeliveryPoint {
  return { ...deliveryPointFixture, id, nome: `Ponto ${id}`, endereco: `Rua ${id}`, ...overrides }
}

type RenderOptions = {
  initialTab?: AddPointTab
  initialPosition?: [number, number] | null
  selected?: DeliveryPoint[]
  registered?: DeliveryPoint[]
}

function renderDialog(options: RenderOptions = {}) {
  const onClose = vi.fn()
  const onAdded = vi.fn()
  renderWithProviders(
    <AddPointDialog
      open
      initialTab={options.initialTab ?? 'existing'}
      initialPosition={options.initialPosition ?? null}
      selected={options.selected ?? []}
      registered={options.registered ?? []}
      onClose={onClose}
      onAdded={onAdded}
    />,
  )
  return { onClose, onAdded }
}

describe('AddPointDialog', () => {
  it('is a dialog with the four ways to add a point', () => {
    renderDialog()

    expect(screen.getByRole('dialog', { name: 'Adicionar ponto' })).toBeVisible()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Cadastrados',
      'Endereço',
      'Coordenadas',
      'CSV',
    ])
  })

  it('opens on the requested tab', () => {
    renderDialog({ initialTab: 'coordinates' })

    expect(screen.getByRole('tab', { name: 'Coordenadas' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('says the limit was reached instead of offering ways to add more', () => {
    const selected = Array.from({ length: 30 }, (_, index) => point(index + 1))

    renderDialog({ selected })

    expect(screen.getByRole('alert')).toHaveTextContent('limite máximo')
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('closes with the close button', async () => {
    const { onClose } = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('registered points tab', () => {
  it('lists the active registered points that are not in the route yet', () => {
    renderDialog({
      registered: [point(1), point(2), point(3, { ativo: false }), point(4)],
      selected: [point(1)],
    })

    expect(screen.getAllByRole('checkbox').map((box) => box.parentElement?.textContent)).toEqual([
      'Ponto 2 · Rua 2',
      'Ponto 4 · Rua 4',
    ])
  })

  it('adds the checked points in the order they were checked', async () => {
    const registered = [point(1), point(2), point(3)]
    const { onAdded } = renderDialog({ registered })
    const user = userEvent.setup()

    await user.click(screen.getByRole('checkbox', { name: /Ponto 3/ }))
    await user.click(screen.getByRole('checkbox', { name: /Ponto 1/ }))
    await user.click(screen.getByRole('button', { name: 'Adicionar selecionados (2)' }))

    expect(onAdded).toHaveBeenCalledWith([registered[2], registered[0]])
  })

  it('cannot add anything until a point is checked', () => {
    renderDialog({ registered: [point(1)] })

    expect(screen.getByRole('button', { name: 'Adicionar selecionados (0)' })).toBeDisabled()
  })

  it('warns when the checked points would pass the maximum', async () => {
    const selected = Array.from({ length: 29 }, (_, index) => point(index + 1))
    const registered = [...selected, point(100), point(101)]
    renderDialog({ registered, selected })
    const user = userEvent.setup()

    await user.click(screen.getByRole('checkbox', { name: /Ponto 100/ }))
    await user.click(screen.getByRole('checkbox', { name: /Ponto 101/ }))

    expect(screen.getByRole('alert')).toHaveTextContent('A rota comporta mais 1 ponto')
    expect(screen.getByRole('button', { name: 'Adicionar selecionados (2)' })).toBeDisabled()
  })

  it('explains that there is nothing left to add', () => {
    renderDialog({ registered: [point(1)], selected: [point(1)] })

    expect(screen.getByRole('heading', { name: 'Nenhum ponto disponível' })).toBeVisible()
  })

  it('paginates the list', async () => {
    renderDialog({ registered: Array.from({ length: 6 }, (_, index) => point(index + 1)) })

    expect(screen.getAllByRole('checkbox')).toHaveLength(4)

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })
})

describe('address tab', () => {
  const GEOCODER = env.geocoderUrl
  const result = {
    display_name: 'Avenida Paulista, 1578, Bela Vista, São Paulo, SP, Brasil',
    lat: '-23.5614',
    lon: '-46.6559',
  }

  async function search(user: ReturnType<typeof userEvent.setup>, text: string) {
    await user.click(screen.getByRole('tab', { name: 'Endereço' }))
    await user.type(screen.getByRole('textbox', { name: 'Endereço' }), text)
    await user.click(screen.getByRole('button', { name: 'Buscar endereço' }))
  }

  it('searches an address, suggests a name and adds the chosen result', async () => {
    const api = useDeliveryPointsApi([])
    server.use(http.get(GEOCODER, () => HttpResponse.json([result])))
    const { onAdded } = renderDialog({ initialTab: 'address' })
    const user = userEvent.setup()

    await search(user, 'paulista 1578')
    await user.click(await screen.findByRole('radio', { name: /Avenida Paulista/ }))

    expect(screen.getByLabelText('Nome do ponto')).toHaveValue('Avenida Paulista')
    await user.clear(screen.getByLabelText('Nome do ponto'))
    await user.type(screen.getByLabelText('Nome do ponto'), 'MASP')
    await user.click(screen.getByRole('button', { name: 'Adicionar ponto' }))

    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1))
    expect(api.posted).toEqual([
      { nome: 'MASP', endereco: result.display_name, latitude: -23.5614, longitude: -46.6559 },
    ])
    expect(onAdded.mock.calls[0]?.[0]).toHaveLength(1)
  })

  it('does not offer to add until a result is chosen', async () => {
    server.use(http.get(GEOCODER, () => HttpResponse.json([result])))
    renderDialog({ initialTab: 'address' })
    const user = userEvent.setup()

    await search(user, 'paulista')

    expect(await screen.findByRole('radio', { name: /Avenida Paulista/ })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Adicionar ponto' })).toBeDisabled()
  })

  it('does not allow an empty name', async () => {
    server.use(http.get(GEOCODER, () => HttpResponse.json([result])))
    renderDialog({ initialTab: 'address' })
    const user = userEvent.setup()
    await search(user, 'paulista')
    await user.click(await screen.findByRole('radio', { name: /Avenida Paulista/ }))

    await user.clear(screen.getByLabelText('Nome do ponto'))

    expect(screen.getByRole('button', { name: 'Adicionar ponto' })).toBeDisabled()
  })

  it('tells when nothing was found and suggests the coordinates', async () => {
    server.use(http.get(GEOCODER, () => HttpResponse.json([])))
    renderDialog({ initialTab: 'address' })

    await search(userEvent.setup(), 'xyzxyz')

    expect(await screen.findByText(/Nenhum endereço encontrado/)).toBeVisible()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('explains a failure of the address service', async () => {
    server.use(http.get(GEOCODER, () => new HttpResponse(null, { status: 500 })))
    renderDialog({ initialTab: 'address' })

    await search(userEvent.setup(), 'paulista')

    expect(await screen.findByRole('alert')).toHaveTextContent('erro interno')
  })

  it('does nothing when the search is empty', async () => {
    let calls = 0
    server.use(
      http.get(GEOCODER, () => {
        calls += 1
        return HttpResponse.json([])
      }),
    )
    renderDialog({ initialTab: 'address' })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Buscar endereço' }))

    expect(calls).toBe(0)
  })
})

describe('coordinates tab', () => {
  it('starts with the position the user clicked on the map, rounded to six decimals', () => {
    renderDialog({ initialTab: 'coordinates', initialPosition: [-23.550519876, -46.633312345] })

    expect(screen.getByLabelText('Latitude')).toHaveValue(-23.55052)
    expect(screen.getByLabelText('Longitude')).toHaveValue(-46.633312)
  })

  it('asks for the name and coordinates and sends nothing when they are missing', async () => {
    const api = useDeliveryPointsApi([])
    renderDialog({ initialTab: 'coordinates' })

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ponto' }))

    expect(await screen.findByText('Informe o nome')).toBeVisible()
    expect(screen.getByText('Informe a latitude')).toBeVisible()
    expect(screen.getByText('Informe a longitude')).toBeVisible()
    expect(api.posted).toHaveLength(0)
  })

  it('rejects coordinates outside the valid range', async () => {
    renderDialog({ initialTab: 'coordinates' })
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Nome'), 'Longe')
    await user.type(screen.getByLabelText('Latitude'), '95')
    await user.type(screen.getByLabelText('Longitude'), '-200')
    await user.click(screen.getByRole('button', { name: 'Adicionar ponto' }))

    expect(await screen.findByText('Latitude máxima: 90')).toBeVisible()
    expect(screen.getByText('Longitude mínima: -180')).toBeVisible()
  })

  it('creates the point with a trimmed name and no empty address', async () => {
    const api = useDeliveryPointsApi([])
    const { onAdded } = renderDialog({
      initialTab: 'coordinates',
      initialPosition: [-23.5874, -46.6576],
    })

    await userEvent.type(screen.getByLabelText('Nome'), '  Parque Ibirapuera  ')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ponto' }))

    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1))
    expect(api.posted).toEqual([
      { nome: 'Parque Ibirapuera', latitude: -23.5874, longitude: -46.6576 },
    ])
  })

  it('shows the API message and keeps the dialog when creating fails', async () => {
    server.use(
      http.post(apiUrl('/api/delivery-points'), () =>
        HttpResponse.json({ status: 400, detail: 'Invalid request content.' }, { status: 400 }),
      ),
    )
    const { onAdded } = renderDialog({
      initialTab: 'coordinates',
      initialPosition: [-23.5, -46.6],
    })

    await userEvent.type(screen.getByLabelText('Nome'), 'Teste')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ponto' }))

    expect(await screen.findByText('Invalid request content.')).toBeVisible()
    expect(onAdded).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nome')).toHaveValue('Teste')
  })
})

describe('CSV tab', () => {
  const VALID_CSV = 'nome,latitude,longitude\nA,-23.5,-46.6\nB,-23.6,-46.7\n'

  function file(content: string) {
    return new File([content], 'pontos.csv', { type: 'text/csv' })
  }

  it('offers a template to download', () => {
    renderDialog({ initialTab: 'csv' })

    const link = screen.getByRole('link', { name: 'Baixar modelo' })
    expect(link).toHaveAttribute('download', 'modelo-pontos.csv')
    expect(link.getAttribute('href')).toContain('data:text/csv')
  })

  it('cannot import before a file is chosen', () => {
    renderDialog({ initialTab: 'csv' })

    expect(screen.getByRole('button', { name: 'Importar 0 pontos' })).toBeDisabled()
  })

  it('shows how many points are valid and imports them all', async () => {
    const api = useDeliveryPointsApi([])
    const { onAdded } = renderDialog({ initialTab: 'csv' })
    const user = userEvent.setup()

    await user.upload(screen.getByLabelText('Arquivo CSV'), file(VALID_CSV))

    expect(await screen.findByText('2 pontos válidos.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Importar 2 pontos' }))

    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1))
    expect(api.posted.map((posted) => posted.nome)).toEqual(['A', 'B'])
    expect(onAdded.mock.calls[0]?.[0]).toHaveLength(2)
  })

  it('lists the first invalid lines and counts the rest', async () => {
    renderDialog({ initialTab: 'csv' })
    const csv = 'nome,latitude,longitude\nA,-23.5,-46.6\n,1,1\n,2,2\n,3,3\n,4,4\n'

    await userEvent.upload(screen.getByLabelText('Arquivo CSV'), file(csv))

    expect(await screen.findByText('1 ponto válido, 4 linhas com erro.')).toBeVisible()
    expect(screen.getAllByText(/^Linha \d+: Informe o nome$/)).toHaveLength(3)
    expect(screen.getByText('e mais 1 com erro.')).toBeVisible()
  })

  it('explains a file with the wrong header', async () => {
    renderDialog({ initialTab: 'csv' })

    await userEvent.upload(screen.getByLabelText('Arquivo CSV'), file('local,x,y\nA,1,2'))

    expect(await screen.findByText(/Cabeçalho inválido/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Importar 0 pontos' })).toBeDisabled()
  })

  it('refuses to import more points than the route can take', async () => {
    const selected = Array.from({ length: 29 }, (_, index) => point(index + 1))
    renderDialog({ initialTab: 'csv', selected })

    await userEvent.upload(screen.getByLabelText('Arquivo CSV'), file(VALID_CSV))

    expect(await screen.findByRole('alert')).toHaveTextContent('A rota comporta mais 1 ponto')
    expect(screen.getByRole('button', { name: 'Importar 2 pontos' })).toBeDisabled()
  })

  it('adds the points that were created and reports the ones that failed', async () => {
    let calls = 0
    server.use(
      http.post(apiUrl('/api/delivery-points'), async ({ request }) => {
        calls += 1
        const body = (await request.json()) as { nome: string }
        return calls === 2
          ? HttpResponse.json({ status: 400, detail: 'recusado' }, { status: 400 })
          : HttpResponse.json(
              { ...deliveryPointFixture, id: 100 + calls, nome: body.nome },
              { status: 201 },
            )
      }),
    )
    const { onAdded } = renderDialog({ initialTab: 'csv' })
    const user = userEvent.setup()

    await user.upload(screen.getByLabelText('Arquivo CSV'), file(VALID_CSV))
    await user.click(await screen.findByRole('button', { name: 'Importar 2 pontos' }))

    expect(await screen.findByText('1 ponto não foi importado.')).toBeVisible()
    expect(onAdded).toHaveBeenCalledTimes(1)
    expect(within(document.body).queryByText('Importar 2 pontos')).toBeInTheDocument()
    expect(onAdded.mock.calls[0]?.[0]).toHaveLength(1)
  })
})
