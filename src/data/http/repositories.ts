/**
 * Implementación HTTP de los contratos de `repositories/contracts.ts` contra `sigat-durazno-api`.
 * Las reglas de negocio (motivo ≥ 10 caracteres, paridad RN-005, versiones de corrección…)
 * las aplica el backend; las pantallas además validan antes de enviar.
 *
 * CONECTADOS al backend y la BD (traducción API → pantallas en este archivo):
 *   autenticación (`httpAuth`), usuarios (`httpAdmin.users/user/createUser/updateUser/deletePreview/
 *   deleteUser/setUserActive/assignPassword/userFormOptions`), avisos (`httpNotifications`),
 *   predio propio (`/yo/predios`), «datos al» (`/yo/inicio`) y catálogos de solo lectura.
 * PENDIENTES en el backend (responden 501 y las pantallas lo dicen): lotes, trampas, revisiones,
 *   planificación, productor, programa, panel, auditoría, cartografía y edición de catálogos. Las
 *   rutas y cuerpos ya siguen el contrato; al implementarse, escriba aquí la traducción de su
 *   respuesta (nombres de la BD en español) al tipo de `models/types.ts`, como hace `toSessionUser`.
 */
import type {
  AuthRepository, LotRepository, ReviewRepository, PlanningRepository, ProducerRepository, AdminRepository, ProgramRepository, NotificationRepository,
} from '../repositories/contracts';
import type {
  SessionUser, Role, UserRole, NewUserInput, UpdateUserInput, Farm, Lot, LotControl, Trap, FieldRecord, ActivityItem, HistoryEntry, Planning, Recipient, Application, Harvest, LotStatusSummary,
  AppNotification, ProducerCropLot, AppUser, Option, DeletePreview, DeleteResult, AuditEntry, AdminOverview, InspectionProgram, CatalogCard, TimelineItem,
} from '../models/types';
import { env } from '@/config/env';
import { http, tokenStore, deviceStore, ApiError } from './client';
import { API } from './endpoints';

type ProducerHistoryRow = Awaited<ReturnType<ProducerRepository['history']>>[number];

/* ------------------------------------------------------------------ autenticación */
/** `UsuarioSesion` del backend (GET /auth/sesion y `user` del login). */
interface ApiUsuarioSesion {
  id: number;
  nombre: string;
  iniciales: string;
  usuario: string;
  correo: string | null;
  rol: 'ADMINISTRADOR' | 'AGRONOMO_SUPERVISOR' | 'TECNICO' | 'PRODUCTOR';
  rol_descripcion: string;
  predio_etiqueta: string | null;
  requiere_cambio_contrasena: boolean;
}
/** `RespuestaLogin` del backend. En la web `token_refresco` es null: viaja en una cookie HttpOnly. */
interface ApiRespuestaLogin { token: string; expira_en: number; disp_id: string; user: ApiUsuarioSesion }

const ROLES: Record<ApiUsuarioSesion['rol'], { role: Role; label: string } | null> = {
  ADMINISTRADOR: { role: 'ADMIN', label: 'Administrador' },
  AGRONOMO_SUPERVISOR: { role: 'AGRONOMO', label: 'Agrónomo' },
  PRODUCTOR: { role: 'PRODUCTOR', label: 'Productor' },
  TECNICO: null, // el técnico solo usa la app móvil (el backend ya lo rechaza con ROL_SOLO_MOVIL)
};

/** Traduce la sesión del backend al `SessionUser` que usan las pantallas. */
export function toSessionUser(u: ApiUsuarioSesion): SessionUser {
  const r = ROLES[u.rol];
  if (!r) throw new ApiError('Este rol no tiene acceso a la versión web. Usa la aplicación móvil.', 403);
  return {
    id: String(u.id),
    name: u.nombre,
    initials: u.iniciales,
    role: r.role,
    roleLabel: r.label,
    email: u.correo ?? u.usuario,
    farmLabel: u.predio_etiqueta ? `${r.label} · ${u.predio_etiqueta}` : undefined,
  };
}

