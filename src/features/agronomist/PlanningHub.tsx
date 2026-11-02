import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ClipboardList, Search } from 'lucide-react';
import { Button, Card, DataTable, Field, FilterSelect, Input, StateBadge } from '@/core/ui';
import { usePageMeta } from '@/app/pageMeta';
import { usePlannings } from '@/data/hooks';
import { fNumeric } from '@/core/utils/format';
import { Q } from '@/features/shared/Query';

export default function PlanningHub() {
  const q = usePlannings(); const nav = useNavigate();
  const [tipo, setTipo] = useState('todos'); const [estado, setEstado] = useState('todos'); const [search, setSearch] = useState('');
  usePageMeta('Planeación', 'Planeaciones para productores y asignaciones a técnicos');
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex items-center gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand"><ClipboardList size={20} /></span>
          <div className="flex-1"><div className="text-[14px] font-semibold">Nueva planeación</div><p className="text-[11px] text-ink-2">Crea una planeación para el productor con fecha e instrucciones.</p></div><Button onClick={() => nav('/agronomo/planeacion/nueva')}>Nueva planeación</Button></Card>
        <Card className="flex items-center gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand"><CalendarCheck size={20} /></span>
          <div className="flex-1"><div className="text-[14px] font-semibold">Asignar planeación</div><p className="text-[11px] text-ink-2">Asigna lotes a un técnico durante un período.</p></div><Button onClick={() => nav('/agronomo/planeacion/asignar')}>Asignar planeación</Button></Card>
      </div>
      <div>
        <h2 className="mb-2 text-[14px] font-semibold">Mis planeaciones</h2>
        <Card>
          <div className="mb-4 grid items-end gap-3 md:grid-cols-5">
            <FilterSelect label="Tipo" value={tipo} onChange={setTipo} options={[{ value: 'todos', label: 'Todos los tipos' }, { value: 'productor', label: 'Planeación para productor' }, { value: 'tecnico', label: 'Asignación a técnico' }]} />
            <FilterSelect label="Fecha" value="todas" onChange={() => {}} options={[{ value: 'todas', label: 'Todas las fechas' }]} />
            <FilterSelect label="Estado" value={estado} onChange={setEstado} options={[{ value: 'todos', label: 'Todos' }, ...['Pendiente', 'Aceptada', 'Rechazada', 'Completada'].map(x => ({ value: x, label: x }))]} />
            <FilterSelect label="Usuario" value="todos" onChange={() => {}} options={[{ value: 'todos', label: 'Todos' }]} />
            <Field label="Buscar usuario"><div className="relative"><Search size={14} className="absolute left-3 top-3 text-ink-3" /><Input className="pl-9" placeholder="Escribe el nombre del usuario" value={search} onChange={e => setSearch(e.target.value)} /></div></Field>
          </div>
          <Q q={q}>{ps => (
            <DataTable noun="registros" rowKey={p => p.id} onRowClick={p => nav(`/agronomo/planeacion/${p.id}`)}
              rows={ps.filter(p => (tipo === 'todos' || p.kind === tipo) && (estado === 'todos' || p.status === estado) && p.recipientName.toLowerCase().includes(search.toLowerCase()))}
              columns={[
                { header: 'Tipo', cell: p => <b>{p.kind === 'productor' ? 'Planeación para productor' : 'Asignación a técnico'}</b> },
                { header: 'Fecha', cell: p => <span className="inline-flex items-center gap-2"><CalendarCheck size={13} className="text-brand" /><b>{fNumeric(p.date).replace(/\//g, '/')}</b></span> },
                { header: 'Usuario', cell: p => `${p.recipientName} (${p.recipientRole})` }, { header: 'Estado', cell: p => <StateBadge s={p.status} /> },
                { header: '', cell: () => <span className="text-[12px] font-semibold text-brand">Ver detalle ›</span> },
              ]} />
          )}</Q>
        </Card>
      </div>
    </div>
  );
}
