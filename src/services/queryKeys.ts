export const queryKeys = {
  vehicles: ['vehicles'] as const,
  allVehicles: ['vehicles', 'all'] as const,
  users: ['users'] as const,
  gaSettings: ['settings', 'ga'] as const,
  deliveryPoints: ['delivery-points'] as const,
  route: (id: number) => ['routes', id] as const,
  latestExperiment: ['experiments', 'latest'] as const,
  operations: (query: object) => ['operations', query] as const,
  integrity: (id: number) => ['routes', id, 'integrity'] as const,
}
