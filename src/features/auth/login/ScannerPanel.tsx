import { useMemo } from 'react';
import FlyE from './FlyE';
import { useFlyGame, type GamePhase } from './useFlyGame';
import isotipo from '@/assets/brand/sigat-isotipo.svg';

const HUD_MOUSE: Record<GamePhase, string> = {
  idle: '¡Atrapa la mosca! · mueve el cursor sobre el panel',
  tracking: 'Escaneando zona · acerca el visor a la mosca',
  locked: 'Objetivo fijado · analizando patrón alar',
  identified: 'Identificación completada · haz clic para atraparla',
  caught: '¡Capturada! · Ceratitis capitata',
};
const HUD_TOUCH: Partial<Record<GamePhase, string>> = {
  idle: '¡Atrapa la mosca! · tócala para capturarla',
  tracking: '¡Atrapa la mosca! · tócala para capturarla',
};

/**
 * Panel verde de bienvenida con el minijuego. Es decorativo y opcional:
 * no recibe foco, no intercepta el formulario y no envía nada al backend.
 */
export default function ScannerPanel() {
  const { panelRef, flyRef, reticleRef, cardRef, barRef, coordsRef, fxRef, phase, captures } = useFlyGame();
  const touchOnly = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(hover: none)').matches, []);
  const hud = (touchOnly && HUD_TOUCH[phase]) || HUD_MOUSE[phase];
  const done = phase === 'identified' || phase === 'caught';

  return (
    <section ref={panelRef} className="sg-panel" aria-label="SIGAT · Vigilancia de Durazno">
      <div className="sg-glow" aria-hidden="true" />
      <div className="sg-ring sg-ring--lg" aria-hidden="true" />
      <div className="sg-ring sg-ring--sm" aria-hidden="true" />

      <header className="sg-top sg-enter" style={{ animationDelay: '60ms' }}>
        <div className="sg-brand">
          <div className="sg-brand__tile"><img src={isotipo} alt="" width={52} height={52} /></div>
          <div className="sg-brand__text">
            <span className="sg-wordmark">SIGAT<span className="sg-wordmark__dot" aria-hidden="true" /></span>
            <span className="sg-brand__org">Instituto Colombiano Agropecuario</span>
          </div>
        </div>
        <span ref={coordsRef} className="sg-coords" aria-hidden="true">X 0000 · Y 0000</span>
      </header>

      <div className="sg-hero">
        <span className="sg-eyebrow sg-enter" style={{ animationDelay: '140ms' }}>Módulo de vigilancia · Ceratitis capitata</span>
        <h1 className="sg-title sg-enter" style={{ animationDelay: '220ms' }}>Vigilancia<br />de Durazno</h1>
      </div>

      <div className="sg-bottom sg-enter" style={{ animationDelay: '380ms' }}>
        <div className="sg-hud" aria-live="polite">
          <span className={`sg-hud__dot ${done ? 'is-done' : ''}`} aria-hidden="true" />
          <span>{hud}</span>
        </div>
        <span className={`sg-score ${phase === 'caught' ? 'is-bump' : ''}`} key={captures} aria-live="polite">
          Capturas: <b>{captures}</b>
        </span>
      </div>

      {/* Capas del juego: su posición la controla useFlyGame escribiendo en el DOM. */}
      <div ref={fxRef} className="sg-fx" aria-hidden="true" />
      <div ref={flyRef} className="sg-fly" aria-hidden="true"><FlyE size={92} /></div>
      <div ref={reticleRef} className="sg-reticle" data-state="free" aria-hidden="true">
        <svg viewBox="0 0 130 130" width="112" height="112">
          <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M4,30 L4,4 L30,4" /><path d="M100,4 L126,4 L126,30" />
            <path d="M126,100 L126,126 L100,126" /><path d="M30,126 L4,126 L4,100" />
          </g>
          <g className="sg-reticle__cross" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <line x1="65" y1="52" x2="65" y2="60" /><line x1="65" y1="70" x2="65" y2="78" />
            <line x1="52" y1="65" x2="60" y2="65" /><line x1="70" y1="65" x2="78" y2="65" />
          </g>
        </svg>
        {phase === 'locked' && <div className="sg-beam" />}
      </div>
      <div ref={cardRef} className={`sg-card ${done ? 'is-done' : ''}`} aria-hidden="true">
        <span className="sg-card__label">{phase === 'caught' ? 'Objetivo capturado' : 'Objetivo detectado'}</span>
        <span className="sg-card__name">Ceratitis capitata</span>
        <div className="sg-card__track"><div ref={barRef} className="sg-card__bar" /></div>
        <span className="sg-card__status">
          {phase === 'caught' ? 'Capturada · Mosca del Mediterráneo' : phase === 'identified' ? 'Identificada · Mosca del Mediterráneo' : 'Analizando patrón alar…'}
        </span>
      </div>
    </section>
  );
}