export const httpAuth: AuthRepository = {
  async login(identifier, password, remember = false) {
    const disp = deviceStore.get();
    const r = await http.post<ApiRespuestaLogin>(API.auth.login, {
      usuario: identifier.trim(),
      contrasena: password,
      cliente: 'web',
      recordar: remember,
      dispositivo: { plataforma: 'otro', disp_id: disp ?? undefined, version_app: `web ${env.appVersion}`, nombre: 'Navegador web' },
    }, { auth: false });
    if (!r?.token || !r.user) throw new ApiError('El servidor no devolvió una sesión válida.', 500, r);
    const user = toSessionUser(r.user);
    tokenStore.set(r.token);
    if (r.disp_id) deviceStore.set(r.disp_id);
    return user;
  },
  async logout() {
    try { if (tokenStore.get()) await http.post(API.auth.logout); } catch { /* la sesión se cierra igual en el cliente */ }
    tokenStore.clear();
  },
  async current() {
    // Sin token guardado se intenta renovar con la cookie (sesión «recordada» tras cerrar el navegador).
    if (!tokenStore.get() && !(await http.refreshSession())) return null;
    try { return toSessionUser(await http.get<ApiUsuarioSesion>(API.auth.me)); }
    catch (e) { if (e instanceof ApiError && (e.status === 401 || e.status === 403)) { tokenStore.clear(); return null; } throw e; }
  },
  async requestPasswordReset(identifier) {
    await http.post(API.auth.passwordReset, { identificador: identifier.trim() }, { auth: false });
  },
  async dataAsOf() {
    const r = await http.get<{ datos_al: string }>(API.auth.home);
    return r.datos_al;
  },
};

/* ------------------------------------------------------------------ paginación */
/** Respuesta paginada del backend: `{items, siguiente}` (cursor opaco). */
interface ApiPagina<T> { items: T[]; siguiente: string | null }
/** Recorre todas las páginas (el backend devuelve hasta 200 por página). */
async function todas<T>(path: string, query: Record<string, string | number | boolean | undefined> = {}): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 50; i++) {
    const r = await http.get<ApiPagina<T>>(path, { ...query, cursor });
    out.push(...(r?.items ?? []));
    if (!r?.siguiente) break;
    cursor = r.siguiente;
  }
  return out;
}

/* ------------------------------------------------------------------ predio */
/** `PredioAccesible` de GET /yo/predios. */
interface ApiPredioAccesible { pred_id: number; pred_nombre: string; origen: 'asignacion' | 'propietario' | 'global' }
/** Lo que /yo/predios no trae (extensión, lotes…) queda en null y la pantalla muestra «Sin definir». */
export const toFarm = (p: ApiPredioAccesible): Farm => ({ id: String(p.pred_id), name: p.pred_nombre, extensionHa: null, lotCount: null });

/** El predio de trabajo: el primero de los que el usuario tiene acceso. */
async function currentFarm(): Promise<Farm> {
  const farms = await http.get<ApiPredioAccesible[]>(API.farm);
  if (!farms?.length) throw new ApiError('No tienes predios asignados. Pide al administrador que te asigne uno.', 404);
  return toFarm(farms[0]);
}

/* ------------------------------------------------------------------ lotes y trampas */
export const httpLots: LotRepository = {
  farm: currentFarm,
  list: () => http.get<Lot[]>(API.lots),
  get: id => http.get<Lot>(API.lot(id)),
  control: id => http.get<LotControl>(API.lotControl(id)),
  traps: lotId => http.get<Trap[]>(API.traps, { lote_id: lotId }),
  recentActivity: lotId => http.get<ActivityItem[]>(API.lotActivity(lotId)),
  history: lotId => http.get<HistoryEntry[]>(API.lotHistory(lotId)),
  createTrap: input => http.post<Trap>(API.traps, { ...input, code: input.code.trim() }),
  async updateTrap(code, input) {
    const t = await http.get<{ tram_id: number }>(API.trapByCode(code));
    return http.patch<Trap>(API.trap(String(t.tram_id)), input);
  },
  updateLot: (id, input) => http.patch<Lot>(API.lot(id), input),
};

