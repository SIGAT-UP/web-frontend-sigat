import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button, Card, DataTable, Field, FilterSelect, Input } from '@/core/ui';
import { usePageMeta } from '@/app/pageMeta';
import { services } from '@/data/services';
import { addDaysIso, fNumeric, fNumericTime, todayIso } from '@/core/utils/format';

const initial = () => ({ text: '', user: 'todos', type: 'todos', from: addDaysIso(todayIso(), -30), to: todayIso() });
import { Q } from '@/features/shared/Query';

export default function Audit() {
  usePageMeta('Auditoría', 'Historial de cambios del sistema');
  const q = useQuery({ queryKey: ['audit'], queryFn: () => services.admin.audit() });
  const [text, setText] = useState(''); const [user, setUser] = useState('todos'); const [type, setType] = useState('todos'); const [from, setFrom] = useState(() => initial().from); const [to, setTo] = useState(() => initial().to);
  const [applied, setApplied] = useState(initial);
  const bad = !!from && !!to && to < from;
  return (
    <Q q={q}>{rows => {
      const dates = rows.map(r => r.at.slice(0, 10)).sort(); const range = dates.length ? `Hay registros del ${fNumeric(dates[0])} al ${fNumeric(dates[dates.length - 1])}.` : 'Aún no hay registros.';
      const users = [...new Set(rows.map(r => r.user))]; const types = [...new Set(rows.map(r => r.type))];
      const f = rows.filter(r => (applied.user === 'todos' || r.user === applied.user) && (applied.type === 'todos' || r.type === applied.type) && (!applied.from || r.at.slice(0, 10) >= applied.from) && (!applied.to || r.at.slice(0, 10) <= applied.to)
        && `${r.user} ${r.action} ${r.entity}`.toLowerCase().includes(applied.text.toLowerCase()));
      const chips = [applied.user !== 'todos' && `Usuario: ${applied.user}`, applied.type !== 'todos' && `Tipo: ${applied.type}`].filter(Boolean) as string[];
      return (
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-[13px] font-semibold">Filtros de auditoría</h2>
            <div className="relative mb-3"><Search size={14} className="absolute left-3 top-3 text-ink-3" /><Input className="pl-9" placeholder="Buscar en auditoría… (usuario, acción o entidad afectada)" value={text} onChange={e => setText(e.target.value)} /></div>
            <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
              <FilterSelect label="Usuario" value={user} onChange={setUser} options={[{ value: 'todos', label: 'Todos los usuarios' }, ...users.map(u => ({ value: u, label: u }))]} />
              <FilterSelect label="Tipo de acción" value={type} onChange={setType} options={[{ value: 'todos', label: 'Todos los tipos' }, ...types.map(t => ({ value: t, label: t }))]} />
              <Field label="Desde"><Input type="date" value={from} onChange={e => setFrom(e.target.value)} /></Field><Field label="Hasta"><Input type="date" value={to} onChange={e => setTo(e.target.value)} /></Field>
              <Button disabled={bad} onClick={() => setApplied({ text, user, type, from, to })}>Aplicar filtros</Button>
              <Button variant="secondary" onClick={() => { const i = initial(); setText(''); setUser('todos'); setType('todos'); setFrom(i.from); setTo(i.to); setApplied(i); }}>Limpiar filtros</Button>
            </div>
            <p className={bad ? 'mt-2 text-[11px] text-danger' : 'mt-2 text-[10px] text-ink-3'}>{bad ? '«Hasta» no puede ser anterior a «Desde».' : range}</p>
          </Card>
          <Card>
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold">{f.length} registros encontrados {chips.map(c => <span key={c} className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] text-brand-strong">{c} ×</span>)}</div>
            <DataTable rows={f} rowKey={r => r.at + r.action + r.entity} noun="registros" footnote="Bitácora de solo lectura: registra cada cambio con su autor y fecha (RF-083)." columns={[
              { header: 'Fecha y hora', cell: r => fNumericTime(r.at) }, { header: 'Usuario', cell: r => r.user }, { header: 'Acción', cell: r => <b>{r.action}</b> }, { header: 'Entidad afectada', cell: r => r.entity }, { header: 'Tipo', cell: r => r.type },
            ]} />
          </Card>
        </div>
      );
    }}</Q>
  );
}
