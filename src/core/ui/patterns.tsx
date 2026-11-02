/**
 * Patrones de composición reutilizables (nivel 2 del sistema de diseño).
 * Se construyen sobre las piezas básicas de `core/ui` (Card, Badge, Button…).
 * Úsalos en lugar de volver a escribir estos bloques en cada pantalla.
 */
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { Card, type Tone } from './index';

/** Tarjeta con título, subtítulo y acción opcional. */
export function Section({ title, subtitle, right, children, className }: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><h2 className="text-[14px] font-semibold text-ink">{title}</h2>{subtitle && <p className="text-[11px] text-ink-2">{subtitle}</p>}</div>{right}
      </div>
      {children}
    </Card>
  );
}

/** Lista «etiqueta … valor» con divisores (perfil, resúmenes, detalles). */
export function DescriptionList({ rows, className }: { rows: [label: string, value: ReactNode][]; className?: string }) {
  return (
    <dl className={clsx('divide-y divide-line text-[12px]', className)}>
      {rows.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-4 py-2.5"><dt className="text-ink-2">{k}</dt><dd className="text-right font-semibold text-ink">{v}</dd></div>)}
    </dl>
  );
}

/** Valores apilados con nota (resumen del lote). */
export function StackedFacts({ rows }: { rows: [label: string, value: ReactNode, note?: ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v, n]) => <div key={k} className="py-2.5"><dt className="text-[11px] text-ink-2">{k}</dt><dd className="text-[15px] font-semibold text-ink">{v}</dd>{n && <div className="text-[10px] text-ink-3">{n}</div>}</div>)}
    </dl>
  );
}

/** Lista con checks verdes (permisos, funciones del rol). */
export function CheckList({ items }: { items: readonly string[] }) {
  return <ul className="space-y-2 text-[12px]">{items.map(i => <li key={i} className="flex items-center gap-2"><Check size={14} className="shrink-0 text-brand" />{i}</li>)}</ul>;
}

/** Formulario a dos columnas con tarjeta lateral «Antes de guardar». */
export function FormLayout({ title, subtitle, errorCount, aside, children }: { title: string; subtitle?: string; errorCount?: number; aside?: ReactNode; children: ReactNode }) {
  return (
    <>
      {!!errorCount && <div role="alert" className="mb-3 rounded-control border border-danger-line bg-danger-soft px-4 py-3 text-[12px] font-medium text-danger">Revisa {errorCount === 1 ? 'el dato marcado' : `los ${errorCount} datos marcados`} antes de guardar.</div>}
      <div className={clsx('grid gap-4', aside && 'lg:grid-cols-[1.6fr_1fr]')}>
        <Card><h2 className="text-[14px] font-semibold">{title}</h2>{subtitle && <p className="text-[11px] text-ink-2">{subtitle}</p>}<div className="mt-4">{children}</div></Card>
        {aside && <SideNote title="Antes de guardar">{aside}</SideNote>}
      </div>
    </>
  );
}

/** Tarjeta lateral informativa. */
export function SideNote({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="h-fit bg-surface-tint"><h3 className="mb-2 text-[13px] font-semibold">{title}</h3><div className="space-y-2 text-[12px] text-ink-2">{children}</div></Card>;
}

/** Círculo con ícono (cabeceras de tarjetas de acción, perfiles). */
export function IconTile({ children, tone = 'brand' }: { children: ReactNode; tone?: Tone | 'brand' }) {
  const t = { brand: 'bg-brand-soft text-brand', ok: 'bg-brand-soft text-brand', warn: 'bg-warn-soft text-warn', danger: 'bg-danger-soft text-danger', info: 'bg-info-soft text-info', neutral: 'bg-surface-raised text-ink-2' }[tone];
  return <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', t)}>{children}</span>;
}

/** Avatar con iniciales. */
export const Avatar = ({ initials, size = 56 }: { initials: string; size?: number }) => (
  <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-full bg-brand-soft text-[15px] font-semibold text-brand-strong">{initials}</span>
);

/** Tarjeta de perfil: avatar, nombre, subtítulo y etiquetas a la derecha. */
export function ProfileHeader({ initials, name, subtitle, badges }: { initials: string; name: string; subtitle: string; badges?: ReactNode }) {
  return <Card className="flex items-center gap-4"><Avatar initials={initials} /><div className="flex-1"><div className="text-[17px] font-semibold">{name}</div><div className="text-[12px] text-ink-2">{subtitle}</div></div>{badges}</Card>;
}

/** Estado vacío. */
export const EmptyState = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="rounded-card border border-dashed border-line-strong bg-white px-6 py-10 text-center"><div className="text-[14px] font-semibold">{title}</div>{children && <p className="mt-1 text-[12px] text-ink-2">{children}</p>}</div>
);

/** Fila de acciones de página (título de intro a la izquierda, botones a la derecha). */
export const PageActions = ({ intro, children }: { intro?: ReactNode; children?: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">{intro && <p className="text-[13px] font-medium text-ink">{intro}</p>}<div className="flex gap-2">{children}</div></div>
);
