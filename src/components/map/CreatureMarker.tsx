import { Sprite } from "@/components/sprites/Sprite";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { displayName, type Spawn } from "@/lib/inat/spawns";

/** Marker tier per zoom (naturedex_design_system.pen › 09 · Map Engine, "ZOOM"). */
export type Tier = 1 | 2 | 3;
export const tierForZoom = (zoom: number): Tier | 0 => (zoom >= 19 ? 3 : zoom === 18 ? 2 : zoom === 17 ? 1 : 0);

const BOX: Record<Tier, { box: number; sprite: number; border: number }> = {
  1: { box: 24, sprite: 18, border: 2 },
  2: { box: 48, sprite: 36, border: 3 },
  3: { box: 72, sprite: 54, border: 3 },
};

interface CreatureMarkerProps {
  spawn: Spawn;
  tier: Tier;
  x: number;
  y: number;
  selected: boolean;
  onSelect: () => void;
}

/** Map Marker: paper box + sprite + tail; the tail tip sits on the sighting. */
export function CreatureMarker({ spawn, tier, x, y, selected, onSelect }: CreatureMarkerProps) {
  const { box, sprite, border } = BOX[tier];
  const tail = tier === 1 ? 0 : 10;
  const name = displayName(spawn);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${name}, ${Math.round(spawn.distanceM)} metres away`}
      className="absolute flex flex-col items-center"
      style={{ left: x, top: y, transform: `translate(-50%, -${tier === 1 ? box / 2 : box + tail}px)`, zIndex: selected ? 5 : 1 }}
    >
      <span
        className={`flex items-center justify-center border-ink ${selected ? "bg-sun" : "bg-paper"}`}
        style={{ width: box, height: box, borderWidth: border }}
      >
        <Sprite sprite={spawn.sprite} size={sprite} />
      </span>
      {tail > 0 && <PixelIcon name="tail" size={28} className="-mt-px text-ink" />}
      {tier === 3 && (
        <span className="mt-1 whitespace-nowrap border-2 border-ink bg-paper px-1.5 py-0.5 font-ui text-[9px] tracking-[1px] text-ink">
          {name.toUpperCase()}
        </span>
      )}
    </button>
  );
}

/** z16 · District: count badge for a group of nearby creatures. */
export function ClusterBadge({ count, x, y }: { count: number; x: number; y: number }) {
  return (
    <span
      className="absolute flex h-7 min-w-9 items-center justify-center border-[3px] border-ink bg-rust px-1.5 font-display text-xs text-paper"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
      aria-label={`${count} creatures`}
    >
      {count}
    </span>
  );
}
