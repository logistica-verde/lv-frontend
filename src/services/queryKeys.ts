export const queryKeys = {
  vehicles: ['vehicles'] as const,
  deliveryPoints: ['delivery-points'] as const,
  route: (id: number) => ['routes', id] as const,
  latestExperiment: ['experiments', 'latest'] as const,
  operations: (query: object) => ['operations', query] as const,
  integrity: (id: number) => ['routes', id, 'integrity'] as const,
}
