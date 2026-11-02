import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Search, FileText } from 'lucide-react';
import clsx from 'clsx';
import { Button, Card, CardTitle, ErrorBox, Field, Input, Textarea, useAlerts } from '@/core/ui';
import { BackLink } from '@/core/ui/PageHeader';
import { usePageMeta } from '@/app/pageMeta';
import { useLots } from '@/data/hooks';
import { services } from '@/data/services';
import { addDaysIso, fDate, todayIso } from '@/core/utils/format';
import { Q } from '@/features/shared/Query';
import type { NewPlanningInput, Recipient } from '@/data/models/types';

const useRecipients = (kind: 'productor' | 'tecnico') => useQuery({ queryKey: ['recipients', kind], queryFn: () => services.planning.recipients(kind) });

function Recipients({ kind, value, onChange, label }: { kind: 'productor' | 'tecnico'; value: string; onChange: (v: string) => void; label: string }) {
  const q = useRecipients(kind); const [s, setS] = useState('');
  return (
    <Field label={label} required>
      {kind === 'tecnico' && <div className="relative mb-2"><Search size={14} className="absolute left-3 top-3 text-ink-3" /><Input className="pl-9" placeholder="Buscar técnico…" value={s} onChange={e => setS(e.target.value)} /></div>}
      {q.isLoading && <p className="text-[12px] text-ink-2">Cargando…</p>}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && !q.data.length && <p className="text-[12px] text-ink-2">No hay {kind === 'productor' ? 'productores' : 'técnicos'} disponibles.</p>}
      <div className="space-y-2">{q.data?.filter((r: Recipient) => r.name.toLowerCase().includes(s.toLowerCase())).map((r: Recipient) => (
        <button type="button" key={r.id} onClick={() => onChange(r.id)} aria-pressed={value === r.id} className={clsx('flex w-full items-center gap-3 rounded-[10px] border p-3 text-left', value === r.id ? 'border-brand bg-surface-tint' : 'border-line bg-white')}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark text-[11px] font-bold text-white">{r.name.split(' ').map(w => w[0]).join('')}</span>
          <span className="flex-1 leading-tight"><span className="block text-[13px] font-semibold">{r.name}</span><span className="text-[10px] text-ink-2">{r.subtitle}</span></span>
          {value === r.id && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white"><Check size={12} /></span>}
        </button>))}</div>
    </Field>
  );
}

function useCreate(onDone: () => void) {
  const qc = useQueryClient(); const alerts = useAlerts();
  return useMutation({ mutationFn: (i: NewPlanningInput) => services.planning.create(i), onSuccess: (p, i) => {
    qc.invalidateQueries({ queryKey: ['plannings'] });
    if (i.documentName) alerts.success('Documento enviado', `«${i.documentName}» se envió a ${p.recipientName} junto con la planeación.`);
    else alerts.success(i.kind === 'tecnico' ? 'Planeación asignada' : 'Planeación enviada', `Se notificó a ${p.recipientName}.`);
    onDone(); } });
}

