"use client";

/**
 * The Shank Auto Repair shield badge — a vector recreation of the shop's
 * physical sign: a white route-style shield (horned top corners, waisted
 * sides, round-tipped point, a mounting bolt near the tip) with a black
 * pinstripe, holding a brushed-steel oval; SHANK arched across the oval top
 * in chunky rounded navy letters; crossed wrenches (open jaws up, ring ends
 * down) over a navy gear hub; and a white AUTO REPAIR ribbon with
 * swallowtail ends.
 *
 * Letterforms are drawn as round-capped strokes rather than text so the
 * mark renders identically everywhere and every part stays animatable.
 *
 * `animate` runs the construction sequence (shield traces itself, face and
 * steel fade in, wrenches swing into the cross, SHANK stamps, the ribbon
 * pops, then a recurring sheen). Off, it renders the finished badge.
 * Honors prefers-reduced-motion via the CSS in globals.css.
 */

type Props = {
  animate?: boolean;
  className?: string;
};

/** Sign ink: the sign's indigo navy, darker than the site's steel blue. */
const NAVY = "#333e8e";
const NAVY_DARK = "#262e6d";
const OUTLINE = "#14161c";

/** Shield silhouette, drawn clockwise from the left horn. */
const SHIELD =
  "M20 30 C46 40 72 42 100 42 C128 42 154 40 180 30 " +
  "C181 70 177 108 160 146 C148 172 126 194 100 214 " +
  "C74 194 52 172 40 146 C23 108 19 70 20 30 Z";

/** Black pinstripe just inside the white rim. */
const PINSTRIPE =
  "M26.5 38.5 C48 47 74 49 100 49 C126 49 152 47 173.5 38.5 " +
  "C173.5 72 169.5 106 154.5 142 C143.5 166.5 122 187 100 206 " +
  "C78 187 56.5 166.5 45.5 142 C30.5 106 26.5 72 26.5 38.5 Z";

/**
 * SHANK letter skeletons: each drawn upright in a box centered on (0,0),
 * ~30 tall, stroked thick with round caps for the sign's chunky rounded
 * letterforms. `angle` walks the letter along the arc over the oval.
 */
const LETTERS: { d: string; angle: number }[] = [
  // S
  { d: "M6.75 -10.5 C6.75 -15.5 -6.75 -15.5 -6.75 -8 C-6.75 -1 6.75 -1 6.75 6.5 C6.75 14.5 -6.75 14.5 -6.75 9.5", angle: -64 },
  // H
  { d: "M-6.75 -14.5 L-6.75 14.5 M6.75 -14.5 L6.75 14.5 M-6.75 0 L6.75 0", angle: -32 },
  // A
  { d: "M-8 14.5 L0 -14.5 L8 14.5 M-4 4.5 L4 4.5", angle: 0 },
  // N
  { d: "M-7.2 14.5 L-7.2 -14.5 L7.2 14.5 L7.2 -14.5", angle: 32 },
  // K
  { d: "M-6.75 -14.5 L-6.75 14.5 M6.75 -14.5 L-6.3 0.5 M-0.45 -3.5 L7.6 14.5", angle: 64 },
];

