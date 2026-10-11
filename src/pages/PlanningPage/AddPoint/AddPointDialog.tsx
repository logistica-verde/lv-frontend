import type { LatLngTuple } from 'leaflet'
import Modal from '@/components/Modal/Modal'
import Tabs from '@/components/Tabs/Tabs'
import { MAX_SELECTED_POINTS } from '@/lib/selection'
import AddressTab from '@/pages/PlanningPage/AddPoint/AddressTab'
import CoordinatesTab from '@/pages/PlanningPage/AddPoint/CoordinatesTab'
import CsvTab from '@/pages/PlanningPage/AddPoint/CsvTab'
import ExistingTab from '@/pages/PlanningPage/AddPoint/ExistingTab'
import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'

export type AddPointTab = 'existing' | 'address' | 'coordinates' | 'csv'

type AddPointDialogProps = {
  open: boolean
  initialTab: AddPointTab
  initialPosition: LatLngTuple | null
  selected: DeliveryPoint[]
  registered: DeliveryPoint[]
  onClose: () => void
  onAdded: (points: DeliveryPoint[]) => void
}

export default function AddPointDialog({
  open,
  initialTab,
  initialPosition,
  selected,
  registered,
  onClose,
  onAdded,
}: AddPointDialogProps) {
  const capacity = MAX_SELECTED_POINTS - selected.length
  const available = registered.filter(
    (point) => point.ativo && !selected.some((chosen) => chosen.id === point.id),
  )

  return (
    <Modal open={open} title="Adicionar ponto" onClose={onClose}>
      {capacity <= 0 ? (
        <p role="alert">
          A rota já tem {MAX_SELECTED_POINTS} pontos, o limite máximo. Remova algum para adicionar
          outro.
        </p>
      ) : (
        <Tabs
          label="Como adicionar o ponto"
          initialId={initialTab}
          items={[
            {
              id: 'existing',
              label: 'Cadastrados',
              content: <ExistingTab available={available} capacity={capacity} onAdded={onAdded} />,
            },
            { id: 'address', label: 'Endereço', content: <AddressTab onAdded={onAdded} /> },
            {
              id: 'coordinates',
              label: 'Coordenadas',
              content: <CoordinatesTab initialPosition={initialPosition} onAdded={onAdded} />,
            },
            { id: 'csv', label: 'CSV', content: <CsvTab capacity={capacity} onAdded={onAdded} /> },
          ]}
        />
      )}
    </Modal>
  )
}