/* ------------------------------------------------------------------ revisiones */
export const httpReviews: ReviewRepository = {
  list: () => http.get<FieldRecord[]>(API.reviews),
  get: id => http.get<FieldRecord>(API.review(id)),
  async resolve(id, action) {
    if (action.kind === 'confirmar') {
      const record = await http.get<FieldRecord>(API.review(id));
      await http.post(API.visitAcceptance(record.visitId ?? id));
    } else if (action.kind === 'corregir') {
      await http.post(API.readingCorrections(id), { lect_especimenes: action.captures, motivo: action.reason.trim() });
    } else {
      await http.post(API.readingCancellations(id), { motivo: action.reason.trim() });
    }
    return http.get<FieldRecord>(API.review(id));
  },
};

/* ------------------------------------------------------------------ planeación */
export const httpPlanning: PlanningRepository = {
  list: () => http.get<Planning[]>(API.plannings),
  get: id => http.get<Planning>(API.planning(id)),
  recipients: kind => http.get<Recipient[]>(API.planningRecipients, { tipo: kind }),
  create(input) {
    // PENDIENTE (al implementar planificación en el backend): el documento se sube primero por
    // POST /archivos (URL firmada) y se envía su `arch_id` como `arch_id_documento`.
    const { document, ...data } = input;
    if (document) throw new ApiError('La subida del documento de instrucciones aún no está disponible.', 501);
    return http.post<Planning>(API.plannings, data);
  },
  respond: (id, decision, reason) => decision === 'Aceptada'
    ? http.post<Planning>(API.planningAccept(id), { observacion: reason?.trim() || undefined })
    : http.post<Planning>(API.planningReject(id), { motivo: reason?.trim() ?? '' }),
};

/* ------------------------------------------------------------------ productor */
export const httpProducer: ProducerRepository = {
  cropLots: () => http.get<ProducerCropLot[]>(API.producer.lots),
  lotStatus: lotId => http.get<LotStatusSummary>(API.producer.lotStatus(lotId)),
  applications: () => http.get<Application[]>(API.producer.applications),
  registerApplication: a => http.post<Application>(API.producer.applications, a),
  harvests: () => http.get<Harvest[]>(API.producer.harvests),
  saveHarvest: h => http.post<Harvest>(API.producer.harvests, h),
  history: () => http.get<ProducerHistoryRow[]>(API.producer.history),
  timeline: () => http.get<TimelineItem[]>(API.producer.history),
};

/* ------------------------------------------------------------------ administración: usuarios */
type ApiRol = ApiUsuarioSesion['rol'];
/** `UsuarioAdmin` del backend (vista sigat.v_usuario_admin). */
interface ApiUsuarioAdmin {
  usua_id: number; pers_cc: number; nombre: string; apellido: string; nombre_completo: string; iniciales: string;
  correo: string | null; telefono: string | null; direccion: string | null; usuario: string;
  rol: ApiRol; rol_descripcion: string; acceso: 'solo_movil' | 'web_y_movil'; activo: boolean; proveedor: 'local' | 'externo';
  ultimo_acceso: string | null; requiere_cambio_contrasena: boolean; cent_id?: number | null; muni_id?: number | null; predios?: number;
}
const ROL_A_PANTALLA: Record<ApiRol, UserRole> = {
  ADMINISTRADOR: 'Administrador', AGRONOMO_SUPERVISOR: 'Agrónomo', TECNICO: 'Técnico', PRODUCTOR: 'Productor',
};
const PANTALLA_A_ROL: Record<UserRole, ApiRol> = {
  Administrador: 'ADMINISTRADOR', 'Agrónomo': 'AGRONOMO_SUPERVISOR', 'Técnico': 'TECNICO', Productor: 'PRODUCTOR',
};

