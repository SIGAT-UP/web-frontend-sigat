import { useEffect, useRef, useState } from 'react';

/**
 * Minijuego del panel verde del login: «Atrapa la mosca».
 *
 * - La mosca vuela sola hacia objetivos aleatorios dentro del panel.
 * - Si el puntero se acerca huye; al huir se cansa (stamina) y vuelve a ser alcanzable.
 * - Con el visor encima, el escáner la «fija» y la identifica (barra de progreso).
 * - Al pulsarla o tocarla: destello de partículas, +1 al contador y reaparece en otro punto.
 *
 * Rendimiento: la posición de la mosca, el visor, la ficha y las partículas se escriben
 * directamente en el DOM desde un único requestAnimationFrame. React solo se actualiza
 * cuando cambia la fase (texto del HUD) o el contador, unas pocas veces por minuto.
 * El bucle se pausa con la pestaña oculta o el panel fuera de pantalla y se cancela al desmontar.
 * Nunca hace peticiones de red ni lee el formulario.
 */
export type GamePhase = 'idle' | 'tracking' | 'locked' | 'identified' | 'caught';

const MARGIN = 46;          // la mosca nunca se acerca más que esto al borde del panel
const FLEE_RADIUS = 150;    // distancia a la que empieza a huir del puntero
const LOCK_RADIUS = 72;     // distancia a la que el visor la fija
const HIT_MOUSE = 46;       // radio de captura con ratón / trackpad
const HIT_TOUCH = 64;       // radio de captura con el dedo
const SCAN_MS = 1300;       // tiempo para completar la identificación
const RESPAWN_MS = 1150;    // pausa tras una captura
const MAX_FX_NODES = 48;    // tope de partículas vivas a la vez

