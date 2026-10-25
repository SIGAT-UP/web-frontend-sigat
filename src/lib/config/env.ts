/** Configuración de entorno. VITE_API_URL se fija en el build (Coolify). */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
} as const
