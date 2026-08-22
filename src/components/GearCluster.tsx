/**
 * A meshing pair/trio of gears that actually turn — decorative, procedural,
 * and cheap. Teeth counts are chosen so the CSS rotation speeds mesh
 * plausibly (big gear 22s/rev, small counter-rotates faster). Rendered in
 * currentColor so each placement tints it; prefers-reduced-motion freezes
 * it via the CSS in globals.css.
 */

function Gear({
  cx,
  cy,
  r,
  teeth,
  spinClass,
}: {
  cx: number;
  cy: number;
  r: number;
  teeth: number;
  spinClass: string;
}) {
  const inner = r * 0.62;
  const toothDepth = r * 0.18;
  const step = (Math.PI * 2) / teeth;
  const half = step * 0.28;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const p = (ang: number, rad: number) =>
      `${(cx + Math.cos(ang) * rad).toFixed(2)} ${(cy + Math.sin(ang) * rad).toFixed(2)}`;
    d +=
      (i === 0 ? "M" : "L") +
      p(a - half, r) +
      " L" +
      p(a - half * 0.45, r + toothDepth) +
      " L" +
      p(a + half * 0.45, r + toothDepth) +
      " L" +
      p(a + half, r) +
      " A" +
      `${r} ${r} 0 0 1 ` +
      p(a + step - half, r);
  }
  d += "Z";
  return (
    <g className={spinClass} style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" }}>
      <path d={d} fill="currentColor" />
      <circle cx={cx} cy={cy} r={inner} fill="none" stroke="currentColor" strokeWidth={r * 0.16} strokeOpacity="0.55" />
      <circle cx={cx} cy={cy} r={r * 0.16} fill="currentColor" />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <circle
            key={i}
            cx={cx + Math.cos(a) * inner * 0.62}
            cy={cy + Math.sin(a) * inner * 0.62}
            r={r * 0.1}
            fill="currentColor"
            fillOpacity="0.5"
          />
        );
      })}
    </g>
  );
}

export default function GearCluster({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" aria-hidden className={className}>
      <Gear cx={72} cy={78} r={46} teeth={14} spinClass="gear-spin" />
      <Gear cx={144} cy={110} r={28} teeth={9} spinClass="gear-spin-rev" />
      <Gear cx={146} cy={40} r={20} teeth={7} spinClass="gear-spin-rev-slow" />
    </svg>
  );
}
