import { NavLink, Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils/cn'

const navegacion = [
  { ruta: '/', texto: 'Panel' },
  { ruta: '/predios', texto: 'Predios' },
  { ruta: '/lotes', texto: 'Lotes' },
  { ruta: '/trampas', texto: 'Trampas' },
  { ruta: '/lecturas', texto: 'Lecturas' },
  { ruta: '/mtd', texto: 'MTD' },
  { ruta: '/conceptos', texto: 'Conceptos' },
  { ruta: '/reportes', texto: 'Reportes' },
  { ruta: '/usuarios', texto: 'Usuarios' },
  { ruta: '/catalogos', texto: 'Catálogos' },
  { ruta: '/importaciones', texto: 'Importaciones' },
]

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-60 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-bold text-slate-900">SIGAT · Durazno</p>
          <p className="text-xs text-slate-500">Backoffice ICA</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navegacion.map((item) => (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              end={item.ruta === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100',
                  isActive && 'bg-emerald-50 font-semibold text-emerald-800',
                )
              }
            >
              {item.texto}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <span className="text-sm text-slate-500">Programa de vigilancia fitosanitaria</span>
          <NavLink to="/login" className="text-sm font-medium text-emerald-700 hover:underline">
            Salir
          </NavLink>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
