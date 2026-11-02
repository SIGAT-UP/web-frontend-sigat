import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Section, DescriptionList, StackedFacts, FormLayout, ProfileHeader, PageActions } from '@/core/ui/patterns';
import { Badge, Button, Card, DataTable, ErrorBox, Field, FilterSelect, Input, Loading, Notice, Select, Tabs, StateBadge, useToast, type Tone } from '@/core/ui';
import { BackLink } from '@/core/ui/PageHeader';
import { usePageMeta } from '@/app/pageMeta';
import { useAuth } from '@/app/auth';
import { services } from '@/data/services';
import { useFarm, useLots, usePlannings } from '@/data/hooks';
import { addDaysIso, daysSince, fDate, fLong, fMtd, fNumeric, todayIso } from '@/core/utils/format';
import { Q } from '@/features/shared/Query';
import PlanningDetail from '@/features/shared/PlanningDetail';
import type { Lot } from '@/data/models/types';

/** Nombre del predio del productor en sesión (lo entrega el backend). */
const useFarmName = () => { const f = useFarm(); return f.data?.name ?? ''; };
const withFarm = (name: string, rest: string) => (name ? `${name} · ${rest}` : rest.charAt(0).toUpperCase() + rest.slice(1));
const useCrop = () => useQuery({ queryKey: ['cropLots'], queryFn: () => services.producer.cropLots() });
const useApps = () => useQuery({ queryKey: ['applications'], queryFn: () => services.producer.applications() });
const useHarvests = () => useQuery({ queryKey: ['harvests'], queryFn: () => services.producer.harvests() });
const scTone = (s: Lot['scenario']): Tone => (s === 'Supresión' ? 'warn' : s === 'Erradicación' ? 'ok' : 'neutral');
const ScenarioBadge = ({ s }: { s: Lot['scenario'] }) => <Badge tone={scTone(s)}>{s}</Badge>;
const None = ({ children = 'Sin registro' }: { children?: string }) => <span className="text-ink-3">{children}</span>;

