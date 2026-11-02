import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button, Card, CardTitle, DataTable, Field, Input, Modal, useToast, ErrorBox } from '@/core/ui';
import { BackLink } from '@/core/ui/PageHeader';
import { usePageMeta } from '@/app/pageMeta';
import { services } from '@/data/services';
import { useLots } from '@/data/hooks';
import { Q } from '@/features/shared/Query';
import type { Farm } from '@/data/models/types';

export function CartographyList() {
  usePageMeta('Cartografía', 'Datos básicos de los predios'); const nav = useNavigate();
  const q = useQuery({ queryKey: ['farms'], queryFn: () => services.admin.farms() }); const [s, setS] = useState(''); const [view, setView] = useState<Farm | null>(null);
  return (
    <Q q={q}>{fs => (
      <Card>
        <div className="mb-4 w-72"><Field label="Buscar predio"><div className="relative"><Search size={14} className="absolute left-3 top-3 text-ink-3" /><Input className="pl-9" placeholder="Escribe el nombre del predio" value={s} onChange={e => setS(e.target.value)} /></div></Field></div>
        <DataTable rows={fs.filter(f => f.name.toLowerCase().includes(s.toLowerCase()))} rowKey={f => f.id} noun="registro" columns={[
          { header: 'Predio', cell: f => <b>{f.name}</b> }, { header: 'Extensión (ha)', cell: f => f.extensionHa ?? <span className="text-warn">Sin definir</span> }, { header: 'Cantidad de lotes', cell: f => f.lotCount ?? <span className="text-warn">Sin definir</span> },
          { header: 'Acciones', cell: f => <span className="flex gap-3 text-[12px] font-semibold text-brand"><button onClick={() => setView(f)}>Ver</button><button onClick={() => nav(`/admin/cartografia/${f.id}`)}>Editar</button></span> },
        ]} />
        <Modal open={!!view} onClose={() => setView(null)} title={view?.name} subtitle="Datos básicos del predio">
          {view && <dl className="space-y-2 text-[13px]">{[['Extensión (ha)', view.extensionHa ?? 'Sin definir'], ['Cantidad de lotes', view.lotCount ?? 'Sin definir'], ['Código del predio', view.code ?? 'Sin definir'], ['Municipio', view.municipality ?? 'Sin definir'], ['Departamento', view.department ?? 'Sin definir'], ['Responsable', view.responsible ?? 'Sin definir']].map(([k, v]) => <div key={String(k)} className="flex justify-between"><dt className="text-ink-2">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>}
        </Modal>
      </Card>
    )}</Q>
  );
}

export function CartographyEdit() {
  usePageMeta('Cartografía', 'Datos básicos de los predios · edición'); const nav = useNavigate(); const qc = useQueryClient(); const toast = useToast(); const lots = useLots();
  const q = useQuery({ queryKey: ['farms'], queryFn: () => services.admin.farms() });
  const [f, setF] = useState<Farm | null>(null); const [err, setErr] = useState('');
  useEffect(() => { if (q.data?.[0]) setF(q.data[0]); }, [q.data]);
  const m = useMutation({ mutationFn: () => services.admin.updateFarm(f!), onSuccess: () => { qc.invalidateQueries({ queryKey: ['farms'] }); qc.invalidateQueries({ queryKey: ['farm'] }); qc.invalidateQueries({ queryKey: ['audit'] }); toast('Predio actualizado.'); nav('/admin/cartografia'); } });
  const save = () => { if (!f!.name.trim()) return setErr('El nombre del predio es obligatorio.'); if (f!.lotCount !== null && (!Number.isInteger(f!.lotCount) || f!.lotCount < 1)) return setErr('La cantidad de lotes debe ser un entero mayor que 0.'); if (f!.extensionHa !== null && f!.extensionHa <= 0) return setErr('La extensión debe ser mayor que 0.'); setErr(''); m.mutate(); };
  const txt = (k: 'code' | 'municipality' | 'department' | 'responsible') => ({ value: f?.[k] ?? '', placeholder: 'Sin definir', onChange: (e: { target: { value: string } }) => setF({ ...f!, [k]: e.target.value || null }) });
  return (
    <div>
      <BackLink to="/admin/cartografia">Volver a predios</BackLink>
      {f && (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <Card><CardTitle>Editar datos del predio</CardTitle>
            <div className="space-y-3">
              <Field label="Nombre del predio"><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="Extensión (ha)"><Input type="number" min={0} step="0.1" placeholder="Sin definir" value={f.extensionHa ?? ''} onChange={e => setF({ ...f, extensionHa: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
              <Field label="Cantidad de lotes"><Input type="number" min={1} value={f.lotCount ?? ''} onChange={e => setF({ ...f, lotCount: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
              <Field label="Código del predio"><Input {...txt('code')} /></Field><Field label="Municipio"><Input {...txt('municipality')} /></Field>
              <Field label="Departamento"><Input {...txt('department')} /></Field><Field label="Responsable"><Input {...txt('responsible')} /></Field>
              {(err || m.error) && <ErrorBox error={err ? new Error(err) : m.error} />}
              <div className="flex justify-center gap-3 pt-2"><Button disabled={m.isPending} onClick={save}>Guardar cambios</Button><Button variant="secondary" onClick={() => nav('/admin/cartografia')}>Cancelar</Button></div>
            </div></Card>
          <Card><CardTitle>Esquema de referencia</CardTitle>
            <div className="relative aspect-[16/10] rounded-xl border border-line bg-surface">{lots.data?.map(l => <span key={l.id} style={{ left: `${l.shape.x}%`, top: `${l.shape.y}%`, width: `${l.shape.w}%`, height: `${l.shape.h}%` }} className="absolute rounded-[6px] border-2 border-brand/70 p-2 text-[10px] font-medium">{l.name}</span>)}</div>
            <p className="mt-2 text-[10px] text-ink-3">Esquema sin coordenadas reales. Los contornos y las trampas no se editan en esta vista.</p></Card>
        </div>
      )}
    </div>
  );
}
