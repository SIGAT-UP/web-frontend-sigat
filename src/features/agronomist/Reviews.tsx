import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, DataTable, Kpi, StateBadge, Tabs } from '@/core/ui';
import { usePageMeta } from '@/app/pageMeta';
import { useReviews } from '@/data/hooks';
import { fNumeric, fTime } from '@/core/utils/format';
import { Q } from '@/features/shared/Query';

type Tab = 'sin' | 'conf' | 'corr' | 'rech' | 'todos';
export default function Reviews() {
  const q = useReviews(); const nav = useNavigate(); const [tab, setTab] = useState<Tab>('todos');
  usePageMeta('Revisiones · Bandeja de validación', 'Registros por validar y hallazgos fitosanitarios');
  return (
    <Q q={q}>{rs => {
      const n = (s: string) => rs.filter(r => r.state === s).length;
      const filt = { sin: 'Sin verificar', conf: 'Confirmado', corr: 'Corregido', rech: 'Rechazado' } as const;
      const rows = tab === 'todos' ? rs : rs.filter(r => r.state === filt[tab]);
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4"><Kpi tone="warn" label="Registros sin verificar" value={n('Sin verificar')} /><Kpi label="Hallazgos fitosanitarios abiertos" value={0} /><Kpi label="Revisados este mes" value={n('Confirmado') + n('Corregido')} /></div>
          <Card>
            <Tabs value={tab} onChange={setTab} items={[{ value: 'sin', label: `Sin verificar (${n('Sin verificar')})` }, { value: 'conf', label: `Confirmados (${n('Confirmado')})` }, { value: 'corr', label: `Corregidos (${n('Corregido')})` }, { value: 'rech', label: `Rechazados (${n('Rechazado')})` }, { value: 'todos', label: `Todos (${rs.length})` }]} />
            <div className="mt-3">
              <DataTable rows={rows} rowKey={r => r.id} noun="registros" footnote="Sin hallazgos fitosanitarios reportados en el período. Cuando un técnico reporte uno, aparecerá aquí como «Sin verificar»."
                columns={[
                  { header: 'Fecha', cell: r => `${fNumeric(r.observedAt).slice(0, 5)} ${fTime(r.observedAt)}` }, { header: 'Tipo', cell: r => <b>{r.type}</b> },
                  { header: 'Detalle', cell: r => <span>{r.detail.replace(' · Solapada', '')}{r.warning && <> · <span className="font-semibold text-warn-text">{r.warning}</span></>}</span> },
                  { header: 'Lote', cell: r => r.lotLabel }, { header: 'Usuario', cell: r => r.user }, { header: 'Estado', cell: r => <StateBadge s={r.state} /> },
                  { header: '', cell: r => r.state === 'Sin verificar' && r.type === 'Inspección' && r.warning ? <button onClick={() => nav(`/agronomo/revisiones/${r.id}`)} className="text-[12px] font-semibold text-brand">Revisar ›</button> : (r.type === 'Inspección' && r.state !== 'Autoreporte' ? <button onClick={() => nav(`/agronomo/revisiones/${r.id}`)} className="text-[12px] font-semibold text-ink-3 hover:text-brand">Ver ›</button> : null) },
                ]} />
            </div>
          </Card>
          <p className="text-[11px] text-ink-3">Los autorreportes del productor no constituyen inspecciones oficiales.</p>
        </div>
      );
    }}</Q>
  );
}