/* ------------------------------------------------------------------ Inicio */
export function ProducerHome() {
  const farmName = useFarmName();
  usePageMeta('Inicio', withFarm(farmName, 'resumen de mi cultivo')); const { user } = useAuth(); const nav = useNavigate();
  const crop = useCrop(); const pl = usePlannings(); const apps = useApps(); const hv = useHarvests();
  const lastVisited = (crop.data ?? []).map(c => c.lot).filter(l => l.lastVisit).sort((a, b) => b.lastVisit!.localeCompare(a.lastVisit!))[0];
  const pend = (pl.data ?? []).filter(p => p.kind === 'productor' && p.status === 'Pendiente');
  const lastApp = apps.data?.[0]; const nextH = (hv.data ?? []).filter(h => h.expectedDate && !h.actualDate).sort((a, b) => a.expectedDate!.localeCompare(b.expectedDate!))[0];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] font-medium">Hola, {user?.name.split(' ')[0]}. Este es el estado de tus {crop.data?.length ?? 0} lotes{farmName ? ` en ${farmName}` : ''}.</p>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => nav('/productor/cosecha/registrar')}>Registrar cosecha</Button><Button onClick={() => nav('/productor/aplicaciones/nueva')}>Registrar aplicación</Button></div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><div className="text-[11px] text-ink-2">Última visita del técnico</div><div className="my-1 text-[20px] font-bold">{lastVisited ? fDate(lastVisited.lastVisit) : 'Sin visitas'}</div><div className="text-[11px] text-brand">{lastVisited ? `Se revisaron ${lastVisited.trapsRead} de ${lastVisited.trapsTotal} trampas del ${lastVisited.name}` : 'Aún no hay visitas registradas'}</div></Card>
        <Card><div className="text-[11px] text-ink-2">Última aplicación registrada</div><div className="my-1 text-[20px] font-bold">{lastApp ? (daysSince(lastApp.at) === 0 ? 'Hoy' : `Hace ${daysSince(lastApp.at)} día${daysSince(lastApp.at) === 1 ? '' : 's'}`) : 'Sin registro'}</div><div className="text-[11px] text-brand">{lastApp ? `${fDate(lastApp.at)} · ${lastApp.lotLabel}` : 'Aún sin registrar'}</div></Card>
        <Card><div className="text-[11px] text-ink-2">Próxima cosecha esperada</div><div className="my-1 text-[20px] font-bold">{nextH ? fDate(nextH.expectedDate) : 'Sin registro'}</div><div className="text-[11px] text-brand">{nextH ? `${nextH.expectedKg ?? '—'} kg · ${nextH.lotLabel}` : 'Aún sin registrar'}</div></Card>
      </div>
      <Section title="Mis lotes" subtitle="Resultado de la última inspección oficial">
        <Q q={crop}>{cs => (
          <>
            <DataTable rows={cs} rowKey={c => c.lot.id} noun="lotes" columns={[
              { header: 'Lote', cell: c => <b>{c.lot.name}</b> },
              { header: 'Trampas revisadas', cell: c => `${c.lot.trapsRead} de ${c.lot.trapsTotal}` },
              { header: 'Moscas por trampa al día', cell: c => c.mtd == null ? <None>Sin lecturas</None> : <b>{fMtd(c.mtd)}</b> },
              { header: 'Situación fitosanitaria', cell: c => <ScenarioBadge s={c.lot.scenario} /> },
              { header: 'Última aplicación', cell: c => c.lastApplication === 'Sin registro' ? <None /> : c.lastApplication },
              { header: '', cell: c => <Link to={`/productor/estado/${c.lot.id}`} className="text-[12px] font-semibold text-brand">Ver lote ›</Link> },
            ]} />
            <p className="mt-2 text-[10px] text-ink-3">Supresión = hay presencia baja de mosca y se aplican medidas para reducirla. Erradicación = presencia muy baja, cercana a cero.</p>
          </>
        )}</Q>
      </Section>
      <Notice tone="info" title="Lo que registras tú (aplicaciones y cosecha) queda en tu historial como autoreporte y no cambia el resultado de la inspección oficial.">El concepto para exportar todavía no se emite: falta <button className="font-semibold underline" onClick={() => nav('/productor/estado')}>definir el umbral oficial</button>.</Notice>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div><div className="flex items-center gap-2 text-[14px] font-semibold">Planeaciones {pend.length > 0 && <Badge tone="warn">Nueva</Badge>}</div>
            <p className="text-[11px] text-ink-2">{pend.length ? `${pend.length} pendiente${pend.length > 1 ? 's' : ''} de responder · ${pend[0].activity} · ${fLong(pend[0].date).toLowerCase()} · enviada por ${pend[0].createdByName} (agrónomo)` : 'No tienes planeaciones pendientes de responder.'}</p></div>
          <Link to="/productor/planeaciones" className="whitespace-nowrap text-[12px] font-semibold text-brand">Ver planeaciones ›</Link>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ Mi cultivo */
