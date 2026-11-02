import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Badge, Button, Card, CardTitle, ErrorBox, Field, Input, Modal, Select, useToast } from '@/core/ui';
import { usePageMeta } from '@/app/pageMeta';
import { services } from '@/data/services';
import { addDaysIso, fDate, todayIso } from '@/core/utils/format';
import { Q } from '@/features/shared/Query';
import type { InspectionProgram } from '@/data/models/types';

export default function Program() {
  usePageMeta('Programa de inspección', 'Parámetros versionados por predio · RF-080');
  const q = useQuery({ queryKey: ['program'], queryFn: () => services.program.get() }); const qc = useQueryClient(); const toast = useToast();
  const [form, setForm] = useState<InspectionProgram | null>(null); const [modal, setModal] = useState(false); const [since, setSince] = useState(() => addDaysIso(todayIso(), 1)); const [err, setErr] = useState('');
  useEffect(() => { if (q.data) setForm(q.data); }, [q.data]);
  const save = useMutation({ mutationFn: () => services.program.saveNewVersion(form!, fDate(since)), onSuccess: () => { qc.invalidateQueries({ queryKey: ['program'] }); qc.invalidateQueries({ queryKey: ['audit'] }); setModal(false); toast('Programa guardado como nueva versión.'); } });
  return (
    <Q q={q}>{prog => form && (
      <div className="space-y-4">
        <div className="flex items-end gap-3"><div className="w-64"><Field label="Predio"><Input value={form.farm} readOnly /></Field></div><Badge tone="ok" className="mb-2">Versión vigente v{prog.version} · desde {prog.since}</Badge></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardTitle>Lectura y registro</CardTitle>
            <div className="space-y-3">
              <Field label="Período de lectura de trampas" hint="Manual ICA: 7 + 14 días (RF-002)"><Select value={form.readingPeriodDays} onChange={e => setForm({ ...form, readingPeriodDays: Number(e.target.value) })}>{[7, 14].map(d => <option key={d} value={d}>{d} días</option>)}</Select></Field>
              <Field label="Ciclo de inspección"><Input value={form.inspectionCycle} placeholder="Sin definir" onChange={e => setForm({ ...form, inspectionCycle: e.target.value })} /></Field>
              <Field label="Verificación al registrar"><Select value={form.verification} onChange={e => setForm({ ...form, verification: e.target.value })}><option>Advertencia, no bloquea</option><option>Bloquea el registro</option></Select></Field>
              <Field label="Retícula (resolución)" hint="Por definir · más de 60 m"><Input value={form.resolution} placeholder="Por definir · más de 60 m" onChange={e => setForm({ ...form, resolution: e.target.value })} /></Field>
              <Field label="Proveedor de imagen"><Input value={form.imageProvider} placeholder="Sin definir" onChange={e => setForm({ ...form, imageProvider: e.target.value })} /></Field>
            </div></Card>
          <Card><CardTitle>Umbral y escenarios de trampeo</CardTitle>
            <p className="-mt-2 mb-2 text-[10px] text-ink-2">MTD = moscas ÷ (trampas atendidas × días de exposición) · RN-001</p>
            <table className="w-full text-[12px]"><thead><tr className="text-left text-[10px] text-ink-2"><th className="py-1">Escenario</th><th>MTD desde</th><th>MTD hasta</th></tr></thead><tbody>
              {form.scenarios.map((s, i) => <tr key={s.name} className="border-t border-line/70"><td className="py-2 font-medium">{s.name}</td>
                <td><Input className="h-8 w-20" value={s.from} onChange={e => setForm({ ...form, scenarios: form.scenarios.map((x, j) => j === i ? { ...x, from: e.target.value } : x) })} aria-label={`${s.name} MTD desde`} /></td>
                <td><Input className="h-8 w-20" value={s.to} onChange={e => setForm({ ...form, scenarios: form.scenarios.map((x, j) => j === i ? { ...x, to: e.target.value } : x) })} aria-label={`${s.name} MTD hasta`} /></td></tr>)}
            </tbody></table>
            <p className="mt-2 text-[10px] text-ink-3">Manual ICA 2020, Tabla 1 (RN-003) · configurable por predio</p>
            <div className="mt-3 rounded-[10px] border border-warn-line bg-warn-soft p-3"><Field label="Umbral de exportación"><Input value={form.exportThreshold} placeholder="Sin definir" onChange={e => setForm({ ...form, exportThreshold: e.target.value })} /></Field>
              <p className="mt-1 text-[10px] text-warn-text">Sin valor por defecto · UQQ-004 · Resolución 6401 de 2016. Mientras no se defina, no se emite concepto de aptitud.</p></div></Card>
        </div>
        <Card className="flex items-center justify-between"><div><div className="text-[13px] font-semibold">Checklist de buenas prácticas</div><p className="text-[11px] text-ink-2">Trampas y atrayentes, plagas y enfermedades, productos fitosanitarios y cosecha. Catálogo RF-005.</p></div><Link to="/agronomo/catalogos" className="text-[12px] font-semibold text-brand">Ir a Catálogos ›</Link></Card>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] text-ink-3">Guardar crea la versión v{prog.version + 1} con fecha de vigencia. Los períodos ya calculados conservan la versión con la que se interpretaron (RN-003, ADR-050).<br />Historial: {prog.history.split('\n')[0]}</p>
          <div className="flex gap-2"><Button onClick={() => setModal(true)}>Guardar como versión v{prog.version + 1}</Button><Button variant="secondary" onClick={() => setForm(prog)}>Descartar</Button></div>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} icon={<Check size={20} />} title={`¿Guardar como versión v${prog.version + 1}?`} subtitle={`Programa de inspección · ${prog.farm}`}>
          <Field label="Vigente desde"><Input type="date" value={since} min={todayIso()} onChange={e => setSince(e.target.value)} /></Field>
          <p className="mt-2 text-[11px] text-ink-2">Los períodos ya calculados conservan la versión v{prog.version} (RN-003, ADR-050).</p>
          {(err || save.error) && <div className="mt-3"><ErrorBox error={err ? new Error(err) : save.error} /></div>}
          <div className="mt-4 space-y-2"><Button block disabled={save.isPending} onClick={() => since ? save.mutate() : setErr('Indica desde cuándo rige.')}>Guardar versión v{prog.version + 1}</Button><Button block variant="secondary" onClick={() => setModal(false)}>Cancelar</Button></div>
        </Modal>
      </div>
    )}</Q>
  );
}
