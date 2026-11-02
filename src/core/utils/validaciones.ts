/**
 * Validaciones de forma que el front comparte con el backend y la BD SIGAT v9.
 * El servidor las repite siempre: aquí solo sirven para avisar antes de enviar.
 */

/** Restricción `trampa_codigo_formato` de la BD: Divipola (5) - ruta - número. */
export const PATRON_CODIGO_TRAMPA = /^[0-9]{5}-[0-9A-Za-z]{1,10}-[0-9]{1,4}$/;
export type TipoTrampa = 'Jackson' | 'McPhail';

/** Mismos textos que `sigat.fn_codigo_trampa_error` y el backend. `null` = válido (la duplicidad la dice el servidor). */
export function errorCodigoTrampa(codigo: string, tipo: TipoTrampa): string | null {
  const c = codigo.trim();
  if (!PATRON_CODIGO_TRAMPA.test(c)) return 'El código debe tener el formato Divipola-ruta-número, por ejemplo 54518-602-001';
  const numero = Number(/([0-9]+)$/.exec(c)?.[1] ?? NaN);
  if (tipo === 'Jackson' && numero % 2 === 0) return 'Una trampa Jackson lleva número impar (RN-005)';
  if (tipo === 'McPhail' && numero % 2 === 1) return 'Una trampa McPhail lleva número par (RN-005)';
  return null;
}

/** Tipo que corresponde al número (RN-005): impar Jackson, par McPhail. */
export const tipoPorNumero = (codigo: string): TipoTrampa => (Number(/([0-9]+)$/.exec(codigo)?.[1] ?? 1) % 2 === 0 ? 'McPhail' : 'Jackson');

/** Cédula: solo dígitos, entre 5 y 15 (persona.pers_cc es bigint positivo). */
export const cedulaValida = (v: string) => /^[0-9]{5,15}$/.test(v.trim());
/** Usuario: restricción `usuario_usuario_formato`. */
export const usuarioValido = (v: string) => /^[A-Za-z0-9._@-]{3,64}$/.test(v.trim());
/** Correo: restricción `persona_correo_formato`. */
export const correoValido = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
/** Teléfono: solo dígitos con + opcional. */
export const telefonoValido = (v: string) => v.trim() === '' || /^\+?[0-9]{7,15}$/.test(v.trim());

export const iniciales = (nombre: string, apellido: string) => `${nombre.trim()[0] ?? ''}${apellido.trim()[0] ?? ''}`.toUpperCase();
