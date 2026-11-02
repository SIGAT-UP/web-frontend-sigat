import { useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { Card, DataTable, FilterSelect, Input, Field } from '@/core/ui';
import { usePageMeta } from '@/app/pageMeta';
import { useLotHistory } from '@/data/hooks';
import { useActiveLot, WithActiveLot } from '@/app/activeLot';
import { fMonth, fNumeric, fTime } from '@/core/utils/format';
import { Q } from '@/features/shared/Query';

const fHist = (iso: string) => `${fNumeric(iso)} · ${fTime(iso)}`;

export default function History() {
  return <WithActiveLot>{id => <HistoryView lotId={id} />}</WithActiveLot>;
}

function HistoryView({ lotId }: { lotId: string }) {
  const { lots, setLotId } = useActiveLot(); const hist = useLotHistory(lotId);
  const [type, setType] = useState('todos'); const [month, setMonth] = useState('todos'); const [user, setUser] = useState('todos'); const [search, setSearch] = useState('');
  usePageMeta('Historial', `Registros del ${lots.data?.find(l => l.id === lotId)?.name ?? 'lote'}`);
  return (
    <Q q={hist}>{h => {
      const months = [...new Set(h.map(r => r.at.slice(0, 7)))].sort().reverse();
      const rows = h.filter(r => (type === 'todos' || r.type === type) && (month === 'todos' || r.at.startsWith(month)) && (user === 'todos' || r.user === user)
        && `${r.user} ${r.detail}`.toLowerCase().includes(search.toLowerCase()));
      const opts = (l: string[]) => [{ value: 'todos', label: l[0] }, ...l.slice(1).map(x => ({ value: x, label: x }))];
      return (
        <div className="space-y-4">
          <Card>
            <div className="grid items-end gap-3 md:grid-cols-5">
              <FilterSelect label="Lote" value={lotId} onChange={setLotId} options={(lots.data ?? []).map(l => ({ value: l.id, label: l.name }))} />
              <FilterSelect label="Tipo" value={type} onChange={setType} options={opts(['Todos los tipos', 'Inspección', 'Corrección', 'Aplicación', 'Cosecha'])} />
              <FilterSelect label="Mes" value={month} onChange={setMonth} options={[{ value: 'todos', label: 'Todos los meses' }, ...months.map(m => ({ value: m, label: fMonth(m) }))]} />
              <FilterSelect label="Usuario" value={user} onChange={setUser} options={opts(['Todos', 'Técnico', 'Agrónomo', 'Productor'])} />
              <Field label="Buscar"><div className="relative"><Search size={14} className="absolute left-3 top-3 text-ink-3" /><Input className="pl-9" placeholder="Usuario o detalle" value={search} onChange={e => setSearch(e.target.value)} /></div></Field>
            </div>
          </Card>
          <Card>
            <DataTable rows={rows} rowKey={r => r.id} noun="registros" footnote="Fecha: cuándo ocurrió el hecho en campo. Las correcciones no reemplazan el registro original."
              columns={[
                { header: 'Tipo', cell: r => <b>{r.type}</b> },
                { header: 'Fecha', cell: r => <span className="inline-flex items-center gap-2"><CalendarDays size={13} className="text-brand" />{fHist(r.at)}</span> },
                { header: 'Usuario', cell: r => r.user }, { header: 'Detalle', cell: r => <span className="text-ink-2">{r.detail}</span> },
              ]} />
          </Card>
        </div>
      );
    }}</Q>
  );
}
