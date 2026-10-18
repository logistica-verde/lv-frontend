import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MapView from '@/components/Map/MapView'
import RoutePolyline from '@/components/Map/RoutePolyline'

describe('RoutePolyline', () => {
  it('carries its style class from the moment it is drawn', () => {
    const { container } = render(
      <MapView label="Mapa de teste" fitTo={[]}>
        <RoutePolyline
          tone="distance"
          positions={[
            [-23.55, -46.63],
            [-23.56, -46.64],
          ]}
        />
      </MapView>,
    )

    const line = container.querySelector('path.leaflet-interactive')

    expect(line).not.toBeNull()
    expect(line?.getAttribute('class')).toMatch(/distance/)
  })
})
