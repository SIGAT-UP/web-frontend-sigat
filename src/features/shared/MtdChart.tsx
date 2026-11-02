import type { MtdPoint } from '@/data/models/types';
import { fMtd } from '@/core/utils/format';

/** Gráfico de tendencia del MTD en SVG (sin librerías). `limit` dibuja la línea punteada del escenario. */
export function MtdChart({ series, limit, height = 190 }: { series: MtdPoint[]; limit?: number; height?: number }) {
  if (!series.length) return <p className="py-10 text-center text-[12px] text-ink-2">Aún no hay períodos cerrados con MTD.</p>;
  const W = 640, H = height, L = 34, R = 20, T = 14, B = 26;
  const max = Math.max(0.5, ...series.map(s => s.value), limit ?? 0) * 1.1;
  const x = (i: number) => L + (series.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (series.length - 1));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const line = series.map((s, i) => `${i ? 'L' : 'M'}${x(i)},${y(s.value)}`).join(' ');
  const area = `${line} L${x(series.length - 1)},${H - B} L${x(0)},${H - B} Z`;
  const ticks = [0, max / 2, max];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Tendencia del MTD: ${series.map(s => `${s.label} ${fMtd(s.value)}`).join(', ')}`}>
      {ticks.map(t => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e5eae7" /><text x={L - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#a3aaa6">{fMtd(t)}</text></g>)}
      {limit !== undefined && <g><line x1={L} x2={W - R} y1={y(limit)} y2={y(limit)} stroke="#e0a100" strokeDasharray="4 4" /><text x={W - R} y={y(limit) - 4} textAnchor="end" fontSize="9" fill="#8a5a00">Límite de escenario {fMtd(limit)}</text></g>}
      <path d={area} fill="#0b8a4e" opacity="0.08" /><path d={line} fill="none" stroke="#17573a" strokeWidth="2" strokeLinejoin="round" />
      {series.map((s, i) => <g key={s.label}><circle cx={x(i)} cy={y(s.value)} r="3.5" fill="#fff" stroke="#17573a" strokeWidth="2" /><text x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#6b7370">{s.label}</text></g>)}
      <text x={x(series.length - 1)} y={y(series[series.length - 1].value) - 9} textAnchor="end" fontSize="10" fontWeight="700" fill="#17573a">{fMtd(series[series.length - 1].value)}</text>
    </svg>
  );
}
