/**
 * RUTAS DEL BACKEND `sigat-durazno-api` — único lugar donde están escritas.
 * Son relativas a `VITE_API_URL` (por defecto `/api/v1`) y coinciden con `contracts/openapi.json`
 * del backend (Swagger en `/api/v1/docs`).
 *
 * Estado del backend (29-oct-2026). Funcionan contra la base de datos: autenticación, usuarios
 * (`/usuarios…`, `/roles`), avisos (`/yo/notificaciones…`), `/yo/inicio`, `/yo/perfil`, `/yo/predios`,
 * catálogos y geografía de solo lectura. El resto existe en el contrato y responde 501
 * («Funcionalidad pendiente de implementar»); las pantallas muestran ese mensaje. El backend responde con nombres en español de la BD
 * (p. ej. `lote_id`, `pred_nombre`): al implementar cada módulo, la traducción a los tipos de
 * `models/types.ts` se escribe en `repositories.ts` (ver `toSessionUser` como ejemplo).
 */
const e = encodeURIComponent;

export const API = {
  auth: {
    login: '/auth/login',                                   // POST {usuario, contrasena, cliente:'web', recordar, dispositivo}
    logout: '/auth/logout',                                 // POST → 204 (borra la cookie de refresco)
    me: '/auth/sesion',                                     // GET → UsuarioSesion
    refresh: '/auth/refresco',                              // POST {} → nuevo token (lee la cookie HttpOnly)
    passwordReset: '/auth/recuperacion',                    // POST {identificador} → 202
    home: '/yo/inicio',                                     // GET → {datos_al, …}
  },
  farm: '/yo/predios',                                      // GET predios a los que tengo acceso
  farms: '/predios',
  farmById: (id: string) => `/predios/${e(id)}`,
  farmMap: (id: string) => `/predios/${e(id)}/mapa`,        // GeoJSON para MapLibre
  lots: '/lotes',
  lot: (id: string) => `/lotes/${e(id)}`,
  lotControl: (id: string) => `/lotes/${e(id)}/resumen`,
  lotActivity: (id: string) => `/lotes/${e(id)}/actividad-reciente`,
  lotHistory: (id: string) => `/lotes/${e(id)}/historial`,
  traps: '/trampas',                                        // GET ?lote_id= · POST NuevaTrampa
  trap: (id: string) => `/trampas/${e(id)}`,                // PATCH por tram_id
  trapByCode: (code: string) => `/trampas/codigo/${e(code)}`,
  reviews: '/revisiones',
  review: (visitId: string) => `/revisiones/${e(visitId)}`,
  visitAcceptance: (visitId: string) => `/revisiones/${e(visitId)}/aceptacion`,
  readingCorrections: (registroId: string) => `/lecturas/${e(registroId)}/correcciones`,
  readingCancellations: (registroId: string) => `/lecturas/${e(registroId)}/anulaciones`,
  files: '/archivos',                                       // POST metadatos → URL firmada (documentos, fotos)
  plannings: '/planificaciones',
  planning: (id: string) => `/planificaciones/${e(id)}`,
  planningRecipients: '/planificaciones/destinatarios',    // GET ?tipo=productor|tecnico
  planningAccept: (id: string) => `/planificaciones/${e(id)}/aceptacion`,
  planningReject: (id: string) => `/planificaciones/${e(id)}/rechazo`,
  producer: {
    lots: '/productor/cultivo',
    lotStatus: (id: string) => `/lotes/${e(id)}/resumen`,
    applications: '/aplicaciones',
    harvests: '/cosechas',
    harvestVersions: (registroId: string) => `/cosechas/${e(registroId)}/versiones`,
    history: '/actividad',
  },
  admin: { overview: '/admin/resumen', audit: '/auditoria' },
  users: '/usuarios',
  user: (id: string) => `/usuarios/${e(id)}`,
  userDeletion: (id: string) => `/usuarios/${e(id)}/eliminacion`,
  userStatus: (id: string) => `/usuarios/${e(id)}/activacion`,
  userPasswordReset: (id: string) => `/usuarios/${e(id)}/restablecimiento-contrasena`,
  centers: '/catalogos/centro_acopio',
  municipalities: '/geografia/municipios',
  program: (farmId: string) => `/predios/${e(farmId)}/programa`,
  programVersions: (farmId: string) => `/predios/${e(farmId)}/programa/versiones`,
  catalogs: '/catalogos',
  catalogItems: (code: string) => `/catalogos/${e(code)}`,
  notifications: '/yo/notificaciones',
  notificationsRead: '/yo/notificaciones/leidas',              // POST → todos leídos
  notificationRead: (id: string) => `/yo/notificaciones/${e(id)}/leida`,
} as const;
