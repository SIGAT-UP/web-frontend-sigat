/**
 * Configuración de entorno. Todo lo que cambia entre desarrollo, pruebas y producción
 * se lee aquí desde variables `VITE_*` (ver `.env.example`). Ninguna otra parte del código
 * lee `import.meta.env` directamente.
 */
const trimSlash = (s: string) => s.replace(/\/+$/, '');

export const env = {
  /** URL base del backend `sigat-durazno-api`. Por defecto `/api/v1` (mismo dominio o proxy de Vite en desarrollo). */
  apiUrl: trimSlash(import.meta.env.VITE_API_URL || '/api/v1'),
  /** Tiempo máximo de espera por petición, en milisegundos. */
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000),
  /** Versión visible en la interfaz; se inyecta desde package.json en `vite.config.ts`. */
  appVersion: __APP_VERSION__,
  isProd: import.meta.env.PROD,
} as const;
