/**
 * RBAC en la interfaz. La autoridad es la API: aquí solo se ocultan acciones.
 */
export type Rol = 'ADMINISTRADOR' | 'AGRONOMO_SUPERVISOR' | 'TECNICO' | 'PRODUCTOR'

export type Accion =
  | 'predio:leer'
  | 'predio:editar'
  | 'lote:editar'
  | 'trampa:editar'
  | 'lectura:leer'
  | 'lectura:corregir'
  | 'usuario:administrar'
  | 'catalogo:administrar'
  | 'importacion:ejecutar'
  | 'reporte:exportar'

const PERMISOS: Record<Rol, readonly Accion[]> = {
  ADMINISTRADOR: [
    'predio:leer',
    'predio:editar',
    'lote:editar',
    'trampa:editar',
    'lectura:leer',
    'lectura:corregir',
    'usuario:administrar',
    'catalogo:administrar',
    'importacion:ejecutar',
    'reporte:exportar',
  ],
  AGRONOMO_SUPERVISOR: [
    'predio:leer',
    'predio:editar',
    'lote:editar',
    'trampa:editar',
    'lectura:leer',
    'lectura:corregir',
    'catalogo:administrar',
    'reporte:exportar',
  ],
  TECNICO: ['predio:leer', 'lote:editar', 'trampa:editar', 'lectura:leer', 'reporte:exportar'],
  PRODUCTOR: ['predio:leer', 'lectura:leer'],
}

export function can(rol: Rol | undefined, accion: Accion): boolean {
  if (!rol) {
    return false
  }
  return PERMISOS[rol].includes(accion)
}