export default function ShankLogo({ animate = false, className = "" }: Props) {
  const a = animate ? "logo-anim" : "";
  return (
    <svg
      viewBox="0 0 200 230"
      role="img"
      aria-label="Shank Auto Repair shield logo"
      className={`${a} ${className}`.trim()}
    >
      <defs>
        {/* Brushed steel: soft radial glow with a horizontal grain overlay. */}
        <radialGradient id="steel" cx="0.5" cy="0.42" r="0.8">
          <stop offset="0" stopColor="#f0f2f4" />
          <stop offset="0.5" stopColor="#d3d8dc" />
          <stop offset="0.85" stopColor="#b4bac2" />
          <stop offset="1" stopColor="#99a1aa" />
        </radialGradient>
        <pattern id="brush" width="4" height="2.4" patternUnits="userSpaceOnUse">
          <rect width="4" height="0.8" y="0" fill="#ffffff" opacity="0.22" />
          <rect width="4" height="0.8" y="1.5" fill="#7e8790" opacity="0.12" />
        </pattern>
        {/* Chrome for the wrenches. */}
        <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f8fa" />
          <stop offset="0.45" stopColor="#cfd6dc" />
          <stop offset="0.6" stopColor="#aeb7c0" />
          <stop offset="1" stopColor="#e4e8ec" />
        </linearGradient>
        {/* The moving highlight for the recurring sheen sweep. */}
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="shieldClip">
          <path d={SHIELD} />
        </clipPath>
      </defs>

      {/* 1 — the shield outline traces itself */}
      <path
        className="logo-outline"
        d={SHIELD}
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.5"
        pathLength={1}
      />

      {/* 2 — white face, pinstripe, steel oval, gear hub */}
      <g className="logo-fill">
        <path d={SHIELD} fill="#ffffff" stroke={OUTLINE} strokeWidth="2.5" />
        <path d={PINSTRIPE} fill="#ffffff" stroke={OUTLINE} strokeWidth="2" />
        <ellipse cx="100" cy="121" rx="64" ry="70" fill="url(#steel)" stroke="#8d959d" strokeWidth="1" />
        <ellipse cx="100" cy="121" rx="64" ry="70" fill="url(#brush)" />
        {/* mounting bolt near the tip */}
        <circle cx="100" cy="200" r="2.8" fill={OUTLINE} />
        {/* navy gear hub behind the wrench cross */}
        <g>
          <circle cx="100" cy="124" r="25.5" fill="#2e3880" stroke={NAVY_DARK} strokeWidth="1.5" />
          {/* gear teeth: a fat dashed ring around the disc */}
          <circle
            cx="100"
            cy="124"
            r="28"
            fill="none"
            stroke="#2e3880"
            strokeWidth="4.5"
            strokeDasharray="4.4 4.77"
          />
          <circle cx="100" cy="124" r="18" fill="none" stroke="#58629f" strokeWidth="1.2" strokeOpacity="0.7" />
          {/* small hub rings on the vertical axis */}
          {[96, 134].map((y) => (
            <g key={y}>
              <circle cx="100" cy={y} r="6.5" fill="url(#chrome)" stroke={NAVY_DARK} strokeWidth="1.5" />
              <circle cx="100" cy={y} r="2.4" fill={NAVY_DARK} />
            </g>
          ))}
        </g>
      </g>

      {/* 3 — wrenches swing into the cross */}
      <g clipPath="url(#shieldClip)">
        <g className="logo-wrench logo-wrench--l">
          <Wrench />
        </g>
        <g className="logo-wrench logo-wrench--r">
          <Wrench flip />
        </g>
      </g>

      {/* 4 — SHANK stamps in, arched over the oval */}
      <g
        className="logo-word"
        fill="none"
        stroke={NAVY}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {LETTERS.map(({ d, angle }) => (
          <g key={angle} transform={`rotate(${angle} 100 134)`}>
            <path d={d} transform="translate(100 75)" />
          </g>
        ))}
      </g>

      {/* 5 — AUTO REPAIR ribbon pops in */}
      <g className="logo-banner">
        <path
          d="M54 140 L146 140 L154 143 L149 152 L154 161 L146 164 L54 164 L46 161 L51 152 L46 143 Z"
          fill="#ffffff"
          stroke={NAVY_DARK}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <text
          x="100"
          y="157.5"
          textAnchor="middle"
          fontFamily="'Barlow Condensed', 'Arial Narrow', sans-serif"
          fontWeight="700"
          fontSize="16"
          letterSpacing="1.2"
          fill={NAVY}
        >
          AUTO REPAIR
        </text>
      </g>

      {/* 6 — recurring chrome sheen, clipped to the shield */}
      {animate && (
        <g clipPath="url(#shieldClip)">
          <rect
            className="logo-sheen"
            x="-70"
            y="0"
            width="60"
            height="230"
            fill="url(#sheen)"
            transform="skewX(-18)"
          />
        </g>
      )}
    </svg>
  );
}

/**
 * One chrome wrench pointing 12→6 o'clock through (100,140): open jaw up,
 * ring end down. The two instances rotate ±45° to form the X — the photo's
 * jaws sit top-left/top-right, rings bottom-left/bottom-right.
 */
function Wrench({ flip = false }: { flip?: boolean }) {
  return (
    <g
      transform={flip ? "translate(200 0) scale(-1 1)" : undefined}
      fill="url(#chrome)"
      stroke={NAVY_DARK}
      strokeWidth="1.6"
    >
      <g transform="rotate(40 100 124)">
        {/* shaft */}
        <rect x="95.6" y="88" width="8.8" height="82" rx="4" />
        {/* open-end jaw, opening tilted off-axis like a real wrench */}
        <g transform="rotate(24 100 88)">
          <path d="M91.9 80.5 A13.5 13.5 0 1 0 108.1 80.5 L104.3 85.9 A7.4 7.4 0 1 1 95.7 85.9 Z" />
        </g>
        {/* ring end */}
        <path
          fillRule="evenodd"
          d="M100 168.5 A11.5 11.5 0 1 0 100 191.5 A11.5 11.5 0 1 0 100 168.5 Z
             M100 174.5 A5.5 5.5 0 1 1 100 185.5 A5.5 5.5 0 1 1 100 174.5 Z"
        />
      </g>
    </g>
  );
}
