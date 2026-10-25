import { describe, expect, it } from 'vitest'

import { can } from '@/lib/permissions'

describe('permisos por rol', () => {
  it('el administrador puede administrar usuarios', () => {
    expect(can('ADMINISTRADOR', 'usuario:administrar')).toBe(true)
  })

  it('el técnico no puede administrar usuarios', () => {
    expect(can('TECNICO', 'usuario:administrar')).toBe(false)
  })

  it('sin rol no hay permisos', () => {
    expect(can(undefined, 'predio:leer')).toBe(false)
  })
})
