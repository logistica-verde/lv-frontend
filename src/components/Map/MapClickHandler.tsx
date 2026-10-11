import type { LatLngTuple } from 'leaflet'
import { useMapEvents } from 'react-leaflet'

type MapClickHandlerProps = {
  onMapClick: (position: LatLngTuple) => void
}

export default function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (event) => onMapClick([event.latlng.lat, event.latlng.lng]),
  })

  return null
}
