const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const p2 = (n: number) => String(n).padStart(2, '0');
const d = (iso: string) => new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);

export const fDate = (iso?: string | null) => { if (!iso) return '—'; const x = d(iso); return `${p2(x.getDate())} ${MES[x.getMonth()]} ${x.getFullYear()}`; };
export const fShort = (iso?: string | null) => { if (!iso) return '—'; const x = d(iso); return `${p2(x.getDate())} ${MES[x.getMonth()]}`; };
export const fTime = (iso: string) => { const x = d(iso); return `${p2(x.getHours())}:${p2(x.getMinutes())}`; };
export const fDateTime = (iso?: string | null) => (iso ? `${fDate(iso)} · ${fTime(iso)}` : '—');
export const fShortTime = (iso: string) => `${fShort(iso)} · ${fTime(iso)}`;
export const fNumeric = (iso: string) => { const x = d(iso); return `${p2(x.getDate())}/${p2(x.getMonth() + 1)}/${x.getFullYear()}`; };
export const fNumericTime = (iso: string) => `${fNumeric(iso)} ${fTime(iso)}`;
export const fSlashShort = (iso: string) => `${p2(d(iso).getDate())}/${p2(d(iso).getMonth() + 1)} ${fTime(iso)}`;
export const fLong = (iso: string) => { const x = d(iso); return `${DIA[x.getDay()]}, ${p2(x.getDate())} ${MES[x.getMonth()]}. ${x.getFullYear()}`; };
export const fMtd = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(2).replace('.', ','));
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
/** Fecha local de hoy en formato AAAA-MM-DD (para inputs type=date). */
export const todayIso = () => { const x = new Date(); return `${x.getFullYear()}-${p2(x.getMonth() + 1)}-${p2(x.getDate())}`; };
/** Suma días a una fecha AAAA-MM-DD. */
export const addDaysIso = (iso: string, days: number) => { const x = d(iso); x.setDate(x.getDate() + days); return `${x.getFullYear()}-${p2(x.getMonth() + 1)}-${p2(x.getDate())}`; };
/** Días completos transcurridos desde una fecha hasta hoy. */
export const daysSince = (iso: string) => Math.max(0, Math.round((d(todayIso()).getTime() - d(iso.slice(0, 10)).getTime()) / 86400000));
/** Nombre del mes y año, p. ej. «octubre 2026». */
export const fMonth = (iso: string) => { const x = d(iso.length === 7 ? iso + '-01' : iso); return `${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][x.getMonth()]} ${x.getFullYear()}`; };
