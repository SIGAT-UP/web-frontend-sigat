import { env } from '@/lib/config/env'

import { ApiError } from './errors'

type RespuestaError = {
  codigo?: string
  mensaje?: string
}

/**
 * Cliente HTTP mínimo. Cuando exista `openapi.json` se reemplaza por el cliente
 * generado con openapi-typescript + openapi-fetch; la firma se mantiene.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!respuesta.ok) {
    let cuerpo: RespuestaError = {}
    try {
      cuerpo = (await respuesta.json()) as RespuestaError
    } catch {
      // La API no siempre devuelve JSON en errores de proxy.
    }
    throw new ApiError(
      respuesta.status,
      cuerpo.mensaje ?? `La API respondió ${respuesta.status}`,
      cuerpo.codigo,
    )
  }

  if (respuesta.status === 204) {
    return undefined as T
  }

  return (await respuesta.json()) as T
}
