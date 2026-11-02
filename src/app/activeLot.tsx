import { useSyncExternalStore, type ReactNode } from 'react';
import { Select, Loading, ErrorBox } from '@/core/ui';
import { useLots } from '@/data/hooks';

/**
 * Lote activo del agrónomo (Inicio, Lote, Trampas, Resumen, Historial y Mapa lo comparten).
 * Se recuerda en el navegador; si el lote guardado ya no existe se usa el primero de la lista.
 */
const KEY = 'sigat.lote';
const listeners = new Set<() => void>();
let current: string | null = (() => { try { return window.localStorage.getItem(KEY); } catch { return null; } })();

export function setActiveLotId(id: string) {
  current = id;
  try { window.localStorage.setItem(KEY, id); } catch { /* solo en memoria */ }
  listeners.forEach(l => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function useActiveLot() {
  const stored = useSyncExternalStore(subscribe, () => current, () => null);
  const lots = useLots();
  const list = lots.data ?? [];
  const lotId = list.some(l => l.id === stored) ? stored! : list[0]?.id ?? '';
  return { lotId, lots, setLotId: setActiveLotId };
}

/** Resuelve el lote activo y solo entonces pinta la pantalla (evita consultas con id vacío). */
export function WithActiveLot({ children }: { children: (lotId: string) => ReactNode }) {
  const { lotId, lots } = useActiveLot();
  if (lots.isLoading) return <Loading />;
  if (lots.error) return <ErrorBox error={lots.error} />;
  if (!lotId) return <p className="rounded-[14px] border border-line bg-white p-8 text-center text-[13px] text-ink-2">Aún no tienes lotes asignados. Cuando el administrador registre la cartografía del predio aparecerán aquí.</p>;
  return <>{children(lotId)}</>;
}

/** Selector compacto del lote activo (cabecera del agrónomo). */
export function ActiveLotPicker() {
  const { lotId, lots, setLotId } = useActiveLot();
  if (!lots.data?.length) return null;
  return (
    <div className="w-44 shrink-0">
      <Select aria-label="Lote activo" title="Lote activo" value={lotId} onChange={e => setLotId(e.target.value)} className="h-8 py-0 text-[12px]">
        {lots.data.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </Select>
    </div>
  );
}
