"use client";

import { useMemo } from "react";
import { Sprite } from "@/components/sprites/Sprite";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { NoSignalGlyph, StateMessage } from "@/components/ui/StateMessage";
import { compass } from "@/lib/geo/mercator";
import { displayName, type Spawn } from "@/lib/inat/spawns";
import { cellHash } from "@/lib/map/paint";

export const RANGES = [100, 250, 500] as const;
export type Range = (typeof RANGES)[number];

interface RadarDrawerProps {
  spawns: Spawn[];
  range: Range;
  onRange: (r: Range) => void;
  status: "loading" | "ready" | "error" | "idle";
  onRetry: () => void;
  onClose: () => void;
  onSelect: (s: Spawn) => void;
  selectedId: string | null;
}

const DISC = 300;
const BUBBLE = 52;

/** Radar drawer (Screen · Map · Radar Open v2): north-up sweep of creatures within range. */
export function RadarDrawer({ spawns, range, onRange, status, onRetry, onClose, onSelect, selectedId }: RadarDrawerProps) {
  const inRange = spawns.filter((s) => s.distanceM <= range);
  const nearest = inRange.find((s) => s.id === selectedId) ?? inRange[0];
  const state = status === "error" ? "NO CONNECTION" : status === "ready" && inRange.length === 0 ? "NOTHING FOUND" : "SWEEPING";

  return (
    <section
      aria-label="Radar"
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[calc(100%-120px)] flex-col overflow-y-auto border-t-[3px] border-ink bg-paper px-4 pb-4"
    >
      <button type="button" onClick={onClose} aria-label="Close radar" className="mx-auto flex h-6 w-24 items-center justify-center">
        <span className="h-1.5 w-14 bg-alt-dusk" />
      </button>

      <header className="flex items-center gap-2.5 pb-3">
        <PixelIcon name="radar" size={26} className="text-ink" />
        <h2 className="flex-1 font-display text-base text-ink">RADAR</h2>
        <button type="button" onClick={onClose} className="flex items-center gap-2 py-2 font-ui text-[10px] tracking-[2px]">
          <span className={state === "SWEEPING" ? "text-rust" : "text-stone"}>{state}</span>
          <span className="font-display text-xs text-ink">v</span>
        </button>
      </header>

      {status === "error" ? (
        <div className="flex justify-center py-8">
          <StateMessage
            icon={<NoSignalGlyph />}
            title="CAN'T REACH iNATURALIST"
            body="The sweep needs the observation database and it isn't answering. Your dex and your saved notes still work without it."
            action={{ label: "TRY AGAIN", onClick: onRetry }}
            alt={{ label: "OPEN THE DEX INSTEAD", href: "/dex" }}
          />
        </div>
      ) : (
        <>
          <RadarDisc spawns={inRange} range={range} onSelect={onSelect} sweeping={status !== "ready" || inRange.length > 0} />

          <div role="radiogroup" aria-label="Range" className="mt-4 flex border-[3px] border-ink">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={r === range}
                onClick={() => onRange(r)}
                className={`h-9 flex-1 font-display text-xs ${r === range ? "bg-ink text-sun" : "bg-paper text-ink"}`}
              >
                {r}m
              </button>
            ))}
          </div>

          {nearest ? (
            <CreatureRow spawn={nearest} onClick={() => onSelect(nearest)} className="mt-3" />
          ) : status === "ready" ? (
            <div className="mt-3 border-2 border-shell-edge p-3">
              <p className="font-body text-[13px] text-ink">Nothing logged within {range}m.</p>
              {range < 500 && (
                <button type="button" onClick={() => onRange(500)} className="mt-2 font-ui text-[10px] tracking-[1px] text-moss">
                  WIDEN TO 500m ▸
                </button>
              )}
            </div>
          ) : (
            <p className="mt-3 text-center font-ui text-[10px] tracking-[2px] text-stone">SCANNING…</p>
          )}
        </>
      )}
    </section>
  );
}

