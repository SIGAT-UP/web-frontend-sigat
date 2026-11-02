import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button, Card, DataTable, ErrorBox, Field, Input, Modal, Select, StateBadge, Tabs, useToast } from '@/core/ui';
import { services } from '@/data/services';
import { usePageMeta } from '@/app/pageMeta';
import { useLot, useTraps } from '@/data/hooks';
import { WithActiveLot } from '@/app/activeLot';
import { fNumericTime, plural } from '@/core/utils/format';
import { Q } from '@/features/shared/Query';
import type { Trap, TrapInput } from '@/data/models/types';
import { errorCodigoTrampa, tipoPorNumero } from '@/core/utils/validaciones';

export default function Traps() {
  return <WithActiveLot>{id => <TrapsView lotId={id} />}</WithActiveLot>;
}

function TrapsView({ lotId }: { lotId: string }) {
  const lot = useLot(lotId); const traps = useTraps(lotId); const toast = useToast(); const qc = useQueryClient();
  const [view, setView] = useState<'lista' | 'mapa'>('lista'); const [q, setQ] = useState(''); const [detail, setDetail] = useState<Trap | null>(null); const [form, setForm] = useState<{ edit?: Trap } | null>(null);
  usePageMeta('Trampas', `Trampas del ${lot.data?.name ?? ''}`);
  return (
    <Q q={traps}>{ts => {
      const rows = ts.filter(t => t.code.toLowerCase().includes(q.toLowerCase()));
      return (
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative w-64"><Search size={14} className="absolute left-3 top-3 text-ink-3" /><Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar" className="pl-9" aria-label="Buscar trampa" /></div>
            <Tabs variant="pill" value={view} onChange={setView} items={[{ value: 'lista', label: 'Lista' }, { value: 'mapa', label: 'Mapa' }]} />
            <Button className="ml-auto" onClick={() => setForm({})}>Agregar trampa</Button>
          </div>
          {view === 'lista' ? (
            <DataTable rows={rows} rowKey={t => t.code} noun="registros" footnote={`${plural(ts.length, 'trampa', 'trampas')} · todas pertenecen al ${lot.data?.name}`}
              columns={[
                { header: 'Código ICA', cell: t => <b>{t.code}</b> }, { header: 'Estado', cell: t => <StateBadge s={t.status} /> },
                { header: 'Última lectura', cell: t => plural(t.lastReadingCaptures, 'captura', 'capturas') }, { header: 'Fecha de observación', cell: t => fNumericTime(t.observedAt).replace(/(\d{4}) /, '$1 · ') },
                { header: 'Configuración', cell: t => <StateBadge s={t.config} /> },
                { header: 'Acciones', cell: t => <span className="flex gap-3 text-[12px] font-semibold text-brand"><button onClick={() => setDetail(t)}>Ver</button><button onClick={() => setForm({ edit: t })}>Editar</button></span> },
              ]} />
          ) : (
            <div className="relative aspect-[16/7] rounded-xl border border-line bg-surface-raised">
              {rows.map(t => <span key={t.code} style={{ left: `${t.x}%`, top: `${t.y}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-dark px-2 py-1 text-[10px] font-semibold text-white">{t.code}</span>)}
            </div>
          )}
          <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.code} subtitle="Datos de la trampa">
            {detail && <dl className="space-y-2 text-[13px]">{[['Estado', detail.status], ['Última lectura', plural(detail.lastReadingCaptures, 'captura', 'capturas')], ['Observada', fNumericTime(detail.observedAt)], ['Configuración', detail.config], ['Atrayente', detail.attractant ?? 'Sin definir'], ['Tipo', detail.type ?? '—']].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-ink-2">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>}
          </Modal>
          {form && <TrapForm lotId={lotId} edit={form.edit} onClose={() => setForm(null)} onDone={msg => { setForm(null); qc.invalidateQueries(); toast(msg); }} />}
        </Card>
      );
    }}</Q>
  );
}

function TrapForm({ lotId, edit, onClose, onDone }: { lotId: string; edit?: Trap; onClose: () => void; onDone: (m: string) => void }) {
  const attr = useQuery({ queryKey: ['catalogItems', 'atrayentes'], queryFn: () => services.program.catalogItems('atrayentes') });
  const [f, setF] = useState<TrapInput>({ code: edit?.code ?? '', type: edit?.type ?? 'Jackson', lotId, status: edit?.status ?? 'Activa', attractant: edit?.attractant ?? '', config: edit?.config ?? 'Correcta' }); const [err, setErr] = useState('');
  const avisoCodigo = !edit && f.code.trim().length >= 9 ? errorCodigoTrampa(f.code, f.type) : null;
  const m = useMutation({
    mutationFn: () => edit ? services.lots.updateTrap(edit.code, { status: f.status, attractant: f.attractant, config: f.config }) : services.lots.createTrap(f),
    onSuccess: () => onDone(edit ? 'Trampa actualizada.' : 'Trampa creada.'),
  });
  return (
    <Modal open onClose={onClose} title={edit ? `Editar ${edit.code}` : 'Agregar trampa'} subtitle="Registro de trampas">
      <div className="space-y-3">
        <Field label="Código ICA" hint="Divipola (5 dígitos) - ruta - número, como está impreso en la trampa" error={avisoCodigo ?? undefined}>
          <Input value={f.code} disabled={!!edit} placeholder="54518-602-017" onChange={e => { const code = e.target.value; setErr(''); setF({ ...f, code, type: /[0-9]$/.test(code) ? tipoPorNumero(code) : f.type }); }} />
        </Field>
        <Field label="Tipo de trampa" hint="RN-005: Jackson lleva número impar y McPhail número par.">
          <Select value={f.type} disabled={!!edit} onChange={e => { setErr(''); setF({ ...f, type: e.target.value as TrapInput['type'] }); }}><option>Jackson</option><option>McPhail</option></Select>
        </Field>
        <Field label="Estado"><Select value={f.status} onChange={e => setF({ ...f, status: e.target.value as TrapInput['status'] })}><option>Activa</option><option>Inactiva</option><option>En mantenimiento</option></Select></Field>
        <Field label="Atrayente"><Select value={f.attractant} onChange={e => setF({ ...f, attractant: e.target.value })}>{!f.attractant && <option value="">Selecciona un atrayente</option>}{[...new Set([...(attr.data ?? []), ...(f.attractant ? [f.attractant] : [])])].map(a => <option key={a}>{a}</option>)}</Select></Field>
        <Field label="Configuración"><Select value={f.config} onChange={e => setF({ ...f, config: e.target.value as TrapInput['config'] })}><option>Correcta</option><option>Revisar</option></Select></Field>
        {(err || m.error) && <ErrorBox error={err ? new Error(err) : m.error} />}
        <Button block disabled={m.isPending} onClick={() => {
          if (!edit) { const e = errorCodigoTrampa(f.code, f.type); if (e) return setErr(e); }
          if (!f.attractant) return setErr('Selecciona el atrayente.');
          setErr(''); m.mutate();
        }}>{edit ? 'Guardar cambios' : 'Crear trampa'}</Button>
        <Button block variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </Modal>
  );
}