export function toAppUser(u: ApiUsuarioAdmin): AppUser {
  const role = ROL_A_PANTALLA[u.rol];
  return {
    id: String(u.usua_id), cedula: String(u.pers_cc), firstName: u.nombre, lastName: u.apellido, name: u.nombre_completo,
    initials: u.iniciales, email: u.correo ?? '', phone: u.telefono ?? undefined, address: u.direccion ?? undefined,
    username: u.usuario, role, active: u.activo,
    access: u.acceso === 'solo_movil' ? 'Solo móvil' : role === 'Administrador' ? 'Web' : 'Móvil y web',
    note: u.proveedor === 'externo' ? 'Cuenta institucional' : u.requiere_cambio_contrasena ? 'Debe cambiar la contraseña' : undefined,
    mustChangePassword: u.requiere_cambio_contrasena, lastAccess: u.ultimo_acceso,
    centerId: u.cent_id != null ? String(u.cent_id) : undefined, municipalityId: u.muni_id != null ? String(u.muni_id) : undefined,
  };
}

const vacioANull = (v?: string) => (v?.trim() ? v.trim() : null);
const idONull = (v?: string) => (v ? Number(v) : null);

/** `NuevoUsuario`. Técnico y administrador llevan centro de acopio; productor, municipio. */
export function toNuevoUsuario(i: NewUserInput) {
  const rol = PANTALLA_A_ROL[i.role];
  return {
    pers_cc: Number(i.cedula), nombre: i.firstName.trim(), apellido: i.lastName.trim(), correo: vacioANull(i.email),
    telefono: vacioANull(i.phone), direccion: vacioANull(i.address), usuario: i.username.trim(), rol,
    contrasena_temporal: i.password ? i.password : null,
    datos_rol: { cent_id: rol === 'TECNICO' || rol === 'ADMINISTRADOR' ? idONull(i.centerId) : null, muni_id: rol === 'PRODUCTOR' ? idONull(i.municipalityId) : null },
  };
}

/** `ActualizacionUsuario` (PATCH): solo los campos que cambiaron. Un campo vaciado viaja como null. */
export function toActualizacionUsuario(i: UpdateUserInput) {
  const c: Record<string, unknown> = {};
  if (i.cedula !== undefined) c.pers_cc = Number(i.cedula);
  if (i.firstName !== undefined) c.nombre = i.firstName.trim();
  if (i.lastName !== undefined) c.apellido = i.lastName.trim();
  if (i.email !== undefined) c.correo = vacioANull(i.email);
  if (i.phone !== undefined) c.telefono = vacioANull(i.phone);
  if (i.address !== undefined) c.direccion = vacioANull(i.address);
  if (i.username !== undefined) c.usuario = i.username.trim();
  if (i.role !== undefined) c.rol = PANTALLA_A_ROL[i.role];
  if (i.role !== undefined || i.centerId !== undefined || i.municipalityId !== undefined) {
    c.datos_rol = { cent_id: idONull(i.centerId), muni_id: idONull(i.municipalityId) };
  }
  return c;
}

interface ApiItemCatalogo { id: number; descripcion: string; codigo?: string | number | null; activo?: boolean }
interface ApiMunicipio { muni_id: number; muni_descripcion: string; muni_codigo: string | null; divipola?: string | null; depa_id: number }

