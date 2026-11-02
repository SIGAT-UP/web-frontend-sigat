import { describe, expect, it } from 'vitest';
import { toSessionUser } from './repositories';
import { ApiError } from './client';

const base = {
  id: 7, nombre: 'Ana Prueba', iniciales: 'AP', usuario: 'ana.prueba', correo: null,
  rol_descripcion: '', predio_etiqueta: null, requiere_cambio_contrasena: false,
};

describe('roles con acceso a la web', () => {
  it('traduce los tres roles web', () => {
    expect(toSessionUser({ ...base, rol: 'ADMINISTRADOR' }).role).toBe('ADMIN');
    expect(toSessionUser({ ...base, rol: 'AGRONOMO_SUPERVISOR' }).role).toBe('AGRONOMO');
    expect(toSessionUser({ ...base, rol: 'PRODUCTOR' }).role).toBe('PRODUCTOR');
  });

  it('el técnico no abre la web (solo móvil)', () => {
    expect(() => toSessionUser({ ...base, rol: 'TECNICO' })).toThrow(ApiError);
  });
});
