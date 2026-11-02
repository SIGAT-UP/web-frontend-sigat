/**
 * Funciones de cada rol según el levantamiento de requerimientos (RF-002, RF-023, RF-082, RF-083).
 * Es texto de producto, no datos: describe qué puede hacer cada rol en la versión web.
 */
export const ROLE_PERMISSIONS = {
  Agrónomo: ['Consulta todos los registros', 'Verifica, corrige y valida registros', 'Registra predios y trampas', 'Planifica y asigna visitas', 'Define el programa de inspección', 'Administra los catálogos'],
  Productor: ['Consulta el estado de su cultivo', 'Registra aplicaciones', 'Registra cosecha', 'Consulta el historial'],
  Administrador: ['Usuarios y roles (RF-082)', 'Datos básicos de los predios (RDD-001)', 'Bitácora de auditoría (RF-083)'],
} as const;
