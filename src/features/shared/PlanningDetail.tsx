import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, Download, FileText, UserRound, XCircle } from 'lucide-react';
import { Button, ErrorBox, Field, Modal, StateBadge, Textarea, useAlerts, Notice } from '@/core/ui';
import { BackLink } from '@/core/ui/PageHeader';
import { usePageMeta } from '@/app/pageMeta';
import { usePlanning, useLots } from '@/data/hooks';
import { services } from '@/data/services';
import { useAuth } from '@/app/auth';
import { fLong, fNumericTime } from '@/core/utils/format';
import { Q } from './Query';

/** Detalle de planeación. Lo comparten agrónomo (creador) y productor (destinatario). */
export default function PlanningDetail({ backTo, backLabel, title }: { backTo: string; backLabel: string; title: string }) {
  const { id = '' } = useParams(); const q = usePlanning(id); const lots = useLots(); const { user } = useAuth(); const nav = useNavigate(); const qc = useQueryClient(); const alerts = useAlerts();
  usePageMeta(title, backLabel.replace('Volver a ', ''));
  const [modal, setModal] = useState<null | 'rechazar'>(null); const [reason, setReason] = useState(''); const [err, setErr] = useState('');
  const respond = useMutation({
    mutationFn: (v: { d: 'Aceptada' | 'Rechazada'; r?: string }) => services.planning.respond(id, v.d, v.r),
    onSuccess: (p) => { qc.invalidateQueries({ queryKey: ['plannings'] }); qc.invalidateQueries({ queryKey: ['planning', id] }); setModal(null); if (p.status === 'Aceptada') alerts.success('Planeación aceptada', 'El agrónomo fue notificado.'); else alerts.warn('Planeación rechazada', 'El agrónomo verá tu motivo y podrá reprogramar.');
      if (user?.role === 'PRODUCTOR') nav(backTo, { state: { flash: p.status === 'Aceptada' ? `Aceptaste la planeación «${p.activity}».` : `Evaluaste el rechazo de «${p.activity}». Tu agrónomo puede ver el motivo y reprogramar.` } }); },
  });
  return (
    <Q q={q}>{p => {
      const isAgro = user?.role === 'AGRONOMO'; const canRespond = p.status === 'Pendiente' && p.recipientId === user?.id;
      const who = isAgro ? ['Productor', p.recipientName] : ['Agrónomo', p.createdByName];
      return (
        <div className="mx-auto max-w-[620px]">
          <BackLink to={backTo}>{backLabel}</BackLink>
          {p.status === 'Rechazada' && (
            <div className="mb-5 flex items-center gap-3 rounded-[14px] border border-danger-line bg-danger-soft p-4"><XCircle className="text-danger" size={26} />
              <div><div className="text-[14px] font-bold text-danger">Planeación rechazada</div><div className="text-[11px] text-ink-2">{isAgro ? 'El productor rechazó esta planeación' : `Rechazaste «${p.activity}». Tu agrónomo puede ver el motivo.`}</div></div></div>
          )}
          {p.status === 'Aceptada' && <div className="mb-5"><Notice tone="ok" title="Planeación aceptada">Quedó confirmada para el {fLong(p.date)}.</Notice></div>}
          {p.status === 'Pendiente' && <div className="mb-5"><Notice tone="warn" title="Pendiente de respuesta">{canRespond ? 'Acepta o rechaza esta planeación.' : 'Esperando la respuesta del destinatario.'}</Notice></div>}
          {p.rejectionReason && (<><h3 className="mb-1.5 text-[13px] font-bold">Motivo del rechazo</h3>
            <div className="mb-5 rounded-[10px] border border-danger-line bg-danger-soft p-3 text-[12px] italic">“{p.rejectionReason}”<div className="mt-1 text-[10px] not-italic text-ink-3">{p.respondedAt && fNumericTime(p.respondedAt)}</div></div></>)}
          <h3 className="mb-2 text-[13px] font-bold">Información de la planeación</h3>
          <dl className="mb-5 space-y-3 text-[12px]">
            <div className="flex items-center justify-between"><dt className="flex items-center gap-2 font-semibold"><CalendarDays size={15} className="text-brand" /> Fecha propuesta</dt><dd className="text-ink-2">{fLong(p.date)}</dd></div>
            {p.schedule && <div className="flex items-center justify-between"><dt className="flex items-center gap-2 font-semibold"><Clock size={15} /> Horario</dt><dd className="text-ink-2">{p.schedule}</dd></div>}
            <div className="flex items-center justify-between"><dt className="flex items-center gap-2 font-semibold"><UserRound size={15} /> {who[0]}</dt><dd className="text-ink-2">{who[1]}</dd></div>
            {p.lotIds.length > 0 && <div className="flex items-center justify-between"><dt className="font-semibold">Lotes</dt><dd className="text-ink-2">{p.lotIds.map(i => lots.data?.find(l => l.id === i)?.name).filter(Boolean).join(', ')}</dd></div>}
            <div className="flex items-center justify-between"><dt className="font-semibold">Estado</dt><dd><StateBadge s={p.status} /></dd></div>
          </dl>
          <h3 className="mb-2 text-[13px] font-bold">Documento de instrucciones</h3>
          {p.document ? (
            <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-line bg-white p-3"><FileText className="text-info" size={26} /><div className="flex-1 text-[12px]"><div className="font-semibold text-ink-2">{p.document.name}</div><div className="text-[10px] text-ink-3">{p.document.size}</div></div>
              <button aria-label="Descargar documento" onClick={() => alerts.info('Descarga no disponible', 'Se habilita al conectar el backend.')}><Download size={18} className="text-ink-2" /></button></div>
          ) : <p className="mb-5 text-[12px] text-ink-2">Sin documento adjunto.</p>}
          <h3 className="mb-2 text-[13px] font-bold">Observaciones</h3>
          <div className="mb-6 rounded-[10px] border border-line bg-white px-3 py-2.5 text-[12px] text-ink-2">{p.observations || 'Sin observaciones'}</div>
          <div className="mx-auto flex max-w-[300px] flex-col gap-2">
            {canRespond && (<><Button onClick={() => respond.mutate({ d: 'Aceptada' })} disabled={respond.isPending}>Aceptar planeación</Button><Button variant="dangerSoft" onClick={() => { setReason(''); setErr(''); setModal('rechazar'); }}>Rechazar planeación</Button></>)}
            {isAgro && p.status === 'Rechazada' && <Button onClick={() => nav('/agronomo/planeacion/nueva')}>Nueva planeación</Button>}
            <Button variant="secondary" onClick={() => nav(backTo)}>{isAgro ? 'Volver a Planeación' : 'Volver a mis planeaciones'}</Button>
          </div>
          <Modal open={modal === 'rechazar'} onClose={() => setModal(null)} icon={<XCircle size={20} />} title="Rechazar la planeación" subtitle="El agrónomo verá tu motivo y podrá preparar una nueva.">
            <Field label="Motivo del rechazo (mínimo 10 caracteres)"><Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} autoFocus /></Field>
            {(err || respond.error) && <div className="mt-3"><ErrorBox error={err ? new Error(err) : respond.error} /></div>}
            <div className="mt-4 space-y-2"><Button block variant="danger" disabled={respond.isPending} onClick={() => reason.trim().length < 10 ? setErr('El motivo debe tener al menos 10 caracteres.') : respond.mutate({ d: 'Rechazada', r: reason })}>Rechazar planeación</Button><Button block variant="secondary" onClick={() => setModal(null)}>Cancelar</Button></div>
          </Modal>
        </div>
      );
    }}</Q>
  );
}
