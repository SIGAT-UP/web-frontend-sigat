import { useId } from 'react';

const SHAPE = 'M0,-5 C18,-15 50,-22 74,-16 C88,-12 94,0 86,10 C74,22 30,20 0,6 Z';
const COLS = [12, 20, 28, 36, 44, 52, 60, 68, 76, 84];

/** Mosca Ceratitis capitata con el estilo del isotipo SIGAT (alas con celdas y trazas). */
export default function FlyE({ size = 96 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  const clip = `sg-clip-${uid}`;
  const wing = `sg-wing-${uid}`;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}><path d={SHAPE} /></clipPath>
      </defs>

      <g className="wr">
        <g id={wing} transform="translate(114,88) rotate(30)">
          <path d={SHAPE} fill="#1F6B43" />
          <g clipPath={`url(#${clip})`}>
            <path d="M14,-30 L64,-30 L62,-12 C46,-14 30,-11 16,-7 Z" fill="#2E7D4F" />
            <path d="M34,-30 L46,-30 L60,30 L45,30 Z" fill="#FFF3D6" />
            <path d="M64,-30 L74,-30 L84,30 L71,30 Z" fill="#2E7D4F" />
            <g stroke="#1F6B43" strokeWidth="1.8">
              {COLS.map(x => <line key={x} x1={x} y1="-30" x2={x} y2="30" />)}
              <line x1="0" y1="-9" x2="92" y2="-9" />
            </g>
          </g>
          <g fill="none" stroke="#E6F2EA" strokeWidth="1.1" strokeLinejoin="round">
            <path d="M3,0 L30,-4 L58,-4 L84,0" />
            <path d="M4,4 L34,9 L62,12 L80,12" />
          </g>
          <g fill="#F6F7F6">
            <circle cx="30" cy="-4" r="2" /><circle cx="58" cy="-4" r="2" />
            <circle cx="34" cy="9" r="2" /><circle cx="62" cy="12" r="2" />
          </g>
          <path d={SHAPE} fill="none" stroke="#E6F2EA" strokeWidth="1.8" strokeLinejoin="round" />
        </g>
      </g>
      <g className="wl"><use href={`#${wing}`} transform="translate(200,0) scale(-1,1)" /></g>

      <rect x="86" y="116" width="28" height="50" rx="14" fill="#8A5A00" stroke="#E6F2EA" strokeWidth="1.2" />
      <rect x="86" y="130" width="28" height="3.5" fill="#FFF3D6" />
      <rect x="87" y="145" width="26" height="3.5" fill="#FFF3D6" />
      <polygon points="92,109 108,109 100,119" fill="#2E7D4F" />
      <polygon points="100,70 117.3,80 117.3,100 100,110 82.7,100 82.7,80" fill="#1C2620" stroke="#E6F2EA" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M92,82 L100,88 L108,82 M100,88 L100,103 M92,96 L100,103 L108,96" fill="none" stroke="#E6F2EA" strokeWidth=".9" />
      <g fill="#F6F7F6">
        <circle cx="92" cy="82" r="2.4" /><circle cx="108" cy="82" r="2.4" /><circle cx="100" cy="88" r="2" />
        <circle cx="92" cy="96" r="2.4" /><circle cx="108" cy="96" r="2.4" /><circle cx="100" cy="103" r="2" />
      </g>
      <rect x="84" y="55" width="32" height="15" rx="7.5" fill="#FFF3D6" stroke="#0F3D2A" strokeWidth="1.2" />
      <circle cx="88" cy="62" r="8.5" fill="#B42318" />
      <circle cx="112" cy="62" r="8.5" fill="#B42318" />
      <circle cx="88" cy="62" r="4" fill="none" stroke="#F6F7F6" strokeWidth="1.2" />
      <circle cx="112" cy="62" r="4" fill="none" stroke="#F6F7F6" strokeWidth="1.2" />
      <g stroke="#E6F2EA" strokeWidth="1.6" strokeLinecap="round">
        <path d="M96,54 L91,44" /><path d="M104,54 L109,44" />
      </g>
      <path d="M91,35 L94.5,40 L91,45 L87.5,40 Z" fill="#2E7D4F" />
      <path d="M109,35 L112.5,40 L109,45 L105.5,40 Z" fill="#2E7D4F" />
    </svg>
  );
}
