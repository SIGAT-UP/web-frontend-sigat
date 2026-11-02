import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardTitle, Badge, ErrorBox, Field, Input, Modal, Select, useToast } from '@/core/ui';
import { services } from '@/data/services';
import type { Lot } from '@/data/models/types';
import { usePageMeta } from '@/app/pageMeta';
import { useControl, useLot, useTraps } from '@/data/hooks';
import { WithActiveLot } from '@/app/activeLot';
import { fDateTime, fMtd } from '@/core/utils/format';
import { Q } from '@/features/shared/Query';
import { MapPin } from 'lucide-react';

export default function LotInfo() {
  return <WithActiveLot>{id => <LotInfoView lotId={id} />}</WithActiveLot>;
}

function LotInfoView({ lotId }: { lotId: string }) {
  const lot = useLot(lotId); const ctl = useControl(lotId); const traps = useTraps(lotId); const nav = useNavigate(); const toast = useToast(); const qc = useQueryClient(); const [edit, setEdit] = useState(false);
  usePageMeta('Lote', `Información del ${lot.data?.name ?? 'lote'}`);
  return (
    <Q q={lot}>{l => (
      <Q q={ctl}>{c => (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardTitle right={<Button variant="secondary" onClick={() => setEdit(true)}>Editar información</Button>}>Información del lote</CardTitle>
            <dl className="divide-y divide-line/70 text-[13px]">
              {[['Propietario', l.owner], ['Cultivo', l.crop], ['Área', `${String(l.areaHa).replace('.', ',')} ha`], ['Estado', <Badge tone="ok" key="e">✓ {l.status}</Badge>], ['Número de trampas', `${l.trapsTotal} trampas`], ['Última visita', fDateTime(l.lastVisit)], ['Última sincronización', fDateTime(l.lastSync)]].map(([k, v]) => (
                <div key={String(k)} className="flex items-center justify-between py-3"><dt className="text-ink-2">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))}
            </dl>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardTitle>Control vigente</CardTitle>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[11px] text-ink-2">MTD (período cerrado)</div><div className="text-[28px] font-bold text-brand-dark">{fMtd(c.mtd)}</div><div className="text-[10px] text-ink-2">moscas/trampa/día</div></div>
                <div><div className="text-[11px] text-ink-2">Umbral exportación</div><div className="text-[22px] font-bold text-brand-dark">{c.exportThreshold ?? 'Sin definir'}</div></div>
              </div>
              <dl className="mt-3 space-y-2 border-t border-line pt-3 text-[12px]">
                <div className="flex justify-between"><dt className="text-ink-2">Concepto de aptitud</dt><dd className="font-semibold">{c.aptitudeConcept}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-2">Escenario (Tabla 1)</dt><dd className="font-semibold">{c.scenario}</dd></div>
              </dl>
            </Card>
            <Card>
              <CardTitle>Trampas del lote</CardTitle>
              {!traps.data?.length && <p className="text-[12px] text-ink-2">Este lote no tiene trampas registradas.</p>}
              <div className="grid grid-cols-2 gap-2">{traps.data?.map(t => <span key={t.code} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-[12px] font-medium"><MapPin size={12} className="text-brand" />{t.code}</span>)}</div>
              <div className="mt-4 flex gap-2"><Button onClick={() => nav('/agronomo/trampas')}>Ver trampas</Button><Button variant="secondary" onClick={() => nav('/agronomo/historial')}>Ver historial</Button></div>
            </Card>
          </div>
          {edit && <EditLot lot={l} onClose={() => setEdit(false)} onDone={() => { setEdit(false); qc.invalidateQueries(); toast('Información del lote actualizada.'); }} />}
        </div>
      )}</Q>
    )}</Q>
  );
}

function EditLot({ lot, onClose, onDone }: { lot: Lot; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ owner: lot.owner, crop: lot.crop, areaHa: String(lot.areaHa), status: lot.status }); const [err, setErr] = useState('');
  const m = useMutation({ mutationFn: () => services.lots.updateLot(lot.id, { ...f, areaHa: Number(f.areaHa.replace(',', '.')) }), onSuccess: onDone });
  return (
    <Modal open onClose={onClose} title="Editar información" subtitle={lot.name}>
      <div className="space-y-3">
        <Field label="Propietario"><Input value={f.owner} onChange={e => setF({ ...f, owner: e.target.value })} /></Field>
        <Field label="Cultivo"><Input value={f.crop} onChange={e => setF({ ...f, crop: e.target.value })} /></Field>
        <Field label="Área (ha)"><Input inputMode="decimal" value={f.areaHa} onChange={e => setF({ ...f, areaHa: e.target.value })} /></Field>
        <Field label="Estado"><Select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>{[...new Set(['Vigilancia activa', 'Vigilancia suspendida', lot.status])].map(s => <option key={s}>{s}</option>)}</Select></Field>
        {(err || m.error) && <ErrorBox error={err ? new Error(err) : m.error} />}
        <Button block disabled={m.isPending} onClick={() => { if (!(Number(f.areaHa.replace(',', '.')) > 0)) return setErr('El área debe ser mayor que 0.'); setErr(''); m.mutate(); }}>Guardar cambios</Button>
        <Button block variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </Modal>
  );
}
