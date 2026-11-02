import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardTitle, Kpi } from '@/core/ui';
import { usePageMeta } from '@/app/pageMeta';
import { services } from '@/data/services';
import { Q } from '@/features/shared/Query';
import clsx from 'clsx';

export default function AdminHome() {
  usePageMeta('Panel de administración', 'Resumen del sistema SIGAT');
  const q = useQuery({ queryKey: ['adminOverview'], queryFn: () => services.admin.overview() });
  return (
    <Q q={q}>{o => (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4"><Kpi label="Usuarios activos" value={o.activeUsers} /><Kpi label="Roles configurados" value={o.roles} /><Kpi label="Trampas registradas" value={o.traps} /><Kpi label="Predio configurado" value={o.farms} /></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardTitle>Estado del sistema · solo consulta</CardTitle>
            <dl className="space-y-3 text-[12px]">{o.system.map(s => <div key={s.label} className="flex justify-between"><dt className="text-ink-2">{s.label}</dt><dd className={clsx('font-semibold', s.tone === 'ok' ? 'text-brand' : 'text-warn')}>{s.value}</dd></div>)}</dl></Card>
          <Card><CardTitle right={<Link to="/admin/auditoria" className="text-[11px] font-semibold text-brand">Ver auditoría ›</Link>}>Actividad reciente</CardTitle>
            <ul className="space-y-3 text-[12px]">{o.recent.map(r => <li key={r.text}><div className="font-medium">{r.text}</div><div className="text-[10px] text-ink-3">{r.meta}</div></li>)}</ul></Card>
        </div>
        <Card><CardTitle>Pendiente de definir por el agrónomo en el programa de inspección</CardTitle>
          <div className="grid gap-3 md:grid-cols-4">{o.pending.map(p => <div key={p.title} className={clsx('rounded-[10px] border p-3', p.highlight ? 'border-warn-line bg-warn-soft' : 'border-line bg-surface')}><div className="text-[12px] font-semibold">{p.title}</div><div className={clsx('text-[10px]', p.highlight ? 'text-warn-text' : 'text-ink-2')}>{p.note}</div></div>)}</div></Card>
      </div>
    )}</Q>
  );
}
