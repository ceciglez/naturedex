"use client";

import { Sprite } from "@/components/sprites/Sprite";
import { RARITY_LABEL } from "@/components/ui/Chip";
import type { DexEntry } from "@/lib/dex/store";
import { displayName, type Spawn } from "@/lib/inat/spawns";
import type { TaxonDetails } from "@/lib/inat/types";

const SPARKLES = [
  { c: "+", x: 12, y: 16, s: 18, col: "text-moss" },
  { c: "✦", x: 84, y: 18, s: 12, col: "text-rust" },
  { c: "+", x: 50, y: 8, s: 12, col: "text-moss" },
  { c: "✦", x: 25, y: 36, s: 10, col: "text-rust" },
  { c: "+", x: 76, y: 52, s: 10, col: "text-moss" },
  { c: "✦", x: 86, y: 78, s: 18, col: "text-rust" },
  { c: "+", x: 14, y: 82, s: 12, col: "text-moss" },
];

export const dexNo = (n: number) => `NO. ${String(n).padStart(3, "0")}`;

/** Screen · New Species v2: shown the first time a species is observed. */
export function NewSpecies({
  spawn,
  entry,
  details,
  biome,
  onDone,
}: {
  spawn: Spawn;
  entry: DexEntry;
  details?: TaxonDetails;
  biome: string | null;
  onDone: () => void;
}) {
  const name = displayName(spawn);
  const lineage = details?.lineage.filter((l) => l.rank !== "genus" && l.rank !== spawn.taxon.rank).map((l) => l.name);
  const first = new Date(entry.firstSeen);
  const stats: [string, string][] = [
    ["RARITY", RARITY_LABEL[entry.rarity]],
    ["BIOME", biome ?? "—"],
    ["OBS. NEARBY", details ? details.nearbyCount.toLocaleString("en") : "—"],
    ["FIRST SEEN", `TODAY ${first.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`],
  ];

  return (
    <div role="dialog" aria-label={`New species: ${name}`} className="absolute inset-0 z-40 flex flex-col overflow-y-auto bg-cloud px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))]">
      <div className="relative aspect-[358/356] w-full shrink-0 overflow-hidden border-[3px] border-ink bg-lime">
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            aria-hidden
            className={`sparkle absolute font-ui ${s.col}`}
            style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.s, animationDelay: `${i * 0.25}s` }}
          >
            {s.c}
          </span>
        ))}
        <p className="absolute inset-x-0 top-[12%] text-center font-display text-[22px] text-ink">NEW SPECIES!</p>
        <div className="absolute inset-0 flex items-center justify-center pt-[12%]">
          <span className="absolute bottom-[19%] h-6 w-40 rounded-[50%] bg-ink/25" aria-hidden />
          <Sprite sprite={spawn.sprite} size={216} title={name} className="creature-idle relative" />
        </div>
      </div>

      <p className="mt-5 text-center font-ui text-[11px] tracking-[4px] text-moss">DEX {dexNo(entry.dexNo)}</p>
      <h2 className="mt-2 text-center font-display text-[26px] leading-tight text-ink">{name.toUpperCase()}</h2>
      <p className="mt-2 text-center font-body text-[15px] italic text-soil">{spawn.taxon.name}</p>
      {lineage && lineage.length > 0 && (
        <p className="mt-2 text-center font-ui text-[9px] tracking-[1px] text-stone">{lineage.join(" › ")}</p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-2">
        {stats.map(([k, v]) => (
          <div key={k} className="border-[3px] border-ink bg-paper px-3 py-2">
            <dt className="font-ui text-[9px] tracking-[2px] text-stone">{k}</dt>
            <dd className="mt-1 font-display text-[13px] text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={onDone}
        className="mt-4 h-12 w-full shrink-0 border-[3px] border-ink bg-sun font-display text-[15px] text-ink shadow-[4px_4px_0_#45243555] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#45243555]"
      >
        ADD TO DEX
      </button>
    </div>
  );
}
