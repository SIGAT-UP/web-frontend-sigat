import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ClientModule = typeof import('./client');

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });

async function cargarCliente(): Promise<ClientModule> {
  vi.resetModules();
  return import('./client');
}

describe('token de sesión de la web', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('vive solo en memoria: nunca se escribe en localStorage ni sessionStorage', async () => {
    const { tokenStore } = await cargarCliente();
    tokenStore.set('token-de-prueba');
    expect(tokenStore.get()).toBe('token-de-prueba');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('borra el token que guardaban versiones anteriores al cargar la app', async () => {
    localStorage.setItem('sigat.token', 'viejo');
    sessionStorage.setItem('sigat.token', 'viejo');
    localStorage.setItem('sigat.dispositivo', 'disp-1');
    const { tokenStore } = await cargarCliente();
    expect(localStorage.getItem('sigat.token')).toBeNull();
    expect(sessionStorage.getItem('sigat.token')).toBeNull();
    expect(tokenStore.get()).toBeNull();
    // Lo que no es secreto se conserva.
    expect(localStorage.getItem('sigat.dispositivo')).toBe('disp-1');
  });

  it('clear() deja la sesión vacía', async () => {
    const { tokenStore } = await cargarCliente();
    tokenStore.set('x');
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });
});

describe('peticiones', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('envía el token Bearer y la cookie (credentials: include)', async () => {
    const { http, tokenStore } = await cargarCliente();
    tokenStore.set('abc');
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await http.get('/yo/perfil');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/yo/perfil');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc');
    expect(init.credentials).toBe('include');
  });

  it('ante un 401 renueva una vez con la cookie y repite la petición', async () => {
    const { http, tokenStore } = await cargarCliente();
    tokenStore.set('vencido');
    fetchMock
      .mockResolvedValueOnce(json(401, { codigo: 'TOKEN_VENCIDO', detail: 'Vencido' }))
      .mockResolvedValueOnce(json(200, { token: 'nuevo' }))
      .mockResolvedValueOnce(json(200, { nombre: 'Ana' }));
    const r = await http.get<{ nombre: string }>('/yo/perfil');
    expect(r.nombre).toBe('Ana');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/refresco');
    expect(tokenStore.get()).toBe('nuevo');
    expect(localStorage.length).toBe(0);
  });

  it('si la renovación falla, borra la sesión y avisa a la app', async () => {
    const { http, tokenStore, UNAUTHORIZED_EVENT, ApiError } = await cargarCliente();
    tokenStore.set('vencido');
    const aviso = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, aviso);
    fetchMock
      .mockResolvedValueOnce(json(401, { codigo: 'TOKEN_VENCIDO', detail: 'Vencido' }))
      .mockResolvedValueOnce(json(401, { codigo: 'REFRESCO_VENCIDO', detail: 'Vencido' }));
    await expect(http.get('/yo/perfil')).rejects.toBeInstanceOf(ApiError);
    expect(tokenStore.get()).toBeNull();
    expect(aviso).toHaveBeenCalledOnce();
    window.removeEventListener(UNAUTHORIZED_EVENT, aviso);
  });

  it('403 y 501 llegan como ApiError con el código del backend', async () => {
    const { http, tokenStore } = await cargarCliente();
    tokenStore.set('t');
    fetchMock.mockResolvedValueOnce(json(403, { codigo: 'ROL_SIN_PERMISO', detail: 'Sin permiso' }));
    await expect(http.get('/usuarios')).rejects.toMatchObject({ status: 403, code: 'ROL_SIN_PERMISO' });
    fetchMock.mockResolvedValueOnce(json(501, { codigo: 'NO_IMPLEMENTADO', detail: 'Lotes: pendiente de implementar en el backend.' }));
    await expect(http.get('/lotes')).rejects.toMatchObject({ status: 501, code: 'NO_IMPLEMENTADO' });
  });

  it('un fallo de red se convierte en un mensaje legible (status 0)', async () => {
    const { http } = await cargarCliente();
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(http.get('/salud')).rejects.toMatchObject({ status: 0 });
  });
});

describe('el token solo viaja a la API autorizada', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it.each([
    '//servidor-externo.com/api/v1',
    '/\\servidor-externo.com/api/v1',
    '\\\\servidor-externo.com',
  ])('con VITE_API_URL=%s no se envía ninguna petición', async base => {
    vi.stubEnv('VITE_API_URL', base);
    const { http, tokenStore } = await cargarCliente();
    tokenStore.set('secreto');
    await expect(http.get('/yo/perfil')).rejects.toMatchObject({ status: 0, code: 'CONFIGURACION_API_INVALIDA' });
    expect(await http.refreshSession()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['/../../otro', '/%2e%2e/otro', '/\\servidor-externo.com'])(
    'un path %s que saldría de la ruta de la API se rechaza sin llamar a fetch', async path => {
      const { http, tokenStore } = await cargarCliente();
      tokenStore.set('secreto');
      await expect(http.get(path)).rejects.toMatchObject({ code: 'DESTINO_NO_AUTORIZADO' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

  it('con VITE_API_URL=/ un path //host se rechaza (sería otro host)', async () => {
    vi.stubEnv('VITE_API_URL', '/');
    const { http, tokenStore } = await cargarCliente();
    tokenStore.set('secreto');
    await expect(http.get('//servidor-externo.com/x')).rejects.toMatchObject({ code: 'DESTINO_NO_AUTORIZADO' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['//servidor-externo.com/x', 'https://servidor-externo.com/x'])(
    'con base /api/v1, un path %s queda dentro del mismo origen y de /api/v1', async path => {
      const { http } = await cargarCliente();
      fetchMock.mockResolvedValueOnce(json(200, {}));
      await http.get(path);
      const u = new URL((fetchMock.mock.calls[0] as [string])[0], window.location.origin);
      expect(u.origin).toBe(window.location.origin);
      expect(u.pathname.startsWith('/api/v1/')).toBe(true);
    });

  it('con base relativa por defecto, el token solo va al mismo origen y bajo /api/v1', async () => {
    const { http, tokenStore } = await cargarCliente();
    tokenStore.set('secreto');
    fetchMock.mockImplementation(async () => json(200, {}));
    await http.get('/yo/perfil');
    await http.post('/yo/notificaciones/1/leida');
    for (const [url] of fetchMock.mock.calls as [string][]) {
      const u = new URL(url, window.location.origin);
      expect(u.origin).toBe(window.location.origin);
      expect(u.pathname.startsWith('/api/v1/')).toBe(true);
    }
  });

  it('con una API HTTPS externa, el token va solo a ese host', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.ejemplo.org/api/v1');
    const { http, tokenStore } = await cargarCliente();
    tokenStore.set('secreto');
    fetchMock.mockResolvedValueOnce(json(200, {}));
    await http.get('/yo/perfil');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.ejemplo.org/api/v1/yo/perfil');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secreto');
    await expect(http.get('/../../otro')).rejects.toMatchObject({ code: 'DESTINO_NO_AUTORIZADO' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const [u] of fetchMock.mock.calls as [string][]) expect(new URL(u).host).toBe('api.ejemplo.org');
  });
});
