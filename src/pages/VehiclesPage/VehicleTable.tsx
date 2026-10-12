import Table, { Td, Th } from '@/components/Table/Table'
import { formatNumber } from '@/lib/format'
import type { Vehicle } from '@/services/schemas/vehicle'

type VehicleTableProps = {
  vehicles: Vehicle[]
}

export default function VehicleTable({ vehicles }: VehicleTableProps) {
  return (
    <Table caption="Veículos cadastrados">
      <thead>
        <tr>
          <Th>Placa</Th>
          <Th numeric>Massa (kg)</Th>
          <Th>Combustível</Th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => (
          <tr key={vehicle.id}>
            <Th scope="row">{vehicle.placa}</Th>
            <Td numeric>{formatNumber(vehicle.massaKg)}</Td>
            <Td>{vehicle.tipoCombustivel}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
