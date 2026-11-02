import { Printer } from 'lucide-react';
import { Button, Card, CardTitle, Kpi } from '@/core/ui';
import { usePageMeta } from '@/app/pageMeta';
import { useControl, useDataAsOf, useLot, useLotHistory } from '@/data/hooks';
import { WithActiveLot } from '@/app/activeLot';
import { fDate, fDateTime, fMtd, fNumeric } from '@/core/utils/format';
import { MtdChart } from '@/features/shared/MtdChart';
import { Q } from '@/features/shared/Query';
import logoHorizontal from '@/assets/brand/sigat-logo-horizontal.svg';

const num = (v: number | null | undefined) => (v == null ? '—' : String(v));
const kg = (v: number | null | undefined) => (v == null ? '—' : `${v.toLocaleString('es-CO')} kg`);

export default function Summary() {
  return <WithActiveLot>{id => <SummaryView lotId={id} />}</WithActiveLot>;
}

function SummaryView({ lotId }: { lotId: string }) {
  const lot = useLot(lotId); const ctl = useControl(lotId); const hist = useLotHistory(lotId); const asOf = useDataAsOf();
  usePageMeta('Resumen y reportes', `Resumen fitosanitario del ${lot.data?.name ?? 'lote'}`);
  return (
    <Q q={lot}>{l => (
      <Q q={ctl}>{c => {
        const h = hist.data ?? [];
        const apps = h.filter(x => x.type === 'Aplicación'); const inspections = h.filter(x => x.type === 'Inspección');
        return (
          <div className="space-y-4" id="reporte">
            <div className="hidden items-center justify-between border-b border-line pb-3 print:flex">
              <img src={logoHorizontal} alt="SIGAT" className="h-12 w-auto" />
              <div className="text-right text-[11px] text-ink-2"><div className="font-semibold text-ink">{l.name}</div>{asOf.data && <div>Datos hasta el {fDateTime(asOf.data)}</div>}</div>
            </div>
            <div className="flex items-center justify-between print:hidden">
              <p className="text-[12px] text-ink-2">{asOf.data ? `Datos hasta el ${fDateTime(asOf.data)}. ` : ''}El PDF se genera con el diálogo de impresión del navegador («Guardar como PDF»).</p>
              <Button variant="secondary" onClick={() => window.print()}><Printer size={14} /> Exportar resumen (PDF)</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Kpi label="MTD · último período" value={fMtd(c.mtd)} note={`moscas/trampa/día · ${c.mtdPeriod}`} />
              <Kpi label="Escenario de trampeo" value={<span className="text-[22px]">{c.scenario}</span>} note={`Límite ${fMtd(c.scenarioLimit)}`} />
              <Kpi label="Umbral de exportación" value={<span className="text-[22px]">{c.exportThreshold ?? 'Sin definir'}</span>} note={c.exportThreshold ? 'Umbral vigente' : 'Falta definir (UQQ-004)'} />
              <Kpi label="Concepto de aptitud" value={<span className="text-[22px]">{c.aptitudeConcept}</span>} note="Sin umbral no se emite" />
            </div>
            <Card><CardTitle>Tendencia del MTD</CardTitle><MtdChart series={c.series} limit={c.scenarioLimit} /></Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card><CardTitle>Indicadores del lote</CardTitle>
                <dl className="divide-y divide-line/70 text-[13px]">{[
                  ['Inspecciones registradas', String(inspections.length)], ['Aplicaciones fitosanitarias', String(apps.length)], ['Última aplicación', apps[0] ? fNumeric(apps[0].at) : '—'],
                  ['Trampas del lote', String(l.trapsTotal)], ['Última visita', fDateTime(l.lastVisit)], ['Lecturas del período', num(c.periodReadings)], ['Especímenes detectados', num(c.specimens)], ['Hallazgos activos', num(c.activeFindings)],
                ].map(([k, v]) => <div key={k} className="flex justify-between py-2.5"><dt className="text-ink-2">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl></Card>
              <Card><CardTitle>Cultivo</CardTitle>
                <dl className="divide-y divide-line/70 text-[13px]">{[['Cultivo', l.crop], ['Etapa fenológica', c.phenologicalStage ?? '—'], ['Cosecha esperada', c.expectedHarvest ? fDate(c.expectedHarvest) : '—'], ['Producción estimada', kg(c.expectedKg)], ['Producción real', c.actualKg == null ? 'Aún sin cosechar' : kg(c.actualKg)], ['Buenas prácticas', c.bpaStatus ?? '—']].map(([k, v]) => <div key={k} className="flex justify-between py-2.5"><dt className="text-ink-2">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl></Card>
            </div>
          </div>
        );
      }}</Q>
    )}</Q>
  );
}
