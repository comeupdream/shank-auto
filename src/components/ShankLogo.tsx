"use client";

/**
 * The Shank Auto Repair shield badge, recreated as inline SVG from the
 * current shankautorepair.com logo (chrome shield, SHANK across the middle,
 * crossed open-end wrenches, AUTO REPAIR oval underneath).
 *
 * The real image file couldn't be pulled from the live site (network egress
 * is blocked in the build environment), so this is a faithful vector
 * recreation — which is also what makes the procedural animation possible:
 * every part is a path, so the badge can build itself.
 *
 * `animate` runs the construction sequence (shield traces itself, chrome
 * fills, wrenches swing into the cross, lettering stamps in, then a slow
 * recurring sheen). Off, it renders the finished badge — used in the header
 * so the animation stays a hero moment. Honors prefers-reduced-motion via
 * the CSS in globals.css (all steps jump to their final state).
 */

type Props = {
  animate?: boolean;
  className?: string;
};

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
        {/* Brushed chrome: vertical gray ramp with hard mid-stops. */}
        <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset="0.35" stopColor="#c9d0d8" />
          <stop offset="0.5" stopColor="#aab3bd" />
          <stop offset="0.65" stopColor="#d8dde3" />
          <stop offset="1" stopColor="#9aa4af" />
        </linearGradient>
        <linearGradient id="chromeFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b95a1" />
          <stop offset="0.5" stopColor="#e6eaee" />
          <stop offset="1" stopColor="#727d89" />
        </linearGradient>
        {/* The moving highlight for the recurring sheen sweep. */}
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="shieldClip">
          <path d="M100 12 L166 32 C166 34 174 122 100 216 C26 122 34 34 34 32 Z" />
        </clipPath>
      </defs>

      {/* 1 — the shield outline traces itself */}
      <path
        className="logo-outline"
        d="M100 12 L166 32 C166 34 174 122 100 216 C26 122 34 34 34 32 Z"
        fill="none"
        stroke="#414b57"
        strokeWidth="3"
        pathLength={1}
      />

      {/* 2 — chrome frame + face fade in */}
      <g className="logo-fill">
        <path
          d="M100 12 L166 32 C166 34 174 122 100 216 C26 122 34 34 34 32 Z"
          fill="url(#chromeFrame)"
          stroke="#414b57"
          strokeWidth="3"
        />
        <path
          d="M100 24 L156 41 C156 43 163 118 100 198 C37 118 44 43 44 41 Z"
          fill="url(#chrome)"
          stroke="#5d6773"
          strokeWidth="1.5"
        />
      </g>

      {/* 3 — wrenches swing into the cross behind the wordmark */}
      <g clipPath="url(#shieldClip)">
        <g className="logo-wrench logo-wrench--l">
          <Wrench />
        </g>
        <g className="logo-wrench logo-wrench--r">
          <Wrench flip />
        </g>
      </g>

      {/* 4 — wordmark stamps in */}
      <g className="logo-word">
        <text
          x="100"
          y="112"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize="34"
          letterSpacing="1"
          fill="#1d2b3a"
          stroke="#f4f6f8"
          strokeWidth="0.6"
        >
          SHANK
        </text>
      </g>

      {/* 5 — AUTO REPAIR oval */}
      <g className="logo-banner">
        <ellipse
          cx="100"
          cy="146"
          rx="46"
          ry="14"
          fill="#dde2e8"
          stroke="#5d6773"
          strokeWidth="1.5"
        />
        <text
          x="100"
          y="150"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize="10.5"
          letterSpacing="1.5"
          fill="#1d2b3a"
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
 * A double-open-end wrench pointing 12→6 o'clock, centered on (100,118);
 * the two instances rotate ±45° to form the cross.
 */
function Wrench({ flip = false }: { flip?: boolean }) {
  return (
    <g
      transform={flip ? "translate(200 0) scale(-1 1)" : undefined}
      fill="#6e7987"
      stroke="#414b57"
      strokeWidth="1.2"
    >
      <g transform="rotate(45 100 118)">
        {/* shaft */}
        <rect x="96" y="60" width="8" height="116" rx="3.5" />
        {/* top jaw: annulus with the opening facing out along the shaft */}
        <path d="M93.1 50.2 A12 12 0 1 0 106.9 50.2 L103.4 55.1 A6 6 0 1 1 96.6 55.1 Z" />
        {/* bottom jaw, opposed */}
        <path d="M106.9 185.8 A12 12 0 1 0 93.1 185.8 L96.6 180.9 A6 6 0 1 1 103.4 180.9 Z" />
      </g>
    </g>
  );
}
