import { describe, expect, it } from 'vitest';
import { destinoAutorizado, problemaUrlApi, problemaUrlApiProduccion } from './apiUrlPolicy';

const prod = (u: string | undefined) => problemaUrlApi(u, { produccion: true });
const dev = (u: string | undefined) => problemaUrlApi(u, { produccion: false });

describe('URL base de la API: valores aceptados', () => {
  it('acepta la ruta relativa recomendada y el valor por defecto', () => {
    expect(prod('/api/v1')).toBeNull();
    expect(prod('/api/v1/')).toBeNull();
    expect(prod('/')).toBeNull();
    expect(prod(undefined)).toBeNull();
    expect(prod('')).toBeNull();
    expect(prod('  /api/v1  ')).toBeNull();
  });

  it('acepta HTTPS hacia una API en otro dominio', () => {
    expect(prod('https://api.ejemplo.org/api/v1')).toBeNull();
    expect(prod('https://api.ejemplo.org:8443/api/v1')).toBeNull();
  });

  it('acepta HTTP solo hacia la propia máquina en producción (npm run preview)', () => {
    expect(prod('http://localhost:8000/api/v1')).toBeNull();
    expect(prod('http://127.0.0.1:8000/api/v1')).toBeNull();
    expect(prod('http://[::1]:8000/api/v1')).toBeNull();
  });

  it('en desarrollo acepta HTTP hacia la red local', () => {
    expect(dev('http://192.168.1.50:8000/api/v1')).toBeNull();
  });

  it('problemaUrlApiProduccion aplica las reglas de producción', () => {
    expect(problemaUrlApiProduccion('/api/v1')).toBeNull();
    expect(problemaUrlApiProduccion('http://192.168.1.50:8000/api/v1')).toMatch(/no es segura/);
  });
});

describe('URL base de la API: valores que enviarían el token a otro host', () => {
  it.each([
    '//servidor-externo.com',
    '//servidor-externo.com/api/v1',
    '///servidor-externo.com/api',
    '////servidor-externo.com',
  ])('rechaza la URL protocol-relative %s (producción y desarrollo)', url => {
    expect(prod(url)).toMatch(/otro host|protocol-relative/);
    expect(dev(url)).toMatch(/otro host|protocol-relative/);
  });

  it.each([
    '/\\servidor-externo.com',
    '\\\\servidor-externo.com',
    '\\/servidor-externo.com',
    '/api\\..\\..\\servidor',
    'https://api.ejemplo.org\\@otro.com',
  ])('rechaza barras invertidas: %s', url => {
    expect(prod(url)).toMatch(/barras invertidas/);
    expect(dev(url)).toMatch(/barras invertidas/);
  });

  it.each([
    ' //servidor-externo.com',
    '/\t/servidor-externo.com',
    '/\n/servidor-externo.com',
    '/api /v1',
  ])('rechaza espacios o caracteres de control que el navegador elimina: %j', url => {
    expect(prod(url)).not.toBeNull();
  });

  it.each(['/api/../..//otro.com', '/api/%2e%2e/x', '/./api', 'https://api.ejemplo.org/api/../x'])('rechaza segmentos . o ..: %s', url => {
    expect(prod(url)).toMatch(/segmentos/);
  });

  it('rechaza usuario y contraseña dentro de la URL', () => {
    expect(prod('https://usuario:clave@api.ejemplo.org/api/v1')).toMatch(/usuario ni contraseña/);
  });

  it('rechaza parámetros y fragmentos', () => {
    expect(prod('/api/v1?x=1')).toMatch(/parámetros/);
    expect(prod('https://api.ejemplo.org/api#x')).toMatch(/fragmentos/);
  });

  it('rechaza HTTP hacia otro host en producción, otros esquemas y URLs inválidas', () => {
    expect(prod('http://192.168.1.50:8000/api/v1')).toMatch(/no es segura/);
    expect(prod('http://api.ejemplo.org/api/v1')).toMatch(/no es segura/);
    expect(prod('ftp://api.ejemplo.org')).toMatch(/esquema no permitido/);
    expect(prod('javascript:alert(1)')).toMatch(/esquema no permitido/);
    expect(dev('file:///etc/passwd')).toMatch(/esquema no permitido/);
    expect(prod('no-es-url')).toMatch(/no es una URL válida/);
    expect(prod('api/v1')).toMatch(/no es una URL válida/);
  });
});

describe('destino de cada petición', () => {
  const pagina = 'https://sigat.ejemplo.org';

  it('acepta rutas bajo la base relativa en el mismo dominio', () => {
    expect(destinoAutorizado('/api/v1/yo/perfil', '/api/v1', pagina)).toBe(true);
    expect(destinoAutorizado('/api/v1/lotes?pagina=2', '/api/v1', pagina)).toBe(true);
    expect(destinoAutorizado('/api/v1', '/api/v1', pagina)).toBe(true);
  });

  it('acepta rutas bajo una base HTTPS externa', () => {
    expect(destinoAutorizado('https://api.ejemplo.org/api/v1/yo', 'https://api.ejemplo.org/api/v1', pagina)).toBe(true);
  });

  it.each([
    ['//otro.com/x', ''],
    ['https://otro.com/api/v1/yo', '/api/v1'],
    ['/api/v1/../../admin', '/api/v1'],
    ['/api/v1/%2e%2e/x', '/api/v1'],
    ['/api/v2/yo', '/api/v1'],
    ['/api/v10/yo', '/api/v1'],
    ['/api/v1\\..\\x', '/api/v1'],
    ['/\\otro.com/x', ''],
    ['https://api.ejemplo.org.otro.com/api/v1/yo', 'https://api.ejemplo.org/api/v1'],
    ['http://api.ejemplo.org/api/v1/yo', 'https://api.ejemplo.org/api/v1'],
    ['https://u:p@api.ejemplo.org/api/v1/yo', 'https://api.ejemplo.org/api/v1'],
  ])('rechaza %s con base %j', (destino, base) => {
    expect(destinoAutorizado(destino, base, pagina)).toBe(false);
  });

  it('con base vacía (VITE_API_URL=/) acepta el mismo dominio y rechaza otros hosts', () => {
    expect(destinoAutorizado('/yo/perfil', '', pagina)).toBe(true);
    expect(destinoAutorizado('//otro.com/yo', '', pagina)).toBe(false);
  });
});