/** Nueva planeación para el productor (documento obligatorio; si no hay, observación de mínimo 10 caracteres). */
export function NewPlanning() {
  const nav = useNavigate(); usePageMeta('Nueva planeación', 'Planeación'); const create = useCreate(() => nav('/agronomo/planeacion'));
  const [rec, setRec] = useState(''); const [date, setDate] = useState(todayIso()); const [obs, setObs] = useState(''); const [docFile, setDocFile] = useState<File | null>(null); const [err, setErr] = useState('');
  const file = useRef<HTMLInputElement>(null); const recipients = useRecipients('productor');
  const doc = docFile?.name ?? null; const recName = recipients.data?.find(r => r.id === rec)?.name;
  const save = () => {
    if (!rec) return setErr('Selecciona al productor.'); if (!date) return setErr('La fecha de asignación es obligatoria.');
    if (!doc && obs.trim().length < 10) return setErr('Sube el documento de instrucciones o escribe una observación de mínimo 10 caracteres.');
    setErr(''); create.mutate({ kind: 'productor', recipientId: rec, date, lotIds: [], documentName: doc ?? undefined, document: docFile ?? undefined, observations: obs.trim() || undefined, activity: 'Planeación para productor' });
  };
  return (
    <div>
      <BackLink to="/agronomo/planeacion">Volver a Planeación</BackLink>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardTitle>Datos de la planeación</CardTitle><p className="-mt-2 mb-4 text-[11px] text-ink-2">Los campos marcados con * son obligatorios.</p>
          <div className="space-y-4">
            <Recipients kind="productor" label="Productor" value={rec} onChange={setRec} />
            <Field label="Fecha de asignación" required><Input type="date" value={date} min={todayIso()} onChange={e => setDate(e.target.value)} className="w-52" /></Field>
            <Field label="Documento de instrucciones" required>
              <div className="flex items-center gap-3 rounded-[10px] border border-line p-3"><FileText className="text-info" size={22} /><span className="flex-1 text-[13px]">{doc ?? 'Ningún archivo seleccionado'}</span>
                <Button variant="secondary" type="button" onClick={() => file.current?.click()}>{doc ? 'Cambiar archivo' : 'Subir archivo'}</Button>
                <input ref={file} type="file" accept=".pdf,.doc,.docx" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { if (f.size > 10 * 1024 * 1024) { setErr('El documento no puede superar 10 MB.'); return; } setErr(''); setDocFile(f); } }} /></div>
            </Field>
            <Field label="Observaciones (opcional)" hint={!doc ? 'Sin documento, la observación es obligatoria (mínimo 10 caracteres).' : undefined}><Textarea rows={3} value={obs} onChange={e => setObs(e.target.value)} placeholder="Escribe aquí" /></Field>
          </div>
        </Card>
        <div className="space-y-3">
          <Card><CardTitle>Resumen de la planeación</CardTitle>
            <dl className="space-y-3 text-[12px]">{[['Productor', recName ?? '—'], ['Fecha de asignación', date ? fDate(date) : '—'], ['Documento de instrucciones', doc ?? 'Sin documento'], ['Observaciones', obs || 'Sin observaciones']].map(([k, v]) => <div key={k}><dt className="text-[10px] text-ink-2">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
            <p className="mt-3 text-[10px] text-ink-3">La planeación se envía al productor, que puede aceptarla o rechazarla.</p></Card>
          {(err || create.error) && <ErrorBox error={err ? new Error(err) : create.error} />}
          <Button block disabled={create.isPending} onClick={save}>Guardar planeación</Button><Button block variant="secondary" onClick={() => nav('/agronomo/planeacion')}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}

/** Asignar planeación: lotes a un técnico durante un período. */
export function AssignPlanning() {
  const nav = useNavigate(); usePageMeta('Asignar planeación', 'Planeación'); const lots = useLots(); const create = useCreate(() => nav('/agronomo/planeacion'));
  const [rec, setRec] = useState(''); const [from, setFrom] = useState(todayIso()); const [to, setTo] = useState(addDaysIso(todayIso(), 7)); const recipients = useRecipients('tecnico'); const [sel, setSel] = useState<string[]>([]); const [obs, setObs] = useState(''); const [err, setErr] = useState('');
  const days = from && to ? Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) : 0;
  const save = () => {
    if (!rec) return setErr('Selecciona al técnico.'); if (!from) return setErr('La fecha de inicio es obligatoria.');
    if (to && to < from) return setErr('La fecha final no puede ser anterior a la de inicio.'); if (!sel.length) return setErr('Selecciona al menos un lote.');
    setErr(''); create.mutate({ kind: 'tecnico', recipientId: rec, date: from, dateEnd: to || undefined, lotIds: sel, observations: obs || undefined });
  };
  const fmt = (d: string) => { const [y, m, dd] = d.split('-'); return `${dd} / ${m} / ${y}`; };
  return (
    <div>
      <BackLink to="/agronomo/planeacion">Volver a Planeación</BackLink>
      <Q q={lots}>{ls => (
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardTitle>Datos de la asignación</CardTitle><p className="-mt-2 mb-4 text-[11px] text-ink-2">Los campos marcados con * son obligatorios.</p>
            <div className="space-y-4">
              <Recipients kind="tecnico" label="Técnico" value={rec} onChange={setRec} />
              <div><div className="mb-1 text-[12px] font-semibold">Período</div><div className="grid max-w-md grid-cols-2 gap-3"><Field label="Fecha de inicio" required><Input type="date" value={from} min={todayIso()} onChange={e => setFrom(e.target.value)} /></Field><Field label="Fecha de finalización (opcional)"><Input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} /></Field></div></div>
              <Field label="Lotes" required>
                <div className="mb-1 text-right text-[10px] text-ink-3">{sel.length ? `${sel.length} seleccionado${sel.length > 1 ? 's' : ''}` : 'Ninguno seleccionado'}</div>
                <div className="grid grid-cols-2 gap-2">{ls.map(l => { const on = sel.includes(l.id); return (
                  <button type="button" key={l.id} aria-pressed={on} onClick={() => setSel(on ? sel.filter(x => x !== l.id) : [...sel, l.id])} className={clsx('flex items-center justify-between rounded-[10px] border px-3 py-2.5 text-[13px] font-medium', on ? 'border-brand bg-surface-tint' : 'border-line bg-white')}>{l.name}<span className={clsx('flex h-5 w-5 items-center justify-center rounded-full', on ? 'bg-brand text-white' : 'bg-surface-raised')}>{on && <Check size={12} />}</span></button>); })}</div>
              </Field>
              <Field label="Observaciones (opcional)"><Textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Escribe aquí" /></Field>
            </div>
          </Card>
          <div className="space-y-3">
            <Card><CardTitle>Resumen de la asignación</CardTitle>
              <dl className="space-y-3 text-[12px]">
                <div><dt className="text-[10px] text-ink-2">Técnico</dt><dd className="font-semibold">{recipients.data?.find(r => r.id === rec)?.name ?? '—'}</dd></div>
                <div><dt className="text-[10px] text-ink-2">Período</dt><dd className="font-semibold">{from && to ? `${fmt(from).replace(/ /g, '')} – ${fmt(to).replace(/ /g, '')} · ${days + 1} días` : from ? `Desde ${fmt(from)}` : '—'}</dd></div>
                <div><dt className="text-[10px] text-ink-2">Lotes</dt><dd className={clsx('font-semibold', !sel.length && 'text-warn-text')}>{sel.length ? ls.filter(l => sel.includes(l.id)).map(l => l.name).join(', ') : 'Sin seleccionar'}</dd></div>
                <div><dt className="text-[10px] text-ink-2">Observaciones</dt><dd className="font-semibold">{obs || 'Sin observaciones'}</dd></div>
              </dl><p className="mt-3 text-[10px] text-ink-3">Revisa los datos antes de asignar la planeación.</p></Card>
            {(err || create.error) && <ErrorBox error={err ? new Error(err) : create.error} />}
            <Button block disabled={create.isPending} onClick={save}>Asignar planeación</Button><Button block variant="secondary" onClick={() => nav('/agronomo/planeacion')}>Cancelar</Button>
          </div>
        </div>
      )}</Q>
    </div>
  );
}
