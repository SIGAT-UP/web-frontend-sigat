import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, ErrorBox, Input, Modal, StateBadge, useToast } from '@/core/ui';
import { useEffect, useState } from 'react';
import { usePageMeta } from '@/app/pageMeta';
import { services } from '@/data/services';
import { Q } from '@/features/shared/Query';
import type { CatalogCard } from '@/data/models/types';

export default function Catalogs() {
  usePageMeta('Catálogos', 'Valores de referencia del sistema');
  const q = useQuery({ queryKey: ['catalogs'], queryFn: () => services.program.catalogs() }); const nav = useNavigate(); const [open, setOpen] = useState<CatalogCard | null>(null);
  return (
    <Q q={q}>{cs => (
      <>
        <div className="grid gap-4 md:grid-cols-2">
          {cs.map(c => (
            <Card key={c.id}>
              <div className="flex items-start justify-between"><h3 className="text-[14px] font-semibold">{c.title}</h3><StateBadge s={c.mode} /></div>
              <div className="mt-1 text-[11px] text-ink-2">{c.summary}</div><div className="text-[11px] text-ink-2">{c.detail}</div>
              <button className="mt-5 text-[12px] font-semibold text-brand" onClick={() => c.id === 'escenarios' ? nav('/agronomo/programa') : setOpen(c)}>{c.action}</button>
            </Card>
          ))}
        </div>
        {open && <CatalogModal card={open} onClose={() => setOpen(null)} />}
      </>
    )}</Q>
  );
}

function CatalogModal({ card, onClose }: { card: CatalogCard; onClose: () => void }) {
  const qc = useQueryClient(); const toast = useToast(); const editable = card.mode === 'Editable';
  const items = useQuery({ queryKey: ['catalogItems', card.id], queryFn: () => services.program.catalogItems(card.id) });
  const [list, setList] = useState<string[]>([]); const [adding, setAdding] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { if (items.data) setList(items.data); }, [items.data]);
  const save = useMutation({ mutationFn: () => services.program.saveCatalogItems(card.id, list), onSuccess: () => { qc.invalidateQueries({ queryKey: ['catalogs'] }); qc.invalidateQueries({ queryKey: ['catalogItems'] }); toast('Catálogo actualizado.'); onClose(); } });
  const add = () => { const v = adding.trim(); if (!v) return; if (list.some(x => x.toLowerCase() === v.toLowerCase())) return setErr('Ese valor ya existe.'); setList([...list, v]); setAdding(''); setErr(''); };
  return (
    <Modal open onClose={onClose} title={card.title} subtitle={card.summary}>
      <div className="mb-3"><Badge tone={editable ? 'ok' : 'neutral'}>{card.mode}</Badge></div>
      <ul className="space-y-2">{list.map((v, i) => (
        <li key={i} className="flex items-center gap-2">
          {editable ? <Input value={v} onChange={e => setList(list.map((x, j) => j === i ? e.target.value : x))} aria-label={`Valor ${i + 1}`} /> : <span className="flex-1 rounded-lg bg-surface px-3 py-2 text-[13px]">{v}</span>}
          {editable && <button aria-label={`Quitar ${v}`} className="text-danger" onClick={() => setList(list.filter((_, j) => j !== i))}><Trash2 size={15} /></button>}
        </li>))}</ul>
      {editable && (
        <div className="mt-3 flex gap-2"><Input value={adding} placeholder="Nuevo valor" onChange={e => setAdding(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} /><Button variant="secondary" onClick={add}><Plus size={14} /> Agregar</Button></div>
      )}
      {(err || save.error) && <div className="mt-3"><ErrorBox error={err ? new Error(err) : save.error} /></div>}
      <div className="mt-4 space-y-2">
        {editable && <Button block disabled={save.isPending} onClick={() => { setErr(''); save.mutate(); }}>Guardar cambios</Button>}
        <Button block variant="secondary" onClick={onClose}>{editable ? 'Cancelar' : 'Cerrar'}</Button>
      </div>
    </Modal>
  );
}
