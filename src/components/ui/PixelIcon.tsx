// Pixel icons copied from the .pen components (Tab Bar, Search Pill, Map Marker).
// Single-colour paths use currentColor so they follow text colour and tone.

const ICONS = {
  pin: { box: 12, d: "M4 1h4v2h-4z m-1 1h1v5h-1z m5 0h1v5h-1z m-6 1h1v3h-1z m2 0h1v1h-1z m3 0h1v1h-1z m2 0h1v3h-1z m-5 2h1v3h-1z m3 0h1v3h-1z m-2 1h2v4h-2z m1 4h1v1h-1z" },
  leaf: { box: 11, d: "M8 1h3v4h-3z m-2 1h2v5h-2z m-2 1h2v5h-2z m-2 1h2v5h-2z m-1 1h1v5h-1z m7 0h2v1h-2z m-8 1h1v4h-1z m8 0h1v1h-1z m-2 1h1v1h-1z m-2 1h1v1h-1z m-2 1h1v1h-1z" },
  dex: { box: 12, d: "M0 1h12v1h-12z m0 1h1v8h-1z m3 0h6v1h-6z m8 0h1v8h-1z m-9 1h1v5h-1z m7 0h1v5h-1z m-5 1h4v1h-4z m0 2h4v1h-4z m-1 2h6v2h-6z m-2 1h2v1h-2z m8 0h2v1h-2z" },
  radar: { box: 12, d: "M3 0h6v1h-6z m-2 1h2v1h-2z m8 0h2v1h-2z m-8 1h1v1h-1z m5 0h1v7h-1z m4 0h1v1h-1z m-10 1h1v5h-1z m11 0h1v5h-1z m-10 2h5v1h-5z m6 0h4v1h-4z m-6 3h1v2h-1z m9 0h1v2h-1z m-8 1h1v1h-1z m7 0h1v1h-1z m-6 1h6v1h-6z" },
  you: { box: 12, d: "M0 1h12v1h-12z m3 1h2v3h-2z m-3 2h3v1h-3z m5 0h7v1h-7z m3 1h2v3h-2z m-8 2h8v1h-8z m10 0h2v1h-2z m-5 1h2v3h-2z m-5 2h5v1h-5z m7 0h5v1h-5z" },
  tail: { box: 7, h: 4, d: "M0 0h7v1h-7z m1 1h5v1h-5z m1 1h3v1h-3z m1 1h1v1h-1z" },
} as const;

export type PixelIconName = keyof typeof ICONS;

export function PixelIcon({ name, size = 24, className }: { name: PixelIconName; size?: number; className?: string }) {
  const icon = ICONS[name];
  const h = "h" in icon ? icon.h : icon.box;
  return (
    <svg
      viewBox={`0 0 ${icon.box} ${h}`}
      width={size}
      height={(size * h) / icon.box}
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
    >
      <path d={icon.d} fill="currentColor" />
    </svg>
  );
}

/** "You Are Here" puck (32×32 in the design). */
export function PlayerPuck({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 8 8" width={size} height={size} shapeRendering="crispEdges" aria-hidden>
      <path fill="var(--ink-deep)" d="M2 0h4v1h-4z m-1 1h1v1h-1z m5 0h1v1h-1z m-6 1h1v4h-1z m7 0h1v4h-1z m-6 4h1v1h-1z m5 0h1v1h-1z m-4 1h4v1h-4z" />
      <path fill="var(--paper)" d="M2 1h4v1h-4z m-1 1h2v1h-2z m4 0h2v1h-2z m-4 1h1v3h-1z m5 0h1v3h-1z m-4 2h1v2h-1z m3 0h1v2h-1z m-2 1h2v1h-2z" />
      <path fill="var(--abyss)" d="M3 2h2v4h-2z m-1 1h1v2h-1z m3 0h1v2h-1z" />
    </svg>
  );
}

/** Heading cone that sits above the puck (24×12 in the design). */
export function HeadingCone({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 8 4" width={size} height={size / 2} shapeRendering="crispEdges" aria-hidden>
      <path
        fill="var(--abyss)"
        fillOpacity={0.55}
        d="M3 0h2v1h-2z m-1 1h1v1h-1z m1 0h2v3h-2z m2 0h1v1h-1z m-4 1h1v1h-1z m1 0h1v2h-1z m3 0h1v2h-1z m1 0h1v1h-1z m-6 1h1v1h-1z m1 0h1v1h-1z m5 0h1v1h-1z m1 0h1v1h-1z"
      />
    </svg>
  );
}
