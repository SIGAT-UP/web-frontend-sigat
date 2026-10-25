import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <header className="mb-6">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
            Instituto Colombiano Agropecuario
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">SIGAT · Durazno</h1>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
