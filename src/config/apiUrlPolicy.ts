/**
 * Reglas de seguridad para la URL del backend (`VITE_API_URL`) y para cada petición.
 *
 * El cliente HTTP envía el token Bearer en cada petición, así que la URL base decide a quién se
 * entrega la sesión. Valores aceptados:
 *
 * - Ruta relativa al mismo dominio (`/api/v1`): recomendada, detrás del proxy de nginx.
 *   Debe empezar por UNA sola barra. `//servidor.com/...` (protocol-relative) y variantes con
 *   barra invertida (`/\servidor.com`, `\\servidor.com`) se rechazan: el navegador las interpreta
 *   como OTRO host y le enviaría el token.
 * - `https://host/ruta`: API en otro dominio, con TLS. Requiere CORS en el backend y `connect-src`
 *   en la CSP de nginx (ver README, «Despliegue»).
 * - `http://`: en producción solo hacia la propia máquina (`localhost`, `127.0.0.1`, `[::1]`) para
 *   `npm run preview`; en desarrollo se permite cualquier host (backend en la red local).
 *
 * Siempre se rechazan: otros esquemas, usuario/contraseña dentro de la URL, `?` o `#`, segmentos
 * `.`/`..`, espacios o caracteres de control y barras invertidas.
 *
 * Funciones puras: las usan `vite.config.ts` (al compilar), `client.ts` (en cada petición) y las pruebas.
 */

const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1', '[::1]']);
/** Origen ficticio para resolver rutas relativas sin depender del navegador. */
const ORIGEN_REFERENCIA = 'https://origen.invalid';
/** `.` y `..`, también codificados (`%2e`), que el navegador normaliza y permiten salir de la ruta base. */
const esSegmentoPunto = (s: string) => /^(?:\.|%2e){1,2}$/i.test(s);

export interface OpcionesUrlApi {
  /** `true` en un build de producción: HTTP solo hacia la propia máquina. */
  produccion: boolean;
}

/** Devuelve `null` si `url` es aceptable como base de la API, o el motivo del rechazo. */
export function problemaUrlApi(url: string | undefined, { produccion }: OpcionesUrlApi): string | null {
  const valor = (url ?? '').trim();
  if (valor === '') return null; // se usa el valor por defecto `/api/v1`

  // eslint-disable-next-line no-control-regex
  if (/[\s\u0000-\u001f\u007f]/.test(valor)) {
    return `VITE_API_URL contiene espacios o caracteres de control: "${valor}".`;
  }
  if (valor.includes('\\')) {
    return `VITE_API_URL no puede contener barras invertidas (\\): "${valor}". El navegador puede interpretarlas como otro host.`;
  }
  if (valor.includes('?') || valor.includes('#')) {
    return `VITE_API_URL no puede llevar parámetros (?) ni fragmentos (#): "${valor}".`;
  }

  if (valor.startsWith('/')) {
    if (valor.startsWith('//')) {
      return `VITE_API_URL="${valor}" empieza por "//": el navegador la trata como otro host (URL protocol-relative). Use una ruta como /api/v1 o una URL https://.`;
    }
    if (valor.split('/').some(esSegmentoPunto)) {
      return `VITE_API_URL no puede contener segmentos "." o "..": "${valor}".`;
    }
    const resuelta = new URL(valor, ORIGEN_REFERENCIA);
    if (resuelta.origin !== ORIGEN_REFERENCIA) {
      return `VITE_API_URL="${valor}" apunta a otro host.`;
    }
    return null;
  }

  let u: URL;
  try {
    u = new URL(valor);
  } catch {
    return `VITE_API_URL no es una URL válida: "${valor}". Use una ruta relativa (/api/v1) o una URL https://.`;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return `VITE_API_URL="${valor}" usa un esquema no permitido (${u.protocol}). Use https:// o una ruta relativa.`;
  }
  if (!u.hostname) return `VITE_API_URL="${valor}" no tiene host.`;
  if (u.username || u.password) {
    return 'VITE_API_URL no puede incluir usuario ni contraseña.';
  }
  if (valor.slice(valor.indexOf('//') + 2).split('/').slice(1).some(esSegmentoPunto)) {
    return `VITE_API_URL no puede contener segmentos "." o "..": "${valor}".`;
  }
  if (u.protocol === 'http:' && produccion && !HOSTS_LOCALES.has(u.hostname)) {
    return `VITE_API_URL="${valor}" no es segura para producción: use HTTPS o una ruta relativa (/api/v1).`;
  }
  return null;
}

/** Atajo usado por `vite.config.ts`: reglas de un build de producción. */
export function problemaUrlApiProduccion(url: string | undefined): string | null {
  return problemaUrlApi(url, { produccion: true });
}

/**
 * Comprueba que `destino` (la URL final de una petición) vaya al MISMO origen y bajo la MISMA ruta
 * base que la API autorizada. Así ningún `path` (por ejemplo `//otro.com`, `/../x` o un valor
 * armado con datos) puede desviar la petición, ni el token, a otro servidor.
 *
 * `base` y `destino` pueden ser relativos; se resuelven contra `origenPagina` (en el navegador,
 * `window.location.origin`).
 */
export function destinoAutorizado(destino: string, base: string, origenPagina: string): boolean {
  if (destino.includes('\\')) return false;
  if (destino.split('?')[0].split('/').some(esSegmentoPunto)) return false;
  let b: URL;
  let d: URL;
  try {
    b = new URL(base === '' ? '/' : base, origenPagina);
    d = new URL(destino, origenPagina);
  } catch {
    return false;
  }
  if (d.origin !== b.origin) return false;
  if (d.username || d.password) return false;
  const rutaBase = b.pathname.replace(/\/+$/, '');
  return rutaBase === '' || d.pathname === rutaBase || d.pathname.startsWith(`${rutaBase}/`);
}
