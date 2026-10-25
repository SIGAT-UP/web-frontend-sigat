import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui'

const esquema = z.object({
  correo: z.string().email('Escriba un correo válido'),
  clave: z.string().min(1, 'La clave es obligatoria'),
})

type Formulario = z.infer<typeof esquema>

export function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({ resolver: zodResolver(esquema) })

  const enviar = (datos: Formulario) => {
    // TODO: conectar con /api/v1/auth/login cuando exista el módulo identidad.
    console.info('inicio de sesión', datos)
  }

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4">
      <div>
        <label htmlFor="correo" className="mb-1 block text-sm font-medium text-slate-700">
          Correo institucional
        </label>
        <input
          id="correo"
          type="email"
          autoComplete="username"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          {...register('correo')}
        />
        {errors.correo && <p className="mt-1 text-xs text-red-600">{errors.correo.message}</p>}
      </div>

      <div>
        <label htmlFor="clave" className="mb-1 block text-sm font-medium text-slate-700">
          Clave
        </label>
        <input
          id="clave"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
          {...register('clave')}
        />
        {errors.clave && <p className="mt-1 text-xs text-red-600">{errors.clave.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </Button>

      <p className="text-center text-xs text-slate-500">
        Acceso restringido a personal autorizado del ICA.
      </p>
    </form>
  )
}