function RadarDisc({ spawns, range, onSelect, sweeping }: { spawns: Spawn[]; range: number; onSelect: (s: Spawn) => void; sweeping: boolean }) {
  const R = DISC / 2;
  // Decorative terrain flecks (pixel tufts and ripples), stable across renders.
  const flecks = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const h = cellHash(i, 7);
        const a = (h % 360) * (Math.PI / 180);
        const d = ((h >>> 9) % 1000) / 1000;
        const r = Math.sqrt(d) * (R - 14);
        return { x: R + Math.cos(a) * r, y: R + Math.sin(a) * r, kind: h % 3 };
      }),
    [R],
  );

  return (
    <div className="relative mx-auto shrink-0" style={{ width: DISC, height: DISC }}>
      <svg viewBox={`0 0 ${DISC} ${DISC}`} className="absolute inset-0" aria-hidden shapeRendering="crispEdges">
        <circle cx={R} cy={R} r={R - 2} fill="var(--radar-bg)" stroke="var(--ink)" strokeWidth={4} />
        {flecks.map((f, i) =>
          f.kind === 0 ? (
            <rect key={i} x={f.x} y={f.y} width={12} height={6} fill="var(--radar-ripple)" />
          ) : (
            <g key={i} fill="var(--radar-tuft)">
              <rect x={f.x} y={f.y} width={6} height={12} />
              <rect x={f.x + 6} y={f.y + 6} width={6} height={6} />
            </g>
          ),
        )}
        <circle cx={R} cy={R} r={R * 0.48} fill="none" stroke="var(--radar-ring)" strokeWidth={2} />
        <circle cx={R} cy={R} r={R * 0.72} fill="none" stroke="var(--radar-ring)" strokeWidth={2} />
      </svg>

      {sweeping && <div className="radar-sweep absolute inset-[4px] rounded-full" aria-hidden />}

      {/* You: rust diamond at the centre. */}
      <svg viewBox="0 0 6 6" width={30} height={30} className="absolute" style={{ left: R - 15, top: R - 15 }} shapeRendering="crispEdges" aria-hidden>
        <path fill="var(--ink-deep)" d="M2 0h2v1h-2z M1 1h1v1h-1z M4 1h1v1h-1z M0 2h1v2h-1z M5 2h1v2h-1z M1 4h1v1h-1z M4 4h1v1h-1z M2 5h2v1h-2z" />
        <path fill="var(--rust)" d="M2 1h2v1h-2z M1 2h4v2h-4z M2 4h2v1h-2z" />
      </svg>

      {layoutBubbles(spawns, range, R).map(({ s, x, y }) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s)}
          aria-label={`${displayName(s)}, ${Math.round(s.distanceM)} metres ${compass(s.bearing)}`}
          className="absolute flex items-center justify-center rounded-full border-[3px] border-ink bg-[var(--radar-bubble)]"
          style={{ width: BUBBLE, height: BUBBLE, left: x - BUBBLE / 2, top: y - BUBBLE / 2 }}
        >
          <Sprite sprite={s.sprite} size={36} />
        </button>
      ))}
    </div>
  );
}

const MAX_BUBBLES = 12;

/** Place bubbles by bearing and distance, then nudge overlapping ones apart so each stays tappable. */
function layoutBubbles(spawns: Spawn[], range: number, R: number) {
  const limit = R - BUBBLE / 2 - 4;
  const pts = spawns.slice(0, MAX_BUBBLES).map((s) => {
    const d = Math.min(1, s.distanceM / range) * limit;
    const a = ((s.bearing - 90) * Math.PI) / 180;
    return { s, x: R + Math.cos(a) * d, y: R + Math.sin(a) * d };
  });
  const gap = BUBBLE - 4;
  for (let iter = 0; iter < 40; iter++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist >= gap) continue;
        if (dist < 0.01) {
          // Same spot: fan out along a stable angle.
          const t = (j * 2.4) % (Math.PI * 2);
          dx = Math.cos(t);
          dy = Math.sin(t);
          dist = 1;
        }
        const push = (gap - dist) / 2;
        a.x -= (dx / dist) * push;
        a.y -= (dy / dist) * push;
        b.x += (dx / dist) * push;
        b.y += (dy / dist) * push;
        moved = true;
      }
    }
    for (const p of pts) {
      const r = Math.hypot(p.x - R, p.y - R);
      if (r > limit) {
        p.x = R + ((p.x - R) / r) * limit;
        p.y = R + ((p.y - R) / r) * limit;
      }
    }
    if (!moved) break;
  }
  return pts;
}

export function CreatureRow({ spawn, onClick, className = "" }: { spawn: Spawn; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 border-2 border-shell-edge bg-paper px-[9px] py-[7px] text-left ${className}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center border-2 border-ink bg-lcd-bg">
        <Sprite sprite={spawn.sprite} size={36} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-display text-[11px] text-ink">{displayName(spawn)}</span>
        <span className="truncate font-ui text-[9px] text-stone">
          {(spawn.taxon.iconic ?? "LIFE").toUpperCase()} · {spawn.taxon.name}
        </span>
      </span>
      <span className="shrink-0 font-ui text-[11px] text-moss">
        {Math.round(spawn.distanceM)}m {compass(spawn.bearing)}
      </span>
    </button>
  );
}
