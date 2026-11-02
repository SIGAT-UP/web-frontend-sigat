import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Leaf, MapPin, RefreshCw, Sprout, TriangleAlert, Droplet, Eye } from 'lucide-react';
import { Badge, Button, Card, CardTitle, Kpi, StateBadge } from '@/core/ui';
import { usePageMeta } from '@/app/pageMeta';
import { useControl, useFarm, useLot, useRecentActivity, useReviews, useTraps } from '@/data/hooks';
import { WithActiveLot } from '@/app/activeLot';
import { fDate, fDateTime, fMtd, fNumericTime, fShortTime, fTime, fShort } from '@/core/utils/format';
import { MtdChart } from '@/features/shared/MtdChart';
import { Q } from '@/features/shared/Query';
import type { ActivityKind } from '@/data/models/types';

const ACT_ICON: Record<ActivityKind, typeof Leaf> = { sync: RefreshCw, visit: CheckCircle2, reading: Eye, application: Droplet };

export default function AgronomistHome() {
  const farm = useFarm();
  usePageMeta('Inicio', `${farm.data?.name ? `${farm.data.name} · ` : ''}vigilancia del cultivo de durazno`);
  return <WithActiveLot>{id => <HomeLot lotId={id} />}</WithActiveLot>;
}

function HomeLot({ lotId }: { lotId: string }) {
  const lot = useLot(lotId); const control = useControl(lotId); const traps = useTraps(lotId);
  const activity = useRecentActivity(lotId); const reviews = useReviews(); const nav = useNavigate();
  return (
    <Q q={lot}>{l => (
      <Q q={control}>{c => {
        const pending = (reviews.data ?? []).filter(r => r.state === 'Sin verificar' && r.type === 'Inspección' && r.lotId === l.id);
        const warned = pending.filter(r => r.warning); const warn = warned[0];
        return (
          <div className="space-y-5">
            <section className="rounded-[18px] bg-gradient-to-br from-brand-strong to-brand-dark p-5 text-white shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"><Leaf size={20} /></span>
                <div><h2 className="text-[20px] font-bold leading-tight">{l.name}</h2><Badge tone="ok" className="mt-1 bg-white text-brand-strong">✓ {l.status}</Badge></div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-[12px] md:grid-cols-4">
                {[['Área', `${String(l.areaHa).replace('.', ',')} ha`], ['Trampas', `${l.trapsTotal} trampas`], ['Última visita', fDateTime(l.lastVisit)], ['Última sincronización', fDateTime(l.lastSync)]].map(([k, v]) => (
                  <div key={k}><dt className="text-white/70">{k}</dt><dd className="mt-0.5 text-[14px] font-bold">{v}</dd></div>
                ))}
              </dl>
            </section>
            <div className="grid gap-4 md:grid-cols-4">
              <Kpi label="MTD · último período cerrado" value={fMtd(c.mtd)} note={`moscas/trampa/día · ${c.mtdPeriod}`} />
              <Kpi label="Umbral de exportación" value={<span className="text-[24px]">{c.exportThreshold ?? 'Sin definir'}</span>} note={c.exportThreshold ? 'Umbral vigente' : 'Falta definir (UQQ-004)'} />
              <Kpi label={`Trampas leídas · ${l.name.split(' · ')[0]}`} value={`${l.trapsRead} / ${l.trapsTotal}`} note={l.lastVisit ? `Visita del ${fShort(l.lastVisit)}` : 'Sin visitas en el período'} action={<Link to="/agronomo/mapa" className="font-semibold text-brand">Ver mapa ›</Link>} />
              <Kpi tone="warn" label="Registros sin verificar" value={pending.length} note={warn ? `${warned.length} requiere${warned.length === 1 ? '' : 'n'} revisión · ${warn.trapCode}` : 'Todo al día'} action={<Link to="/agronomo/revisiones"><Badge tone="info">Revisar</Badge></Link>} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <Card>
                <CardTitle>Tendencia del MTD</CardTitle>
                <p className="-mt-2 mb-2 text-[11px] text-ink-2">moscas/trampa/día · períodos cerrados · escenario de trampeo: {c.scenario.toLowerCase()}</p>
                <MtdChart series={c.series} limit={c.scenarioLimit} />
              </Card>
              <Card>
                <CardTitle>Estado de trampas</CardTitle>
                <ul className="divide-y divide-line/70">
                  {!traps.data?.length && <li className="py-3 text-[12px] text-ink-2">Este lote no tiene trampas registradas.</li>}
                  {traps.data?.map(t => (
                    <li key={t.code} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand"><MapPin size={14} /></span>
                      <div className="flex-1 leading-tight"><div className="text-[12px] font-semibold">{t.code}</div><div className="text-[10px] text-ink-2">Lectura: {fNumericTime(t.observedAt)}</div></div>
                      <StateBadge s={t.sync} />
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <Card>
                <CardTitle>Actividad reciente</CardTitle>
                <ul className="divide-y divide-line/70">
                  {!activity.data?.length && <li className="py-3 text-[12px] text-ink-2">Sin actividad reciente.</li>}
                  {activity.data?.map((a, i) => { const I = ACT_ICON[a.kind] ?? Leaf; return (
                    <li key={`${a.at}-${i}`} className="flex items-center gap-3 py-2 text-[12px]"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand"><I size={12} /></span><span className="flex-1">{a.text}</span><span className="text-ink-2">{fShortTime(a.at)}</span></li>
                  ); })}
                </ul>
              </Card>
              <Card tone="warn">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-warn-text"><TriangleAlert size={15} /> Requiere revisión</div>
                {warn ? (<>
                  <div className="mt-2 text-[18px] font-bold text-ink">{warned.length} registro{warned.length === 1 ? '' : 's'} pendiente{warned.length === 1 ? '' : 's'}</div>
                  <p className="text-[11px] text-ink-2">{warn.trapCode} · {warn.captures} capturas · Observación {fNumericTime(warn.observedAt)}</p>
                  <Button className="mt-4" onClick={() => nav(`/agronomo/revisiones/${warn.id}`)}>Ver registro</Button>
                </>) : <p className="mt-2 text-[12px] text-ink-2">No hay registros con advertencias.</p>}
              </Card>
            </div>
            <p className="text-[11px] text-ink-3"><Sprout className="mr-1 inline" size={11} />{l.lastSync ? `Última sincronización a las ${fTime(l.lastSync)} del ${fDate(l.lastSync)}.` : 'Este lote aún no tiene sincronizaciones.'}</p>
          </div>
        );
      }}</Q>
    )}</Q>
  );
}
