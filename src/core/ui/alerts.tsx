/**
 * Alertas globales (nivel 1 del sistema de diseño).
 * Uso:  const alerts = useAlerts();  alerts.success('Documento enviado', 'Se envió al productor.');
 * Tipos: success · error · warn · info.  `useToast()` queda como atajo de éxito: toast('Guardado.').
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type AlertKind = 'success' | 'error' | 'warn' | 'info';
interface AlertItem { id: number; kind: AlertKind; title: string; message?: string; ms: number }
interface AlertApi { success: (t: string, m?: string) => void; error: (t: string, m?: string) => void; warn: (t: string, m?: string) => void; info: (t: string, m?: string) => void }

const STYLE: Record<AlertKind, { box: string; icon: string; bar: string; Icon: typeof Info }> = {
  success: { box: 'border-ok-line', icon: 'text-brand', bar: 'bg-brand', Icon: CheckCircle2 },
  error: { box: 'border-danger-line', icon: 'text-danger', bar: 'bg-danger', Icon: XCircle },
  warn: { box: 'border-warn-line', icon: 'text-warn', bar: 'bg-warn', Icon: AlertTriangle },
  info: { box: 'border-info-line', icon: 'text-info', bar: 'bg-info', Icon: Info },
};

const Ctx = createContext<AlertApi>({ success() {}, error() {}, warn() {}, info() {} });
export const useAlerts = () => useContext(Ctx);
export const useToast = () => { const a = useAlerts(); return useCallback((msg: string) => a.success(msg), [a]); };

function AlertCard({ a, onClose }: { a: AlertItem; onClose: () => void }) {
  const s = STYLE[a.kind]; const t = useRef<number | undefined>(undefined);
  useEffect(() => { t.current = window.setTimeout(onClose, a.ms); return () => window.clearTimeout(t.current); }, [a.ms, onClose]);
  return (
    <div role={a.kind === 'error' ? 'alert' : 'status'} className={clsx('pointer-events-auto relative w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border bg-white p-4 pr-10 shadow-modal', s.box)}>
      <div className="flex gap-3"><s.Icon size={20} className={clsx('mt-0.5 shrink-0', s.icon)} />
        <div className="min-w-0"><div className="text-[13px] font-semibold text-ink">{a.title}</div>{a.message && <div className="mt-0.5 text-[12px] text-ink-2">{a.message}</div>}</div></div>
      <button aria-label="Cerrar alerta" onClick={onClose} className="absolute right-3 top-3 rounded-full p-0.5 text-ink-3 hover:bg-surface"><X size={15} /></button>
      <span className={clsx('absolute bottom-0 left-0 h-0.5 origin-left', s.bar)} style={{ width: '100%', animation: `alert-bar ${a.ms}ms linear forwards` }} />
    </div>
  );
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AlertItem[]>([]); const seq = useRef(0);
  const push = useCallback((kind: AlertKind, title: string, message?: string) => {
    const id = ++seq.current; setItems(x => [...x.slice(-3), { id, kind, title, message, ms: kind === 'error' ? 7000 : 4500 }]);
  }, []);
  const api = useMemo<AlertApi>(() => ({ success: (t, m) => push('success', t, m), error: (t, m) => push('error', t, m), warn: (t, m) => push('warn', t, m), info: (t, m) => push('info', t, m) }), [push]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 top-[76px] z-[70] flex flex-col gap-2">
        {items.map(a => <AlertCard key={a.id} a={a} onClose={() => setItems(x => x.filter(i => i.id !== a.id))} />)}
      </div>
    </Ctx.Provider>
  );
}
