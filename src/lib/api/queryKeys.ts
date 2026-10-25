/** Claves de TanStack Query: un solo lugar para invalidar. */
export const queryKeys = {
  predios: (filtros?: Record<string, unknown>) => ['predios', filtros ?? {}] as const,
  predio: (id: string) => ['predios', id] as const,
  lotes: (predioId?: string) => ['lotes', predioId ?? 'todos'] as const,
  trampas: (filtros?: Record<string, unknown>) => ['trampas', filtros ?? {}] as const,
  lecturas: (filtros?: Record<string, unknown>) => ['lecturas', filtros ?? {}] as const,
  mtd: (filtros?: Record<string, unknown>) => ['mtd', filtros ?? {}] as const,
  catalogos: (nombre: string) => ['catalogos', nombre] as const,
  usuarios: (filtros?: Record<string, unknown>) => ['usuarios', filtros ?? {}] as const,
  reportes: (tipo: string) => ['reportes', tipo] as const,
  importaciones: () => ['importaciones'] as const,
}
