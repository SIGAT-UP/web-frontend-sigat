import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import clsx from 'clsx';
import { Badge, Button, Card, FilterSelect, Tabs } from '@/core/ui';
import { usePageMeta } from '@/app/pageMeta';
import { useDataAsOf, useFarm, useTraps } from '@/data/hooks';
import { useActiveLot } from '@/app/activeLot';
import { fDateTime } from '@/core/utils/format';
import { Q } from '@/features/shared/Query';
import type { Lot, Trap } from '@/data/models/types';

const COVER: Record<Lot['coverage'], string> = { completo: 'bg-[#8fd0a8]/70 border-brand-dark', parcial: 'bg-[#dff1e6] border-brand', sin_visitar: 'bg-surface-raised border-dashed border-ink-3' };

export default function MapPage() {
  const farm = useFarm(); const traps = useTraps(); const nav = useNavigate(); const asOf = useDataAsOf();
  const { lotId: sel, lots, setLotId: setSel } = useActiveLot(); const [layer, setLayer] = useState<'cobertura' | 'fito'>('cobertura');
  const [tech, setTech] = useState('todos');
  usePageMeta('Mapa', `Cobertura de visitas por lote · ${farm.data?.name ?? ''}`);
  const stats = useMemo(() => {
    const t = traps.data ?? []; const visited = t.filter(x => x.read);
    return { visited: visited.length, notVisited: t.length - visited.length, review: t.filter(x => x.config === 'Revisar').length };
  }, [traps.data]);
  return (
    <Q q={lots}>{ls => {
      const lot = ls.find(l => l.id === sel);
      const technicians = [...new Set(ls.map(l => l.technician).filter((t): t is string => !!t))].sort();
      const covered = (c: Lot['coverage']) => ls.filter(l => l.coverage === c).length;
      return (
        <div className="space-y-4">
          <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div><div className="mb-1 text-[12px] font-medium text-ink-2">Predio</div><div className="flex h-10 items-center rounded-[10px] border border-line bg-surface px-3 text-[13px] font-semibold">{farm.data?.name ?? '—'}</div></div>
            <FilterSelect label="Técnico" value={tech} onChange={setTech} options={[{ value: 'todos', label: 'Todos' }, ...technicians.map(t => ({ value: t, label: t }))]} />
            <div><div className="mb-1 text-[12px] font-medium text-ink-2">Capa</div><Tabs variant="pill" value={layer} onChange={setLayer} items={[{ value: 'cobertura', label: 'Cobertura' }, { value: 'fito', label: 'Fitosanitario' }]} /></div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <Card>
              <h2 className="mb-3 text-[13px] font-semibold">{farm.data?.name} · {ls.length} lotes · {traps.data?.length ?? 0} trampas</h2>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line bg-[#e7ece9]" style={{ backgroundImage: 'linear-gradient(#d9dfdb 1px,transparent 1px),linear-gradient(90deg,#d9dfdb 1px,transparent 1px)', backgroundSize: '40px 40px' }}>
                {ls.filter(l => tech === 'todos' || l.technician === tech || l.coverage === 'sin_visitar').map(l => (
                  <button key={l.id} onClick={() => setSel(l.id)} aria-pressed={sel === l.id} style={{ left: `${l.shape.x}%`, top: `${l.shape.y}%`, width: `${l.shape.w}%`, height: `${l.shape.h}%` }}
                    className={clsx('absolute rounded-[6px] border-2 text-left transition-shadow', COVER[l.coverage], sel === l.id && 'ring-2 ring-brand-dark/60')}>
                    <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold shadow-card">{l.name} · {l.trapsRead} de {l.trapsTotal}</span>
                    {traps.data?.filter(t => t.lotId === l.id).map(t => <TrapDot key={t.code} t={t} layer={layer} />)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-ink-3">{asOf.data ? `Según datos recibidos hasta el ${fDateTime(asOf.data)}. ` : ''}Una trampa cuenta como visitada cuando su lectura, identificada por QR, por código, llega al servidor dentro del período de lectura.</p>
            </Card>
            <div className="space-y-4">
              {lot && <Card>
                <div className="text-[10px] text-ink-2">Lote seleccionado</div>
                <h3 className="text-[18px] font-bold">{lot.name}</h3>
                {lot.needsReview > 0 ? <Badge tone="warn" className="mt-1"><TriangleAlert size={11} /> Completo · {lot.needsReview} requiere revisión</Badge> : <Badge tone={lot.coverage === 'sin_visitar' ? 'neutral' : 'ok'} className="mt-1">{lot.coverage === 'completo' ? 'Completo' : lot.coverage === 'parcial' ? 'Parcial' : 'Sin visitar'}</Badge>}
                <dl className="mt-4 space-y-2 text-[12px]">
                  {[['Trampas visitadas', `${lot.trapsRead} de ${lot.trapsTotal}`], ['Última visita', fDateTime(lot.lastVisit)], ['Técnico', lot.technician ?? '—'], ['Sin verificar', `${lot.unverified} registros`], ['Requiere revisión', `${lot.needsReview} registro${lot.needsReview === 1 ? '' : 's'}`]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2"><dt className="text-ink-2">{k}</dt><dd className="font-semibold">{v}</dd></div>
                  ))}
                </dl>
                <Button block className="mt-4" onClick={() => nav('/agronomo/trampas')}>Ver trampas del lote</Button>
                <Button block variant="secondary" className="mt-2" onClick={() => nav('/agronomo/lote')}>Ver lote</Button>
              </Card>}
              <Card>
                <h3 className="mb-2 text-[12px] font-semibold">Leyenda · cobertura del período</h3>
                <ul className="space-y-1.5 text-[11px] text-ink-2">
                  <li className="flex items-center gap-2"><i className="h-3 w-5 rounded-sm border-2 border-brand-dark bg-[#8fd0a8]/70" /> Lote visitado completo · {covered('completo')}</li>
                  <li className="flex items-center gap-2"><i className="h-3 w-5 rounded-sm border-2 border-brand bg-[#dff1e6]" /> Lote visitado en parte · {covered('parcial')}</li>
                  <li className="flex items-center gap-2"><i className="h-3 w-5 rounded-sm border-2 border-dashed border-ink-3 bg-surface-raised" /> Lote sin visitar · {covered('sin_visitar')}</li>
                  <li className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-brand-dark" /> Trampa visitada · {stats.visited}</li>
                  <li className="flex items-center gap-2"><i className="h-3 w-3 rounded-full border-2 border-ink-3 bg-white" /> Trampa no visitada · {stats.notVisited}</li>
                  <li className="flex items-center gap-2"><i className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-warn-strong bg-warn-soft text-[8px] text-warn-strong">▲</i> Requiere revisión · {stats.review}</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      );
    }}</Q>
  );
}

function TrapDot({ t, layer }: { t: Trap; layer: 'cobertura' | 'fito' }) {
  const warn = t.config === 'Revisar';
  const fito = layer === 'fito' && t.read;
  const size = fito ? 10 + Math.min(t.lastReadingCaptures, 5) * 3 : 14;
  return (
    <span title={`${t.code} · ${t.read ? `${t.lastReadingCaptures} capturas` : 'sin lectura'}`} style={{ left: `${t.x}%`, top: `${t.y}%`, width: size, height: size }}
      className={clsx('absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2', warn ? 'flex items-center justify-center border-warn-strong bg-warn-soft text-[8px] text-warn-strong' : t.read ? (fito ? 'border-warn-strong bg-warn-strong/70' : 'border-brand-dark bg-brand-dark') : 'border-ink-3 bg-white')}>{warn ? '▲' : ''}</span>
  );
}
