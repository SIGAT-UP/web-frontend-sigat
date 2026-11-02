import { useEffect, useId, useMemo, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

/* ---------- Botones ---------- */
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'soft' | 'ghost' | 'dangerSoft';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-brand-dark text-white hover:bg-brand-strong disabled:bg-brand-dark/50',
  secondary: 'bg-white text-brand-dark border border-brand-dark/60 hover:bg-brand-soft',
  danger: 'bg-danger text-white hover:bg-danger/90',
  soft: 'bg-info-soft text-info border border-info-line hover:bg-info-soft/70',
  dangerSoft: 'bg-danger-soft text-danger border border-danger-line hover:bg-danger-soft/70',
  ghost: 'text-brand-dark hover:bg-brand-soft',
};
export function Button({ variant = 'primary', block, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; block?: boolean }) {
  return <button {...p} className={clsx('inline-flex h-10 items-center justify-center gap-2 rounded-control px-4 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed', BTN[variant], block && 'w-full', className)} />;
}

/* ---------- Tarjetas ---------- */
export function Card({ className, children, tone }: { className?: string; children: ReactNode; tone?: 'warn' | 'brand' | 'plain' }) {
  return <section className={clsx('rounded-card border p-5 shadow-card transition-colors', tone === 'warn' ? 'border-warn-line bg-warn-soft' : tone === 'brand' ? 'border-ok-line bg-surface-tint' : 'border-line bg-white', className)}>{children}</section>;
}
export const CardTitle = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-semibold text-ink">{children}</h2>{right}</div>
);

/* ---------- Etiquetas de estado ---------- */
const TONES = {
  ok: 'bg-brand-soft text-brand-strong border-ok-line', warn: 'bg-warn-soft text-warn-text border-warn-line', danger: 'bg-danger-soft text-danger border-danger-line',
  info: 'bg-info-soft text-info border-info-line', neutral: 'bg-surface-raised text-ink-2 border-line',
} as const;
export type Tone = keyof typeof TONES;
export const Badge = ({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) => (
  <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', TONES[tone], className)}>{children}</span>
);
export const STATE_TONE: Record<string, Tone> = {
  'Sin verificar': 'warn', Confirmado: 'ok', Corregido: 'neutral', Rechazado: 'danger', Autoreporte: 'info', Autorreporte: 'info',
  Pendiente: 'warn', Aceptada: 'ok', Rechazada: 'danger', Completada: 'info', Activa: 'ok', Inactiva: 'neutral', 'En mantenimiento': 'warn',
  Correcta: 'ok', Revisar: 'info', Sincronizada: 'ok', 'Inspección oficial': 'ok', Editable: 'ok', 'Solo lectura': 'neutral', Activo: 'ok',
};
export const StateBadge = ({ s }: { s: string }) => <Badge tone={STATE_TONE[s] ?? 'neutral'}>{s}</Badge>;

/* ---------- KPI ---------- */
export function Kpi({ label, value, note, tone, action }: { label: string; value: ReactNode; note?: ReactNode; tone?: 'warn'; action?: ReactNode }) {
  return (
    <div className={clsx('rounded-card border p-4 shadow-card', tone === 'warn' ? 'border-warn-line bg-warn-soft' : 'border-line bg-white')}>
      <div className="flex items-start justify-between text-[11px] text-ink-2"><span>{label}</span>{action}</div>
      <div className={clsx('mt-1 text-[28px] font-semibold leading-tight', tone === 'warn' ? 'text-warn-text' : 'text-brand-dark')}>{value}</div>
      {note && <div className="mt-0.5 text-[11px] text-ink-2">{note}</div>}
    </div>
  );
}

/* ---------- Formularios ---------- */
const field = 'h-10 w-full rounded-control border border-line-strong bg-white px-3 text-[13px] text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none disabled:bg-surface';
export function Field({ label, hint, error, required, children }: { label?: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="block">
      {label && <div className="mb-1 text-[12px] font-medium text-ink-2">{label}{required && ' *'}</div>}
      {children}
      {hint && !error && <div className="mt-1 text-[11px] text-ink-3">{hint}</div>}
      {error && <div className="mt-1 text-[11px] text-danger" role="alert">{error}</div>}
    </div>
  );
}
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={clsx(field, className)} />;
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={clsx(field, 'pr-8', className)}>{children}</select>;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={clsx(field, 'h-auto py-2', className)} />;
export const FilterSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <Field label={label}><Select value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></Field>
);

