import VisuallyHidden from '@/components/VisuallyHidden/VisuallyHidden'
import { formatNumber } from '@/lib/format'
import styles from '@/pages/VehiclesPage/VehicleTable.module.css'
import type { Vehicle } from '@/services/schemas/vehicle'

type VehicleTableProps = {
  vehicles: Vehicle[]
}

export default function VehicleTable({ vehicles }: VehicleTableProps) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption>
          <VisuallyHidden>Veículos cadastrados</VisuallyHidden>
        </caption>
        <thead>
          <tr>
            <th scope="col">Placa</th>
            <th scope="col" className={styles.numeric}>
              Massa (kg)
            </th>
            <th scope="col">Combustível</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <th scope="row">{vehicle.placa}</th>
              <td className={styles.numeric}>{formatNumber(vehicle.massaKg)}</td>
              <td>{vehicle.tipoCombustivel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
