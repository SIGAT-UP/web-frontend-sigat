import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Info, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, CardTitle, ErrorBox, Field, Input, Modal, Notice, StateBadge, Textarea, useToast } from '@/core/ui';
import { BackLink } from '@/core/ui/PageHeader';
import { usePageMeta } from '@/app/pageMeta';
import { useReview } from '@/data/hooks';
import { services } from '@/data/services';
import { fNumeric, fNumericTime, plural } from '@/core/utils/format';
import { Q } from '@/features/shared/Query';
import type { ReviewAction } from '@/data/models/types';

export default function ReviewDetail() {
  const { id = '' } = useParams(); const q = useReview(id); const qc = useQueryClient(); const nav = useNavigate(); const toast = useToast();
  usePageMeta('Registro en revisión', `Revisiones · ${q.data?.trapCode ?? ''}`);
  const [modal, setModal] = useState<null | 'confirmar' | 'corregir' | 'rechazar'>(null);
  const [captures, setCaptures] = useState(''); const [reason, setReason] = useState(''); const [formErr, setFormErr] = useState('');
  const m = useMutation({
    mutationFn: (a: ReviewAction) => services.reviews.resolve(id, a),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['reviews'] }); qc.invalidateQueries({ queryKey: ['review', id] }); qc.invalidateQueries({ queryKey: ['lots'] }); qc.invalidateQueries({ queryKey: ['history'] }); setModal(null); setReason('');
      toast(r.state === 'Confirmado' ? 'Visita aceptada: sus lecturas quedaron confirmadas.' : r.state === 'Corregido' ? `Corrección guardada (v${r.versions.length}).` : 'Lectura rechazada.'); nav('/agronomo/revisiones'); },
  });
  const close = () => { setModal(null); setFormErr(''); m.reset(); };
  return (
    <Q q={q}>{r => {
      const open = r.state === 'Sin verificar';
      const target = captures === '' ? Math.max((r.captures ?? 1) - 1, 0) : Number(captures);
      const submitCorr = () => {
        if (captures === '' || Number.isNaN(Number(captures)) || Number(captures) < 0 || !Number.isInteger(Number(captures))) return setFormErr('Escribe un número entero de capturas (0 o más).');
        if (Number(captures) === r.captures) return setFormErr('El valor corregido debe ser distinto al original.');
        if (reason.trim().length < 10) return setFormErr('El motivo de la corrección es obligatorio (mínimo 10 caracteres).');
        setFormErr(''); m.mutate({ kind: 'corregir', captures: Number(captures), reason });
      };
      const submitRej = () => { if (reason.trim().length < 10) return setFormErr('El motivo del rechazo es obligatorio (mínimo 10 caracteres).'); setFormErr(''); m.mutate({ kind: 'rechazar', reason }); };
      return (
        <div>
          <BackLink to="/agronomo/revisiones">Volver a Revisiones</BackLink>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle right={open ? <Badge tone="info"><Info size={11} /> Requiere revisión</Badge> : <StateBadge s={r.state} />}>Registro original</CardTitle>
              <dl className="divide-y divide-line/70 text-[13px]">
                {[['Tipo', 'Lectura de trampa'], ['Trampa', r.trapCode], ['Lote', r.lotLabel], ['Capturas', r.versions[0]?.captures ?? r.captures], ['Estado de la trampa', r.trapStatus ?? '—'], ['Observación', fNumericTime(r.observedAt)], ['Recepción', r.receivedAt ? fNumericTime(r.receivedAt) : '—'], ['Usuario', r.userName ? `${r.userName} · ${r.user}` : r.user]].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between py-2.5"><dt className="text-ink-2">{k}</dt><dd className="font-semibold">{v}</dd></div>
                ))}
              </dl>
              {r.reviewReason && <div className="mt-4 rounded-[10px] border border-warn-line bg-warn-soft p-3 text-[12px]"><div className="flex items-center gap-1.5 font-semibold text-warn-text"><TriangleAlert size={13} /> Motivo de revisión</div><p className="mt-1 text-ink-2">{r.reviewReason}</p></div>}
              <div className="mt-4"><div className="mb-1 text-[11px] font-semibold text-ink-2">Versiones</div>
                <ul className="space-y-1 text-[12px]">{r.versions.map(v => <li key={v.v} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-dark" /><b>v{v.v}</b> · {v.label}{v.captures !== undefined && ` · ${plural(v.captures, 'captura', 'capturas')}`} · {fNumeric(v.at)} {v.reason && <span className="text-ink-2">— {v.reason}</span>}</li>)}</ul></div>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardTitle>Estado del registro</CardTitle>
                {open ? <Notice tone="info" title="Pendiente de validación">{r.warning ? `Llegó con una advertencia (${r.warning}) y espera la decisión del agrónomo.` : 'Espera la decisión del agrónomo.'}</Notice> : <Notice tone={r.state === 'Rechazado' ? 'danger' : 'ok'} title={r.state}>El registro ya fue resuelto. Los valores originales se conservan en el historial.</Notice>}
                {open && (
                  <div className="mt-3 rounded-[10px] border border-ok-line bg-surface-tint p-3 text-[12px]">
                    <div className="mb-2 flex items-center gap-1.5 font-semibold text-brand-strong"><Info size={13} /> Cómo quedaría el historial</div>
                    <div className="grid grid-cols-[80px_1fr_1fr] gap-y-1"><span className="text-ink-2">Capturas</span><b>{r.captures}</b><b>→ {target}</b><span className="text-ink-2">Versión</span><b>v{r.versions.length || 1}</b><b>→ v{(r.versions.length || 1) + 1}</b></div>
                    <p className="mt-2 text-[11px] text-ink-2">El registro original ({plural(r.captures ?? 0, 'captura', 'capturas')}) se conserva en el historial.</p>
                  </div>
                )}
              </Card>
              <Card>
                <CardTitle>Acciones de validación</CardTitle>
                <p className="mb-3 text-[12px] text-ink-2">Aceptar revisa la <b>visita completa</b>: todas sus lecturas sin verificar quedan confirmadas. Corregir o rechazar afecta solo <b>esta lectura</b> y crea una versión nueva; la original se conserva. Cada acción queda en tu historial a tu nombre.</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button disabled={!open} variant="secondary" onClick={() => setModal('confirmar')}>Aceptar visita</Button>
                  <Button disabled={!open} variant="soft" onClick={() => { setCaptures(''); setModal('corregir'); }}>Corregir lectura</Button>
                  <Button disabled={!open} variant="dangerSoft" onClick={() => setModal('rechazar')}>Rechazar lectura</Button>
                </div>
              </Card>
            </div>
          </div>

          <Modal open={modal === 'confirmar'} onClose={close} icon={<Check size={20} />} title="¿Aceptar la visita?" subtitle={`Se acepta la visita del ${fNumeric(r.observedAt)} en ${r.lotLabel}. Todas sus lecturas sin verificar (incluida ${r.trapCode}) pasan a Confirmado y siguen contando para el MTD. Si alguna está mal, corrígela o recházala antes.`}>
            {m.error && <ErrorBox error={m.error} />}
            <div className="space-y-2"><Button block disabled={m.isPending} onClick={() => m.mutate({ kind: 'confirmar' })}>Aceptar visita</Button><Button block variant="secondary" onClick={close}>Cancelar</Button></div>
          </Modal>
          <Modal open={modal === 'corregir'} onClose={close} icon={<Check size={20} />} title="Corregir la lectura" subtitle={`Se crea la versión v${(r.versions.length || 1) + 1} con los valores corregidos. La versión actual (${plural(r.captures ?? 0, 'captura', 'capturas')}) se conserva en el historial.`}>
            <div className="space-y-3">
              <Field label="Capturas corregidas"><Input type="number" min={0} value={captures} onChange={e => setCaptures(e.target.value)} placeholder={String(target)} autoFocus /></Field>
              <Field label="Motivo de la corrección (obligatorio)"><Textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej.: un espécimen se contó dos veces" /></Field>
              {(formErr || m.error) && <ErrorBox error={formErr ? new Error(formErr) : m.error} />}
              <Button block disabled={m.isPending} onClick={submitCorr}>Guardar corrección (v{(r.versions.length || 1) + 1})</Button><Button block variant="secondary" onClick={close}>Cancelar</Button>
            </div>
          </Modal>
          <Modal open={modal === 'rechazar'} onClose={close} icon={<TriangleAlert size={20} />} title="Rechazar la lectura" subtitle="Se crea una versión anulada: la lectura deja de contar para el MTD. El original se conserva en el historial.">
            <div className="space-y-3">
              <Field label="Motivo del rechazo (obligatorio)"><Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explica por qué se rechaza" autoFocus /></Field>
              {(formErr || m.error) && <ErrorBox error={formErr ? new Error(formErr) : m.error} />}
              <Button block variant="danger" disabled={m.isPending} onClick={submitRej}>Rechazar lectura</Button><Button block variant="secondary" onClick={close}>Cancelar</Button>
            </div>
          </Modal>
        </div>
      );
    }}</Q>
  );
}
