const indicadores = [
  { titulo: 'Predios activos', valor: '—' },
  { titulo: 'Trampas instaladas', valor: '—' },
  { titulo: 'Lecturas del mes', valor: '—' },
  { titulo: 'MTD promedio', valor: '—' },
]

export function DashboardPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-slate-900">Panel</h1>
      <p className="mt-1 text-sm text-slate-600">
        Resumen del programa de vigilancia. Los indicadores se conectan a la API.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((indicador) => (
          <article key={indicador.titulo} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{indicador.titulo}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{indicador.valor}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
