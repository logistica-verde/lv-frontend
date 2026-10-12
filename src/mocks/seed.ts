import type { DeliveryPoint } from '@/services/schemas/deliveryPoint'
import type { User } from '@/services/schemas/user'
import type { Vehicle } from '@/services/schemas/vehicle'

export const seedVehicles: Vehicle[] = [
  { id: 1, placa: 'ABC1D23', massaKg: 7500, tipoCombustivel: 'diesel', ativo: true },
  { id: 2, placa: 'XYZ9K88', massaKg: 12000, tipoCombustivel: 'diesel', ativo: true },
  { id: 3, placa: 'QRS4T56', massaKg: 3500, tipoCombustivel: 'gasolina', ativo: false },
]

export const seedUsers: User[] = [
  {
    id: 1,
    nome: 'Marina Duarte',
    email: 'marina.duarte@logisticaverde.example',
    perfil: 'ADMIN',
    ativo: true,
  },
  {
    id: 2,
    nome: 'Carlos Menezes',
    email: 'carlos.menezes@logisticaverde.example',
    perfil: 'OPERATOR',
    ativo: true,
  },
  {
    id: 3,
    nome: 'Juliana Prado',
    email: 'juliana.prado@logisticaverde.example',
    perfil: 'OPERATOR',
    ativo: true,
  },
  {
    id: 4,
    nome: 'Rafael Tonelli',
    email: 'rafael.tonelli@logisticaverde.example',
    perfil: 'AUDITOR',
    ativo: true,
  },
  {
    id: 5,
    nome: 'Beatriz Nogueira',
    email: 'beatriz.nogueira@logisticaverde.example',
    perfil: 'OPERATOR',
    ativo: false,
  },
]

export const seedDeliveryPoints: DeliveryPoint[] = [
  {
    id: 1,
    nome: 'Praça da Sé',
    endereco: 'Praça da Sé, Sé',
    latitude: -23.5505,
    longitude: -46.6333,
    ativo: true,
  },
  {
    id: 2,
    nome: 'MASP',
    endereco: 'Av. Paulista, 1578',
    latitude: -23.5614,
    longitude: -46.6559,
    ativo: true,
  },
  {
    id: 3,
    nome: 'Estação da Luz',
    endereco: 'Praça da Luz, 1',
    latitude: -23.5343,
    longitude: -46.6361,
    ativo: true,
  },
  {
    id: 4,
    nome: 'Mercado Municipal',
    endereco: 'R. da Cantareira, 306',
    latitude: -23.5415,
    longitude: -46.6291,
    ativo: true,
  },
  {
    id: 5,
    nome: 'Parque Ibirapuera',
    endereco: 'Av. Pedro Álvares Cabral',
    latitude: -23.5874,
    longitude: -46.6576,
    ativo: true,
  },
  {
    id: 6,
    nome: 'Liberdade',
    endereco: 'Praça da Liberdade',
    latitude: -23.5586,
    longitude: -46.6355,
    ativo: true,
  },
]