/* ---------- Modal ---------- */
export function Modal({ open, onClose, children, icon, title, subtitle, width = 'max-w-[420px]' }: { open: boolean; onClose: () => void; children: ReactNode; icon?: ReactNode; title?: string; subtitle?: string; width?: string }) {
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nav/45 p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={id} className={clsx('relative max-h-[92vh] w-full overflow-y-auto rounded-[20px] bg-white p-6 shadow-modal', width)}>
        <button onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 rounded-full p-1 text-ink-3 hover:bg-surface"><X size={18} /></button>
        {icon && <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">{icon}</div>}
        {title && <h3 id={id} className={clsx('text-[16px] font-bold text-ink', icon && 'text-center')}>{title}</h3>}
        {subtitle && <p className={clsx('mt-1 text-[12px] text-ink-2', icon && 'text-center')}>{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Tabla con paginación ---------- */
export interface Column<T> { header: string; cell: (row: T) => ReactNode; className?: string }
export function usePagination<T>(rows: T[], initial = 10) {
  const [size, setSize] = useState(initial); const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(page, pages);
  const slice = useMemo(() => rows.slice((cur - 1) * size, cur * size), [rows, cur, size]);
  return { slice, size, setSize: (n: number) => { setSize(n); setPage(1); }, page: cur, pages, setPage, total: rows.length, from: rows.length ? (cur - 1) * size + 1 : 0, to: Math.min(cur * size, rows.length) };
}
export function DataTable<T>({ rows, columns, rowKey, empty = 'No hay registros para mostrar.', onRowClick, footnote, noun = 'registros' }: {
  rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; empty?: string; onRowClick?: (r: T) => void; footnote?: ReactNode; noun?: string }) {
  const pg = usePagination(rows);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead><tr className="border-b border-line text-[11px] font-semibold text-ink-2">{columns.map(c => <th key={c.header} className={clsx('px-3 py-2.5', c.className)}>{c.header}</th>)}</tr></thead>
          <tbody>
            {pg.slice.map(r => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={clsx('border-b border-line/70 last:border-0', onRowClick && 'cursor-pointer hover:bg-surface-tint')}>
                {columns.map(c => <td key={c.header} className={clsx('px-3 py-3 align-middle', c.className)}>{c.cell(r)}</td>)}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-ink-2">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-2">
        <span>Mostrando {pg.from}-{pg.to} de {pg.total} {noun}</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">Mostrar
            <select value={pg.size} onChange={e => pg.setSize(Number(e.target.value))} className="h-8 rounded-lg border border-line bg-white px-2 text-[12px]">{[5, 10, 25].map(n => <option key={n}>{n}</option>)}</select> registros por página</label>
          <span className="font-semibold">Página {pg.page} de {pg.pages}</span>
          <button disabled={pg.page <= 1} onClick={() => pg.setPage(pg.page - 1)} className="rounded-lg border border-line px-3 py-1.5 text-ink-2 disabled:opacity-40">‹ Anterior</button>
          <span className="rounded-lg bg-brand-dark px-3 py-1.5 text-white">{pg.page}</span>
          <button disabled={pg.page >= pg.pages} onClick={() => pg.setPage(pg.page + 1)} className="rounded-lg border border-line px-3 py-1.5 text-ink-2 disabled:opacity-40">Siguiente ›</button>
        </div>
      </div>
      {footnote && <p className="mt-2 text-[11px] text-ink-3">{footnote}</p>}
    </div>
  );
}

/* ---------- Pestañas ---------- */
export function Tabs<T extends string>({ value, onChange, items, variant = 'underline' }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[]; variant?: 'underline' | 'pill' }) {
  return (
    <div role="tablist" className={clsx('flex gap-1', variant === 'underline' ? 'border-b border-line' : 'flex-wrap gap-2')}>
      {items.map(i => (
        <button key={i.value} role="tab" aria-selected={value === i.value} onClick={() => onChange(i.value)}
          className={variant === 'pill'
            ? clsx('rounded-full px-4 py-1.5 text-[12px] font-semibold', value === i.value ? 'bg-brand-dark text-white' : 'border border-line bg-white text-ink-2 hover:bg-surface')
            : clsx('-mb-px border-b-2 px-3 py-2 text-[12px] font-semibold', value === i.value ? 'border-brand-dark text-brand-dark' : 'border-transparent text-ink-2 hover:text-ink')}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Estados de carga ---------- */
export const Loading = () => <p className="py-10 text-center text-ink-2" role="status">Cargando…</p>;
export const ErrorBox = ({ error }: { error: unknown }) => <div role="alert" className="rounded-[10px] border border-danger-line bg-danger-soft px-4 py-3 text-danger">{error instanceof Error ? error.message : 'Ocurrió un error.'}</div>;
export const Notice = ({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'danger' | 'ok'; title?: string; children?: ReactNode }) => (
  <div className={clsx('rounded-[10px] border px-4 py-3 text-[12px]',
    tone === 'info' && 'border-info-line bg-info-soft text-info', tone === 'warn' && 'border-warn-line bg-warn-soft text-warn-text',
    tone === 'danger' && 'border-danger-line bg-danger-soft text-danger', tone === 'ok' && 'border-ok-line bg-brand-soft text-brand-strong')}>
    {title && <div className="font-semibold">{title}</div>}{children && <div className={clsx(title && 'text-ink-2')}>{children}</div>}
  </div>
);

/* ---------- Alertas globales ---------- */
export { AlertProvider, useAlerts, useToast } from './alerts';
