import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MapMarker from '@/components/Map/MapMarker'
import MapView from '@/components/Map/MapView'

describe('MapView', () => {
  it('is a labelled region holding the map', () => {
    const { container } = render(<MapView label="Mapa de teste" />)

    expect(screen.getByRole('region', { name: 'Mapa de teste' })).toBeInTheDocument()
    expect(container.querySelector('.leaflet-container')).not.toBeNull()
  })

  it('credits OpenStreetMap, as its license requires', () => {
    render(<MapView label="Mapa de teste" />)

    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/copyright',
    )
  })

  it('offers zoom controls', () => {
    render(<MapView label="Mapa de teste" />)

    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument()
  })

  it('renders markers passed as children', () => {
    render(
      <MapView label="Mapa de teste">
        <MapMarker position={[-23.55, -46.63]} title="Praça da Sé" />
        <MapMarker position={[-23.56, -46.65]} title="MASP" label="2" />
      </MapView>,
    )

    expect(screen.getByRole('button', { name: 'Praça da Sé' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2. MASP' })).toHaveTextContent('2')
  })
})

describe('MapMarker', () => {
  it('shows a label without interpreting it as HTML', () => {
    render(
      <MapView label="Mapa de teste">
        <MapMarker position={[-23.55, -46.63]} title="Ponto" label={'<b>1</b>'} />
      </MapView>,
    )

    const marker = screen.getByRole('button', { name: '<b>1</b>. Ponto' })
    expect(marker).toHaveTextContent('<b>1</b>')
    expect(marker.querySelector('b')).toBeNull()
  })

  it('has no label text when none is given', () => {
    render(
      <MapView label="Mapa de teste">
        <MapMarker position={[-23.55, -46.63]} title="Ponto" />
      </MapView>,
    )

    expect(screen.getByRole('button', { name: 'Ponto' })).toHaveTextContent('')
  })

  it('applies the requested tone', () => {
    render(
      <MapView label="Mapa de teste">
        <MapMarker position={[-23.55, -46.63]} title="Ponto" tone="emission" />
      </MapView>,
    )

    expect(screen.getByRole('button', { name: 'Ponto' })).toHaveClass('emission')
  })
})
