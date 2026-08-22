/**
 * The photo-style hero band, drawn instead of photographed: a duotone navy
 * garage — coupe up on a two-post lift, mechanic underneath with a trouble
 * light, a ceiling lamp cone, floor reflection, and blueprint dimension
 * lines. Procedural and license-free; swap in real shop photography later
 * without touching the layout (the container just needs an <img>).
 */

const CAR =
  "M420 214 L420 196 L434 184 L488 178 L532 152 L622 149 L695 167 L762 179 L768 196 L768 214 " +
  "L738 214 A26 26 0 1 0 686 214 L502 214 A26 26 0 1 0 450 214 Z";

export default function GarageScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMid slice"
      aria-label="Illustration of the shop floor: a car raised on a two-post lift with a mechanic working underneath"
      className={className}
    >
      <defs>
        <linearGradient id="gs-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1729" />
          <stop offset="0.8" stopColor="#142943" />
          <stop offset="1" stopColor="#0e1f36" />
        </linearGradient>
        <radialGradient id="gs-lamp" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="#dbe9fb" stopOpacity="0.34" />
          <stop offset="0.55" stopColor="#dbe9fb" stopOpacity="0.10" />
          <stop offset="1" stopColor="#dbe9fb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gs-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a3c4e8" stopOpacity="0.16" />
          <stop offset="1" stopColor="#a3c4e8" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="420" fill="url(#gs-bg)" />

      {/* faint wall grid */}
      <g stroke="#a3c4e8" strokeOpacity="0.05">
        {Array.from({ length: 23 }, (_, i) => (
          <line key={`v${i}`} x1={i * 54} y1="0" x2={i * 54} y2="340" />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 54} x2="1200" y2={i * 54} />
        ))}
      </g>

      {/* ceiling lamp + cone */}
      <line x1="600" y1="0" x2="600" y2="34" stroke="#a3c4e8" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="578" y="34" width="44" height="12" rx="4" fill="#1d3552" stroke="#a3c4e8" strokeOpacity="0.5" />
      <polygon points="560,46 640,46 850,420 350,420" fill="url(#gs-lamp)" />

      {/* two-post lift */}
      <g stroke="#a3c4e8" strokeOpacity="0.75" strokeWidth="4" fill="#12233c">
        <rect x="330" y="96" width="26" height="248" rx="4" />
        <rect x="844" y="96" width="26" height="248" rx="4" />
      </g>
      <g stroke="#a3c4e8" strokeOpacity="0.55" strokeWidth="5">
        <line x1="356" y1="222" x2="470" y2="212" />
        <line x1="844" y1="222" x2="730" y2="212" />
      </g>

      {/* the car, rim-lit */}
      <path d={CAR} fill="#0d1c31" stroke="#a3c4e8" strokeOpacity="0.9" strokeWidth="2.5" strokeLinejoin="round" />
      <g fill="#0b1729" stroke="#a3c4e8" strokeOpacity="0.8" strokeWidth="2.5">
        <circle cx="476" cy="214" r="24" />
        <circle cx="712" cy="214" r="24" />
      </g>
      <g fill="none" stroke="#a3c4e8" strokeOpacity="0.45" strokeWidth="2">
        <circle cx="476" cy="214" r="11" />
        <circle cx="712" cy="214" r="11" />
        <path d="M536 180 L560 158 L618 156 L640 178" />
      </g>

      {/* mechanic under the car with a trouble light */}
      <g fill="#0a1526">
        <circle cx="594" cy="268" r="11" />
        <path d="M583 279 C580 300 580 306 583 340 L590 340 L593 306 L599 306 L602 340 L609 340 C611 306 611 300 606 279 C602 274 587 274 583 279 Z" />
        <path d="M604 282 L622 262 L628 268 L610 288 Z" />
      </g>
      <circle cx="630" cy="260" r="7" fill="#ffe9b8" opacity="0.95" />
      <circle cx="630" cy="260" r="14" fill="#ffe9b8" opacity="0.22" />

      {/* floor + reflection */}
      <line x1="0" y1="340" x2="1200" y2="340" stroke="#a3c4e8" strokeOpacity="0.35" strokeWidth="2" />
      <rect x="300" y="342" width="600" height="60" fill="url(#gs-floor)" />

      {/* blueprint dimension annotations */}
      <g stroke="#a3c4e8" strokeOpacity="0.5" fill="none">
        <line x1="420" y1="112" x2="768" y2="112" strokeDasharray="6 5" />
        <line x1="420" y1="104" x2="420" y2="120" />
        <line x1="768" y1="104" x2="768" y2="120" />
        <line x1="920" y1="149" x2="920" y2="340" strokeDasharray="6 5" />
        <line x1="912" y1="149" x2="928" y2="149" />
        <line x1="912" y1="340" x2="928" y2="340" />
      </g>
      <g fill="#a3c4e8" fillOpacity="0.75" fontFamily="ui-monospace, monospace" fontSize="15">
        <text x="570" y="102">2467</text>
        <text x="934" y="250">1720</text>
      </g>
    </svg>
  );
}