export function MyCrop() {
  const farmName = useFarmName(); const q = useCrop();
  usePageMeta('Mi cultivo', withFarm(farmName, `durazno · ${q.data?.length ?? 0} lote${q.data?.length === 1 ? '' : 's'}`));
  return (
    <div className="space-y-4">
      <p className="text-[13px] font-medium">Tus lotes y lo último que se registró en cada uno.</p>
      <Q q={q}>{cs => (
        <div className="grid gap-4 md:grid-cols-2">{cs.map(c => (
          <Card key={c.lot.id}>
            <div className="flex items-start justify-between"><div><h3 className="text-[16px] font-semibold">{c.lot.name}</h3><div className="mt-1.5"><ScenarioBadge s={c.lot.scenario} /></div></div>
              <Link to={`/productor/estado/${c.lot.id}`} className="text-[12px] font-semibold text-brand">Ver estado del lote ›</Link></div>
            <dl className="mt-3 divide-y divide-line/70 text-[12px]">{([['Trampas del lote', c.trapRange, true], ['Última visita del técnico', c.lastVisit, !c.lastVisit.startsWith('Sin')], ['Última aplicación', c.lastApplication, c.lastApplication !== 'Sin registro'], ['Cosecha esperada', c.expectedHarvest, c.expectedHarvest !== 'Sin registro']] as const).map(([k, v, has]) => (
              <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-ink-2">{k}</dt><dd className={has ? 'font-semibold' : 'text-ink-3'}>{v}</dd></div>))}</dl>
          </Card>))}</div>
      )}</Q>
      <p className="text-[10px] text-ink-3">Solo el técnico registra las visitas y las lecturas de trampas; tú registras tus aplicaciones y tu cosecha.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ Estado del lote */
export function LotState() {
  const { id } = useParams(); const crop = useCrop(); const lotId = id ?? crop.data?.[0]?.lot.id ?? ''; const nav = useNavigate(); const farmName = useFarmName();
  const q = useQuery({ queryKey: ['lotStatus', lotId], queryFn: () => services.producer.lotStatus(lotId), enabled: !!lotId });
  usePageMeta('Estado del lote', [q.data?.lot.name, farmName].filter(Boolean).join(' · '));
  if (!lotId) return crop.error ? <ErrorBox error={crop.error} /> : crop.isLoading ? <Loading /> : <Notice tone="info">Aún no tienes lotes registrados.</Notice>;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between"><BackLink to="/productor/mi-cultivo">Volver a Mi cultivo</BackLink>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => nav('/productor/cosecha/registrar?lote=' + lotId)}>Registrar cosecha</Button><Button onClick={() => nav('/productor/aplicaciones/nueva?lote=' + lotId)}>Registrar aplicación</Button></div></div>
      <Q q={q}>{s => (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><h3 className="mb-2 text-[14px] font-semibold">Resumen del lote</h3>
            <StackedFacts rows={[['Situación fitosanitaria', s.situation, s.situationNote], ['Moscas por trampa al día', fMtd(s.mtd), s.mtdNote], ['Concepto para exportar', s.concept, s.conceptNote], ['Etapa del cultivo', s.stage, s.stageNote], ['Última aplicación', s.lastApplication, s.lastApplicationNote], ['Cosecha', s.harvest, s.harvestNote], ['Hallazgos fitosanitarios vigentes', s.findings, s.findingsNote]]} /></Card>
          <Card className="flex flex-col"><h3 className="text-[14px] font-semibold">Línea de tiempo del lote</h3><p className="mb-3 text-[10px] text-ink-3">Ordenada por la fecha en que ocurrió</p>
            <ol className="relative flex-1 space-y-5 pl-5 before:absolute before:left-[4px] before:top-1 before:h-[calc(100%-8px)] before:w-px before:bg-line">{s.timeline.map((t, i) => (
              <li key={i} className="relative flex items-start justify-between gap-3"><span className={`absolute -left-5 top-1 h-2.5 w-2.5 rounded-full ${t.badge === 'Autoreporte' ? 'bg-info' : 'bg-brand'}`} />
                <div><div className="text-[10px] text-ink-2">{fDate(t.at)}</div><div className="text-[13px] font-semibold">{t.title}</div><div className="text-[11px] text-ink-2">{t.subtitle}</div></div>
                <Badge tone={t.badge === 'Autoreporte' ? 'info' : 'ok'}>{t.badge}</Badge></li>))}</ol>
            <Link to="/productor/historial" className="mt-4 text-[12px] font-semibold text-brand">Ver historial completo ›</Link></Card>
        </div>
      )}</Q>
    </div>
  );
}

/* ------------------------------------------------------------------ Aplicaciones */
export function Applications() {
  usePageMeta('Aplicaciones', 'Aplicaciones fitosanitarias que registras en tus lotes'); const apps = useApps(); const crop = useCrop(); const nav = useNavigate();
  return (
    <div className="space-y-4">
      <PageActions intro="Registra cada fumigación u otra aplicación para tener tu propio control."><Button onClick={() => nav('/productor/aplicaciones/nueva')}>Registrar aplicación</Button></PageActions>
      <Section title="Última aplicación por lote">
        <Q q={crop}>{cs => <DataTable rows={cs} rowKey={c => c.lot.id} noun="lotes" columns={[
          { header: 'Lote', cell: c => <b>{c.lot.name}</b> },
          { header: 'Última aplicación', cell: c => { const a = apps.data?.find(x => x.lotId === c.lot.id); return a ? fDate(a.at) : <None />; } },
          { header: 'Días desde la aplicación', cell: c => { const a = apps.data?.find(x => x.lotId === c.lot.id); if (!a) return <None>—</None>; const n = daysSince(a.at); return `${n} día${n === 1 ? '' : 's'}`; } },
          { header: 'Producto', cell: c => { const a = apps.data?.find(x => x.lotId === c.lot.id); return a ? a.product : <None>—</None>; } }]} />}</Q>
      </Section>
      <Section title="Mis aplicaciones registradas" subtitle={`${apps.data?.length ?? 0} registro${apps.data?.length === 1 ? '' : 's'}`}>
        <Q q={apps}>{as => <DataTable rows={as} rowKey={a => a.id} noun="registros" footnote="Las aplicaciones son autoreportes: quedan en tu historial y no cambian el resultado de la inspección oficial." columns={[
          { header: 'Fecha', cell: a => <b>{fDate(a.at)}</b> }, { header: 'Lote', cell: a => a.lotLabel }, { header: 'Producto', cell: a => a.product }, { header: 'Dosis', cell: a => a.dose },
          { header: 'Área tratada', cell: a => a.areaHa ? `${String(a.areaHa).replace('.', ',')} ha` : '—' }, { header: 'Responsable', cell: a => a.responsible ?? '—' }, { header: 'Registro', cell: () => <Badge tone="info">Autoreporte</Badge> }]} />}</Q>
      </Section>
    </div>
  );
}

const UNITS = ['ml por L de agua', 'L por hectárea', 'kg por hectárea'];
export function NewApplication() {
  usePageMeta('Registrar aplicación', 'Aplicación · nuevo registro'); const { user } = useAuth(); const lots = useLots(); const nav = useNavigate(); const qc = useQueryClient(); const toast = useToast(); const [sp] = useSearchParams();
  const prods = useQuery({ queryKey: ['catalogItems', 'productos'], queryFn: () => services.program.catalogItems('productos') });
  const [f, setF] = useState({ lotId: sp.get('lote') ?? '', at: todayIso(), product: '', dose: '', unit: UNITS[0], area: '', who: user?.name ?? '' }); const [errs, setErrs] = useState<Record<string, string>>({});
  const m = useMutation({ mutationFn: () => services.producer.registerApplication({ lotId: f.lotId, at: f.at + 'T12:00:00', product: f.product, dose: `${f.dose} ${f.unit}`, areaHa: Number(f.area), responsible: f.who }), onSuccess: () => { qc.invalidateQueries(); toast('Aplicación registrada.'); nav('/productor/aplicaciones'); } });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const lotArea = lots.data?.find(l => l.id === f.lotId)?.areaHa;
  const go = () => {
    const e: Record<string, string> = {};
    if (!f.lotId) e.lotId = 'Selecciona el lote.'; if (!f.at) e.at = 'Indica la fecha.'; else if (f.at > todayIso()) e.at = 'La fecha no puede ser futura.';
    if (!f.product) e.product = 'Selecciona el producto aplicado.'; if (!(Number(f.dose) > 0)) e.dose = 'La dosis debe ser mayor que 0.';
    if (!(Number(f.area) > 0)) e.area = 'El área debe ser mayor que 0.'; else if (lotArea && Number(f.area) > lotArea) e.area = `El área no puede superar la del lote (${String(lotArea).replace('.', ',')} ha).`;
    if (!f.who.trim()) e.who = 'Indica quién aplicó.'; setErrs(e); if (!Object.keys(e).length) m.mutate();
  };
  const n = Object.keys(errs).length;
  return (
    <div><BackLink to="/productor/aplicaciones">Volver a Aplicaciones</BackLink>
      <FormLayout title="Datos de la aplicación" subtitle="Todos los campos son obligatorios." errorCount={n} aside={<><p>Tu registro queda como autoreporte y no cambia el resultado de la inspección oficial.</p><p>Revisa el producto y la dosis: así tendrás tu propio control de cada lote.</p><p>El técnico verá tu aplicación en el historial del lote.</p></>}>
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Lote" error={errs.lotId}><Select value={f.lotId} onChange={set('lotId')} className={errs.lotId ? 'border-danger' : ''}><option value="">Selecciona un lote</option>{lots.data?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
              <Field label="Fecha de la aplicación" error={errs.at}><Input type="date" max={todayIso()} value={f.at} onChange={set('at')} className={errs.at ? 'border-danger' : ''} /></Field>
            </div>
            <Field label="Producto aplicado" error={errs.product} hint="Elige uno de los productos registrados."><Select value={f.product} onChange={set('product')} className={errs.product ? 'border-danger' : ''}><option value="">Selecciona un producto</option>{prods.data?.map(p => <option key={p}>{p}</option>)}</Select></Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Dosis" error={errs.dose}><div className="flex gap-2"><Input type="number" min={0} step="any" value={f.dose} onChange={set('dose')} className={errs.dose ? 'border-danger' : ''} /><Select value={f.unit} onChange={set('unit')} className="w-44">{UNITS.map(u => <option key={u}>{u}</option>)}</Select></div></Field>
              <Field label="Área tratada (ha)" error={errs.area}><Input type="number" min={0} step="0.1" value={f.area} onChange={set('area')} className={errs.area ? 'border-danger' : ''} /></Field>
            </div>
            <Field label="Persona responsable" error={errs.who}><Input value={f.who} onChange={set('who')} /></Field>
            {m.error && <ErrorBox error={m.error} />}
            <div className="flex justify-center gap-3 pt-2"><Button disabled={m.isPending} onClick={go}>Guardar aplicación</Button><Button variant="secondary" onClick={() => nav('/productor/aplicaciones')}>Cancelar</Button></div>
          </div>
      </FormLayout>
    </div>
  );
}

/* ------------------------------------------------------------------ Cosecha */
export function Harvests() {
  usePageMeta('Cosecha', 'Cosecha esperada y real de tus lotes'); const q = useHarvests(); const nav = useNavigate();
  return (
    <div className="space-y-4">
      <PageActions intro="Registra cuándo esperas cosechar y cuándo cosechaste."><Button onClick={() => nav('/productor/cosecha/registrar')}>Registrar cosecha</Button></PageActions>
      <Section title="Cosecha por lote">
        <Q q={q}>{hs => <DataTable rows={hs} rowKey={h => h.lotId} noun="registros" footnote="La cosecha es autoreporte: queda en tu historial y no cambia el resultado de la inspección oficial." columns={[
          { header: 'Lote', cell: h => <b>{h.lotLabel}</b> },
          { header: 'Cosecha esperada', cell: h => h.expectedDate ? <span><b>{fDate(h.expectedDate)}</b>{h.expectedKg ? ` · ${h.expectedKg} kg` : ''}</span> : <None /> },
          { header: 'Cosecha real', cell: h => h.actualDate ? <span><b>{fDate(h.actualDate)}</b>{h.actualKg ? ` · ${h.actualKg} kg` : ''}</span> : <None /> },
          { header: 'Registro', cell: h => h.expectedDate || h.actualDate ? <Badge tone="info">Autoreporte</Badge> : <None>—</None> },
          { header: '', cell: h => <button className="text-[12px] font-semibold text-brand" onClick={() => nav(`/productor/cosecha/registrar?lote=${h.lotId}`)}>{h.expectedDate && !h.actualDate ? 'Registrar cosecha real' : 'Registrar'} ›</button> }]} />}</Q>
      </Section>
    </div>
  );
}

export function NewHarvest() {
  usePageMeta('Registrar cosecha', 'Cosecha · nuevo registro'); const lots = useLots(); const nav = useNavigate(); const qc = useQueryClient(); const toast = useToast(); const [sp] = useSearchParams();
  const [f, setF] = useState({ lotId: sp.get('lote') ?? '', expectedDate: '', expectedKg: '', actualDate: '', actualKg: '' }); const [errs, setErrs] = useState<Record<string, string>>({});
  const m = useMutation({ mutationFn: () => services.producer.saveHarvest({ lotId: f.lotId, expectedDate: f.expectedDate || undefined, expectedKg: f.expectedKg ? Number(f.expectedKg) : undefined, actualDate: f.actualDate || undefined, actualKg: f.actualKg ? Number(f.actualKg) : undefined }), onSuccess: () => { qc.invalidateQueries(); toast('Cosecha guardada.'); nav('/productor/cosecha'); } });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const go = () => {
    const e: Record<string, string> = {};
    if (!f.lotId) e.lotId = 'Selecciona el lote.'; if (!f.expectedDate && !f.actualDate) e.expectedDate = 'Registra la cosecha esperada o la real.';
    if (f.expectedDate && !f.expectedKg) e.expectedKg = 'Indica el volumen esperado.'; if (f.actualDate && !f.actualKg) e.actualKg = 'Indica el volumen real.';
    if ((f.expectedKg && Number(f.expectedKg) <= 0)) e.expectedKg = 'El volumen debe ser mayor que 0.'; if (f.actualKg && Number(f.actualKg) <= 0) e.actualKg = 'El volumen debe ser mayor que 0.';
    if (f.actualDate && f.actualDate > todayIso()) e.actualDate = 'La cosecha real no puede ser futura.'; setErrs(e); if (!Object.keys(e).length) m.mutate();
  };
  const n = Object.keys(errs).length; const bd = (k: string) => (errs[k] ? 'border-danger' : '');
  return (
    <div><BackLink to="/productor/cosecha">Volver a Cosecha</BackLink>
      <FormLayout title="Datos de la cosecha" errorCount={n} aside={<><p>Puedes registrar solo la cosecha esperada y completar la real después.</p><p>Tu registro queda como autoreporte y no cambia el resultado de la inspección oficial.</p></>}>
          <div className="space-y-3">
            <Field label="Lote" error={errs.lotId}><Select value={f.lotId} onChange={set('lotId')} className={bd('lotId')}><option value="">Selecciona un lote</option>{lots.data?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
            <div className="text-[12px] font-semibold">Cosecha esperada</div><div className="grid grid-cols-2 gap-3"><Field label="Fecha" error={errs.expectedDate}><Input type="date" value={f.expectedDate} onChange={set('expectedDate')} className={bd('expectedDate')} /></Field><Field label="Volumen (kg)" error={errs.expectedKg}><Input type="number" min={0} value={f.expectedKg} onChange={set('expectedKg')} className={bd('expectedKg')} /></Field></div>
            <div className="text-[12px] font-semibold">Cosecha real</div><div className="grid grid-cols-2 gap-3"><Field label="Fecha" error={errs.actualDate}><Input type="date" max={todayIso()} value={f.actualDate} onChange={set('actualDate')} className={bd('actualDate')} /></Field><Field label="Volumen (kg)" error={errs.actualKg}><Input type="number" min={0} value={f.actualKg} onChange={set('actualKg')} className={bd('actualKg')} /></Field></div>
            {m.error && <ErrorBox error={m.error} />}
            <div className="flex justify-center gap-3 pt-2"><Button disabled={m.isPending} onClick={go}>Guardar cosecha</Button><Button variant="secondary" onClick={() => nav('/productor/cosecha')}>Cancelar</Button></div>
          </div>
      </FormLayout>
    </div>
  );
}

/* ------------------------------------------------------------------ Historial */
type Kind = 'Todo' | 'Visitas del técnico' | 'Aplicaciones' | 'Cosecha';
export function ProducerHistory() {
  usePageMeta('Historial', 'Visitas, aplicaciones y cosecha de tus lotes'); const lots = useLots(); const q = useQuery({ queryKey: ['pHistory'], queryFn: () => services.producer.history() });
  const [lot, setLot] = useState('todos'); const [per, setPer] = useState('todo'); const [kind, setKind] = useState<Kind>('Todo');
  return (
    <Q q={q}>{hs => {
      const since = per === 'todo' ? '' : addDaysIso(todayIso(), -Number(per));
      const base = hs.filter(h => (lot === 'todos' || h.lotId === lot) && (!since || h.at.slice(0, 10) >= since));
      const cnt = (k: Kind) => k === 'Todo' ? base.length : base.filter(h => h.kind === k).length;
      return (
        <Card>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="w-56"><FilterSelect label="Lote" value={lot} onChange={setLot} options={[{ value: 'todos', label: 'Todos los lotes' }, ...(lots.data ?? []).map(l => ({ value: l.id, label: l.name }))]} /></div>
            <div className="w-56"><FilterSelect label="Período" value={per} onChange={setPer} options={[{ value: 'todo', label: 'Todo el período' }, { value: '7', label: 'Últimos 7 días' }, { value: '30', label: 'Últimos 30 días' }]} /></div>
            <div className="ml-auto"><Tabs variant="pill" value={kind} onChange={setKind} items={(['Todo', 'Visitas del técnico', 'Aplicaciones', 'Cosecha'] as Kind[]).map(x => ({ value: x, label: `${x} ${cnt(x)}` }))} /></div>
          </div>
          <DataTable rows={base.filter(h => kind === 'Todo' || h.kind === kind)} rowKey={h => h.id} noun="registros" footnote="Las visitas son inspecciones oficiales; las aplicaciones y la cosecha son autoreportes tuyos." columns={[
            { header: 'Fecha', cell: h => <b>{fNumeric(h.at)}</b> }, { header: 'Lote', cell: h => lots.data?.find(l => l.id === h.lotId)?.name ?? h.lotId }, { header: 'Actividad', cell: h => h.what },
            { header: 'Registrado por', cell: h => h.by }, { header: 'Tipo', cell: h => <Badge tone={h.origin === 'Autoreporte' ? 'info' : 'ok'}>{h.origin}</Badge> }]} />
        </Card>
      );
    }}</Q>
  );
}

/* ------------------------------------------------------------------ Planeaciones */
export function ProducerPlannings() {
  usePageMeta('Planeaciones', 'Planeaciones que envía tu agrónomo'); const q = usePlannings(); const nav = useNavigate(); const [t, setT] = useState('Todas'); const loc = useLocation(); const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => { const s = (loc.state as { flash?: string } | null)?.flash; if (s) { setFlash(s); window.history.replaceState({}, ''); } }, [loc.state]);
  return (
    <Q q={q}>{all => {
      const ps = all.filter(p => p.kind === 'productor'); const map: Record<string, string> = { Pendientes: 'Pendiente', Aceptadas: 'Aceptada', Rechazadas: 'Rechazada' };
      const n = (k: string) => k === 'Todas' ? ps.length : ps.filter(p => p.status === map[k]).length;
      return (
        <div className="space-y-3">
          {flash && <Notice tone="ok">{flash}</Notice>}
          <Card><Tabs variant="pill" value={t} onChange={setT} items={['Todas', 'Pendientes', 'Aceptadas', 'Rechazadas'].map(x => ({ value: x, label: `${x} (${n(x)})` }))} />
            <div className="mt-3"><DataTable rows={ps.filter(p => t === 'Todas' || p.status === map[t])} rowKey={p => p.id} noun="registros" onRowClick={p => nav(`/productor/planeaciones/${p.id}`)} footnote="Tu agrónomo envía las planeaciones. Revisa cada una y acéptala o recházala con un motivo." columns={[
              { header: 'Fecha propuesta', cell: p => <b>{fLong(p.date)}</b> }, { header: 'Actividad', cell: p => p.activity }, { header: 'Enviada por', cell: p => `${p.createdByName} · agrónomo` },
              { header: 'Estado', cell: p => <StateBadge s={p.status} /> }, { header: 'Acciones', cell: p => <span className="text-[12px] font-semibold text-brand">{p.status === 'Pendiente' ? 'Responder ›' : 'Ver detalle ›'}</span> }]} /></div></Card>
        </div>
      );
    }}</Q>
  );
}

export const ProducerPlanningDetail = () => <PlanningDetail backTo="/productor/planeaciones" backLabel="Volver a planeaciones" title="Planeaciones" />;

/* ------------------------------------------------------------------ Perfil */
export function Profile() {
  usePageMeta('Mi perfil', 'Datos de tu cuenta en SIGAT'); const { user } = useAuth(); const apps = useApps(); const hv = useHarvests(); const farmName = useFarmName(); const crop = useCrop();
  const nLots = crop.data?.length ?? 0;
  const nh = (hv.data ?? []).filter(h => h.expectedDate || h.actualDate).length; const na = apps.data?.length ?? 0;
  return (
    <div className="space-y-4"><BackLink to="/productor/inicio">Volver</BackLink>
      <ProfileHeader initials={user?.initials ?? ''} name={user?.name ?? ''} subtitle={user?.farmLabel ?? [user?.roleLabel ?? 'Productor', farmName, 'durazno'].filter(Boolean).join(' · ')} badges={<><Badge tone="ok">✓ Activo</Badge><Badge tone="info">Móvil y web</Badge></>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Datos de la cuenta"><DescriptionList rows={[['Nombre completo', user?.name ?? ''], ['Rol en SIGAT', 'Productor'], ['Correo electrónico', user?.email ?? ''], ['Acceso', 'Móvil y web'], ['Estado', 'Activo']]} /></Section>
        <div className="space-y-4">
          <Section title="Mi cultivo"><DescriptionList rows={[['Predio', farmName ? `${farmName} · ${nLots} lote${nLots === 1 ? '' : 's'}` : '—'], ['Vigilancia', crop.data?.[0]?.lot.status ?? '—'], ['Mis aplicaciones registradas', `${na} registro${na === 1 ? '' : 's'}`], ['Mis cosechas', `${nh} registro${nh === 1 ? '' : 's'}`]]} /></Section>
        </div>
      </div>
      <p className="text-[10px] text-ink-3">Las inspecciones oficiales son gestionadas por el técnico.</p>
    </div>
  );
}
