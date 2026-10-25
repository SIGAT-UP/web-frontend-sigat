/** Error normalizado de la API: código estable y estado HTTP. */
export class ApiError extends Error {
  readonly status: number
  readonly codigo: string

  constructor(status: number, mensaje: string, codigo = 'ERROR_API') {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
    this.codigo = codigo
  }
}

export function normalizarError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }
  if (error instanceof Error) {
    return new ApiError(0, error.message, 'ERROR_RED')
  }
  return new ApiError(0, 'Error desconocido', 'ERROR_DESCONOCIDO')
}