type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function useFlyGame() {
  const panelRef = useRef<HTMLElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [captures, setCaptures] = useState(0);

  useEffect(() => {
    const panel = panelRef.current;
    const fxBox = fxRef.current;
    if (!panel) return undefined;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduce = !!motionQuery?.matches;
    const onMotionChange = (e: MediaQueryListEvent) => { reduce = e.matches; };
    motionQuery?.addEventListener?.('change', onMotionChange);

    const size = { w: panel.clientWidth, h: panel.clientHeight };
    const s = {
      p: null as Pt | null, v: { x: 0, y: 0 }, rot: 0,
      mouse: null as Pt | null, pointer: 'mouse' as string, r: null as Pt | null,
      goal: null as Pt | null, goalUntil: 0, stamina: 1, lock: 0,
      caught: false, caughtAt: 0, last: 0, ui: 'idle' as GamePhase, coords: '',
    };
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };

    const clampToPanel = (pt: Pt): Pt => ({
      x: Math.max(MARGIN, Math.min(Math.max(MARGIN, size.w - MARGIN), pt.x)),
      y: Math.max(MARGIN, Math.min(Math.max(MARGIN, size.h - MARGIN), pt.y)),
    });
    const randomPoint = (): Pt => clampToPanel({ x: rand(MARGIN, size.w - MARGIN), y: rand(MARGIN, size.h - MARGIN) });
    const pickGoal = (t: number) => { s.goal = randomPoint(); s.goalUntil = t + rand(1800, 4200); };
    const setUi = (ph: GamePhase) => { if (s.ui !== ph) { s.ui = ph; setPhase(ph); } };

    /* ---------- efectos (Web Animations API: se limpian solos) ---------- */
    const spawnFx = (cls: string, at: Pt, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      const box = fxRef.current;
      if (!box || box.childElementCount >= MAX_FX_NODES || typeof Element.prototype.animate !== 'function') return;
      const el = document.createElement('span');
      el.className = cls;
      el.style.left = `${at.x}px`;
      el.style.top = `${at.y}px`;
      box.appendChild(el);
      const anim = el.animate(frames, { fill: 'forwards', ...opts });
      anim.onfinish = () => el.remove();
      anim.oncancel = () => el.remove();
    };
    const burst = (at: Pt) => {
      if (reduce) return;
      spawnFx('sg-fx-ring', at, [{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(1.9)', opacity: 0 }], { duration: 560, easing: 'cubic-bezier(.2,.7,.3,1)' });
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand(-0.25, 0.25);
        const d = rand(38, 78);
        spawnFx(i % 3 === 0 ? 'sg-fx-dot sg-fx-dot--warm' : 'sg-fx-dot', at, [
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.15)`, opacity: 0 },
        ], { duration: rand(480, 760), easing: 'cubic-bezier(.15,.7,.3,1)' });
      }
    };
    const miss = (at: Pt) => {
      if (reduce) return;
      spawnFx('sg-fx-miss', at, [{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0.55 }, { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 0 }], { duration: 380, easing: 'ease-out' });
    };

    /* ---------- captura y reaparición ---------- */
    const capture = (t: number) => {
      if (!s.p || s.caught) return;
      s.caught = true; s.caughtAt = t; s.v = { x: 0, y: 0 }; s.lock = 1;
      flyRef.current?.classList.add('is-caught');
      flyRef.current?.classList.remove('is-flying');
      burst(s.p);
      setCaptures(c => c + 1);
      setUi('caught');
    };
    const respawn = (t: number) => {
      let best = randomPoint();
      if (s.mouse) {
        for (let i = 0; i < 14 && dist(best, s.mouse) < 220; i++) best = randomPoint();
      }
      s.p = best; s.caught = false; s.stamina = 1; s.lock = 0; s.v = { x: rand(-1, 1), y: rand(-1, 1) };
      pickGoal(t);
      const fly = flyRef.current;
      if (fly) {
        fly.classList.remove('is-caught');
        fly.classList.add('is-spawning');
        later(() => fly.classList.remove('is-spawning'), 450);
      }
    };

    /* ---------- puntero (solo dentro del panel verde) ---------- */
    const local = (e: PointerEvent): Pt => { const r = panel.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const onMove = (e: PointerEvent) => {
      const pt = local(e);
      s.mouse = pt; s.pointer = e.pointerType;
      panel.style.setProperty('--mx', `${pt.x}px`);
      panel.style.setProperty('--my', `${pt.y}px`);
      panel.classList.add('is-pointer-in');
    };
    const onLeave = () => { s.mouse = null; panel.classList.remove('is-pointer-in'); };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const pt = local(e);
      if (e.pointerType !== 'touch') { s.mouse = pt; s.pointer = e.pointerType; }
      const hit = e.pointerType === 'touch' ? HIT_TOUCH : HIT_MOUSE;
      if (s.p && !s.caught && dist(pt, s.p) <= hit) capture(performance.now());
      else miss(pt);
    };
    panel.addEventListener('pointermove', onMove);
    panel.addEventListener('pointerleave', onLeave);
    panel.addEventListener('pointercancel', onLeave);
    panel.addEventListener('pointerdown', onDown);

    /* ---------- tamaño real del panel ---------- */
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      size.w = panel.clientWidth; size.h = panel.clientHeight;
      if (s.p) s.p = clampToPanel(s.p);
      if (s.goal) s.goal = clampToPanel(s.goal);
    }) : null;
    ro?.observe(panel);

    /* ---------- bucle de animación ---------- */
    let raf = 0;
    let onScreen = true;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(50, s.last ? t - s.last : 16.7);
      s.last = t;
      const k = dt / 16.7;
      const { w, h } = size;
      if (w < 2 * MARGIN || h < 2 * MARGIN) return;
      if (!s.p) { s.p = clampToPanel({ x: w * 0.7, y: h * 0.62 }); pickGoal(t); }

      const m = s.mouse;
      const dm = m && s.p ? dist(m, s.p) : Infinity;
      let speed = 0;

      if (s.caught) {
        if (t - s.caughtAt > (reduce ? 600 : RESPAWN_MS)) respawn(t);
      } else if (!reduce) {
        if (!s.goal || t > s.goalUntil || dist(s.goal, s.p) < 24) pickGoal(t);
        let ax = (s.goal!.x - s.p.x) * 0.0032;
        let ay = (s.goal!.y - s.p.y) * 0.0032;
        const fleeing = dm < FLEE_RADIUS;
        if (fleeing && m) {
          const f = 1 - dm / FLEE_RADIUS;
          const strength = 1.15 * f * (0.3 + 0.7 * s.stamina);
          const ux = (s.p.x - m.x) / (dm || 1);
          const uy = (s.p.y - m.y) / (dm || 1);
          ax += ux * strength; ay += uy * strength;
          // Cerca de una pared, desliza en paralelo para no quedar pegada a la esquina.
          if (s.p.x < MARGIN + 30 || s.p.x > w - MARGIN - 30) ay += Math.sign(uy || 1) * strength * 0.6;
          if (s.p.y < MARGIN + 30 || s.p.y > h - MARGIN - 30) ax += Math.sign(ux || 1) * strength * 0.6;
          s.stamina = Math.max(0, s.stamina - 0.0065 * k);
          if (t > s.goalUntil - 900) { s.goal = clampToPanel({ x: s.p.x + ux * 220, y: s.p.y + uy * 220 }); s.goalUntil = t + 1200; }
        } else {
          s.stamina = Math.min(1, s.stamina + 0.0045 * k);
        }
        const sec = t / 1000;
        const wob = Math.min(1, dist(s.goal!, s.p) / 120) * 0.22;
        ax += Math.sin(sec * 6.1) * wob; ay += Math.cos(sec * 4.7) * wob;

        s.v.x = (s.v.x + ax * k) * Math.pow(0.9, k);
        s.v.y = (s.v.y + ay * k) * Math.pow(0.9, k);
        const cap = 3.6 + (fleeing ? 3.4 * s.stamina : 0);
        speed = Math.hypot(s.v.x, s.v.y);
        if (speed > cap) { s.v.x *= cap / speed; s.v.y *= cap / speed; speed = cap; }

        const next = { x: s.p.x + s.v.x * k, y: s.p.y + s.v.y * k };
        const clamped = clampToPanel(next);
        if (clamped.x !== next.x) s.v.x *= -0.4;
        if (clamped.y !== next.y) s.v.y *= -0.4;
        s.p = clamped;
        if (speed > 0.5) {
          const heading = (Math.atan2(s.v.y, s.v.x) * 180) / Math.PI + 90;
          const diff = ((heading - s.rot + 540) % 360) - 180;
          s.rot += diff * Math.min(1, 0.12 * k);
        }
      }

      const finePointer = !!m && s.pointer !== 'touch';
      const near = finePointer && !s.caught && dm < LOCK_RADIUS;
      if (!s.caught) s.lock = near ? Math.min(1, s.lock + dt / SCAN_MS) : Math.max(0, s.lock - dt / 450);
      setUi(s.caught ? 'caught' : near ? (s.lock >= 1 ? 'identified' : 'locked') : m ? 'tracking' : 'idle');

      // Visor: sigue al puntero sin desfasarse del punto real de clic.
      if (finePointer && m) {
        if (!s.r) s.r = { ...m };
        const f = Math.min(1, 0.55 * k);
        s.r.x += (m.x - s.r.x) * f; s.r.y += (m.y - s.r.y) * f;
      }

      /* ---- escritura directa en el DOM ---- */
      const fly = flyRef.current;
      if (fly && s.p) {
        fly.style.transform = `translate3d(${s.p.x}px, ${s.p.y}px, 0) rotate(${s.rot}deg)`;
        fly.classList.toggle('is-flying', !reduce && !s.caught && speed > 0.3);
      }
      const ret = reticleRef.current;
      if (ret) {
        if (s.r) ret.style.transform = `translate3d(${s.r.x}px, ${s.r.y}px, 0) scale(${near ? 1.18 : 1})`;
        ret.style.opacity = finePointer ? '1' : '0';
        ret.dataset.state = s.caught ? 'done' : near ? (s.lock >= 1 ? 'done' : 'locked') : 'free';
      }
      const card = cardRef.current;
      if (card && s.p) {
        const cw = card.offsetWidth || 230; const ch = card.offsetHeight || 110;
        const lx = s.p.x + 70 + cw > w - 12 ? s.p.x - 70 - cw : s.p.x + 70;
        const ly = Math.max(12, Math.min(h - ch - 12, s.p.y - ch / 2));
        card.style.transform = `translate3d(${Math.max(12, lx)}px, ${ly}px, 0)`;
        card.style.opacity = near || s.caught ? '1' : '0';
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${s.caught ? 1 : s.lock})`;
      const coords = coordsRef.current;
      if (coords) {
        const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, '0');
        const txt = `X ${pad(m ? m.x : 0)} · Y ${pad(m ? m.y : 0)}`;
        if (txt !== s.coords) { s.coords = txt; coords.textContent = txt; }
      }
    };

    const start = () => { if (!raf && onScreen && !document.hidden) { s.last = 0; raf = requestAnimationFrame(tick); } };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start(); else stop();
    }) : null;
    io?.observe(panel);
    start();

    return () => {
      stop();
      timers.forEach(id => window.clearTimeout(id));
      timers.clear();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery?.removeEventListener?.('change', onMotionChange);
      panel.removeEventListener('pointermove', onMove);
      panel.removeEventListener('pointerleave', onLeave);
      panel.removeEventListener('pointercancel', onLeave);
      panel.removeEventListener('pointerdown', onDown);
      ro?.disconnect();
      io?.disconnect();
      fxBox?.replaceChildren();
    };
  }, []);

  return { panelRef, flyRef, reticleRef, cardRef, barRef, coordsRef, fxRef, phase, captures };
}
