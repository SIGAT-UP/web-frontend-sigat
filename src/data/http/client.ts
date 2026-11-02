/**
 * Cliente HTTP único para `sigat-durazno-api`.
 * - Agrega el token Bearer de la sesión.
 * - Convierte las respuestas de error (problem+json `{detail, codigo}` u otras) en `ApiError` con un mensaje legible.
 * - El token de acceso dura poco (15 min). Ante un 401 renueva la sesión UNA vez con
 *   `POST /auth/refresco` (el refresco viaja en una cookie HttpOnly que JavaScript no lee) y repite
 *   la petición. Si no se puede renovar, borra la sesión y avisa a la app (`sigat:unauthorized`).
 */
import { env } from '@/config/env';
import { destinoAutorizado, problemaUrlApi } from '@/config/apiUrlPolicy';

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;
  /** Código estable del backend (`codigo` del problem+json), p. ej. `CREDENCIALES_INVALIDAS`. */
  readonly code?: string;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    const c = data && typeof data === 'object' ? (data as Record<string, unknown>).codigo : undefined;
    this.code = typeof c === 'string' ? c : undefined;
  }
}

/* ------------------------------------------------------------------ token de sesión */
/**
 * El token de acceso vive SOLO en memoria (nunca en sessionStorage ni localStorage), para que un
 * script inyectado no pueda leerlo del almacenamiento del navegador. Al recargar la página la sesión
 * se recupera con la cookie HttpOnly de refresco (`POST /auth/refresco`); «Mantener la sesión
 * iniciada» solo cambia la duración de esa cookie, que decide el backend con `recordar`.
 */
const LEGACY_TOKEN_KEY = 'sigat.token';
let memoryToken: string | null = null;

/** Borra el token que versiones anteriores guardaban en el navegador (migración sin pérdida de datos). */
function clearLegacyToken() {
  for (const get of [() => window.sessionStorage, () => window.localStorage]) {
    try { get().removeItem(LEGACY_TOKEN_KEY); } catch { /* sin almacenamiento */ }
  }
}
clearLegacyToken();

export const tokenStore = {
  get(): string | null { return memoryToken; },
  set(token: string) { memoryToken = token; },
  clear() { memoryToken = null; clearLegacyToken(); },
};

/** Dispositivo registrado por el backend para este navegador (`disp_id`); se reenvía al iniciar sesión. */
const DEVICE_KEY = 'sigat.dispositivo';
export const deviceStore = {
  get(): string | null { try { return window.localStorage.getItem(DEVICE_KEY); } catch { return null; } },
  set(id: string) { try { window.localStorage.setItem(DEVICE_KEY, id); } catch { /* sin almacenamiento */ } },
};

export const UNAUTHORIZED_EVENT = 'sigat:unauthorized';

/* ------------------------------------------------------------------ peticiones */
type Query = Record<string, string | number | boolean | null | undefined>;
interface RequestOptions { query?: Query; body?: unknown; auth?: boolean; signal?: AbortSignal; retried?: boolean }

const REFRESH_PATH = '/auth/refresco';
let refreshing: Promise<boolean> | null = null;

/** Renueva el token de acceso con la cookie de refresco. Una sola renovación a la vez. */
function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(buildUrl(REFRESH_PATH), {
        method: 'POST', credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: '{}',
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { token?: string };
      if (!data.token) return false;
      tokenStore.set(data.token);
      return true;
    } catch { return false; }
    finally { setTimeout(() => { refreshing = null; }, 0); }
  })();
  return refreshing;
}

/**
 * SEGURIDAD: el token Bearer y la cookie solo pueden ir a la API configurada.
 * - Si `VITE_API_URL` no cumple la política (p. ej. `//otro-host`), no se envía ninguna petición.
 * - Cada URL final se comprueba: mismo origen y misma ruta base que la API. Un `path` como
 *   `//otro.com/x`, `/../x` o con barras invertidas se rechaza antes de llamar a `fetch`.
 */
const configProblem = problemaUrlApi(env.apiUrl, { produccion: env.isProd });

const pageOrigin = () => (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
  ? window.location.origin : 'http://localhost');

const buildUrl = (path: string, query?: Query) => {
  if (configProblem) throw new ApiError(`Configuración inválida del cliente: ${configProblem}`, 0, { codigo: 'CONFIGURACION_API_INVALIDA' });
  const qs = query ? Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&') : '';
  const url = `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}${qs ? `?${qs}` : ''}`;
  if (!destinoAutorizado(url, env.apiUrl, pageOrigin())) {
    throw new ApiError('La petición apunta a un servidor no autorizado y no se envió.', 0, { codigo: 'DESTINO_NO_AUTORIZADO' });
  }
  return url;
};

const errorMessage = (status: number, data: unknown): string => {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === 'string') return d.detail;
    if (Array.isArray(d.detail) && d.detail.length) {
      const first = d.detail[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }
    if (typeof d.message === 'string') return d.message;
    if (typeof d.error === 'string') return d.error;
  }
  if (typeof data === 'string' && data.trim() && data.length < 300) return data;
  if (status === 0) return 'No hay conexión con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.';
  if (status === 401) return 'Tu sesión terminó. Inicia sesión de nuevo.';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'No se encontró la información solicitada.';
  if (status === 408) return 'El servidor tardó demasiado en responder. Inténtalo de nuevo.';
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.';
  return 'No se pudo completar la solicitud.';
};

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  // Se valida el destino ANTES de armar cabeceras: si no está autorizado, el token no sale.
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = opts.auth === false ? null : tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.body); }

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), env.apiTimeoutMs);
  const onAbort = () => timeout.abort();
  opts.signal?.addEventListener('abort', onAbort);

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body, signal: timeout.signal, credentials: 'include' });
  } catch (e) {
    if (opts.signal?.aborted) throw e;
    throw new ApiError(errorMessage(timeout.signal.aborted ? 408 : 0, null), timeout.signal.aborted ? 408 : 0);
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onAbort);
  }

  const text = res.status === 204 ? '' : await res.text();
  let data: unknown = text;
  if (text && (res.headers.get('content-type') ?? '').includes('json')) {
    try { data = JSON.parse(text); } catch { /* deja el texto */ }
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      if (!opts.retried && await refreshSession()) return request<T>(method, path, { ...opts, retried: true });
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(errorMessage(res.status, data), res.status, data);
  }
  return (text ? data : undefined) as T;
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'body'>) => request<T>('POST', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
  /** Intenta recuperar la sesión con la cookie de refresco (p. ej. al abrir la app). */
  refreshSession,
};