export const httpAdmin: AdminRepository = {
  overview: () => http.get<AdminOverview>(API.admin.overview),
  users: async () => (await todas<ApiUsuarioAdmin>(API.users)).map(toAppUser),
  user: async id => toAppUser(await http.get<ApiUsuarioAdmin>(API.user(id))),
  async userFormOptions() {
    const [centros, municipios] = await Promise.all([
      http.get<ApiItemCatalogo[]>(API.centers), http.get<ApiMunicipio[]>(API.municipalities),
    ]);
    return {
      centers: centros.filter(c => c.activo !== false).map((c): Option => ({ id: String(c.id), label: c.descripcion })),
      municipalities: municipios.map((m): Option => ({ id: String(m.muni_id), label: m.divipola ? `${m.muni_descripcion} (${m.divipola})` : m.muni_descripcion })),
    };
  },
  createUser: async i => toAppUser(await http.post<ApiUsuarioAdmin>(API.users, toNuevoUsuario(i))),
  updateUser: async (id, i) => toAppUser(await http.patch<ApiUsuarioAdmin>(API.user(id), toActualizacionUsuario(i))),
  async deletePreview(id) {
    const r = await http.get<{ tiene_actividad: boolean; resultado_esperado: DeletePreview['outcome']; explicacion: string }>(API.userDeletion(id));
    return { hasActivity: r.tiene_actividad, outcome: r.resultado_esperado, explanation: r.explicacion };
  },
  async deleteUser(id, reason) {
    const r = await http.post<{ resultado: DeleteResult['outcome']; mensaje: string }>(API.userDeletion(id), { motivo: reason.trim() });
    return { outcome: r.resultado, message: r.mensaje };
  },
  setUserActive: async (id, active) => toAppUser(await http.post<ApiUsuarioAdmin>(API.userStatus(id), { activo: active })),
  assignPassword: async (id, newPassword) => {
    await http.post(API.userPasswordReset(id), { nueva_contrasena: newPassword, exigir_cambio: true });
  },
  audit: () => http.get<AuditEntry[]>(API.admin.audit),
  farms: () => http.get<Farm[]>(API.farms),
  updateFarm: f => http.patch<Farm>(API.farmById(f.id), f),
};

/* ------------------------------------------------------------------ programa y catálogos */
export const httpProgram: ProgramRepository = {
  get: async () => http.get<InspectionProgram>(API.program((await currentFarm()).id)),
  saveNewVersion: async (p, since) => http.post<InspectionProgram>(API.programVersions((await currentFarm()).id), { ...p, vigente_desde: since }),
  async catalogs() {
    const r = await http.get<{ codigo: string; titulo: string; editable: boolean; total_items: number; resumen: string }[]>(API.catalogs);
    return r.map((c): CatalogCard => ({
      id: c.codigo, title: c.titulo, summary: c.resumen, detail: `${c.total_items} elementos`,
      mode: c.editable ? 'Editable' : 'Solo lectura', action: c.editable ? 'Editar' : 'Ver',
    }));
  },
  catalogItems: async id => (await http.get<ApiItemCatalogo[]>(API.catalogItems(id))).map(x => x.descripcion),
  saveCatalogItems: (id, items) => http.put<CatalogCard>(API.catalogItems(id), { items: items.map(x => x.trim()).filter(Boolean) }),
};

/* ------------------------------------------------------------------ notificaciones */
/** `Notificacion` del backend. `destino` = pantalla que abre el aviso (y el id del registro, si aplica). */
interface ApiNotificacion {
  noti_id: number; categoria: string; titulo: string; cuerpo: string; creada_en: string; leida_en: string | null; leida: boolean;
  destino: { ruta: string; argumento: string | null } | null;
}
export const toAppNotification = (n: ApiNotificacion): AppNotification => ({
  id: String(n.noti_id), title: n.titulo, body: n.cuerpo, at: n.creada_en, read: n.leida,
  to: n.destino ? (n.destino.argumento ? `${n.destino.ruta}?id=${encodeURIComponent(n.destino.argumento)}` : n.destino.ruta) : undefined,
});

export const httpNotifications: NotificationRepository = {
  // Los 50 más recientes (primera página): es lo que cabe en el panel de la campana.
  list: async () => ((await http.get<ApiPagina<ApiNotificacion>>(API.notifications))?.items ?? []).map(toAppNotification),
  markRead: async id => { await http.post(API.notificationRead(id)); },
  markAllRead: async () => { await http.post(API.notificationsRead); },
};
