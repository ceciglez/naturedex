"use client";

import { useState } from "react";
import { Sprite } from "@/components/sprites/Sprite";
import { RarityChip, TagChip } from "@/components/ui/Chip";
import { useTaxon } from "@/hooks/useTaxon";
import { logSighting, type DexEntry } from "@/lib/dex/store";
import { compass, distanceM, type LatLng } from "@/lib/geo/mercator";
import { displayName, type Spawn } from "@/lib/inat/spawns";
import { cellHash } from "@/lib/map/paint";
import type { TaxonDetails } from "@/lib/inat/types";
import { NewSpecies } from "./NewSpecies";

/** How close you need to be to log a creature. */
export const OBSERVE_RANGE_M = 150;

interface EncounterProps {
  spawn: Spawn;
  player: LatLng;
  /** Biome label of the cell the creature stands on (e.g. "WETLAND"). */
  biome: string | null;
  onClose: (logged?: { entry: DexEntry; isNew: boolean }) => void;
}

// Stage backdrop per biome: [ground, fleck A, fleck B].
const STAGE: Record<string, [string, string, string]> = {
  WATER: ["var(--radar-bg)", "var(--radar-ripple)", "var(--radar-tuft)"],
  WETLAND: ["var(--radar-bg)", "var(--radar-ripple)", "var(--radar-tuft)"],
  FOREST: ["var(--moss)", "var(--grass)", "var(--alt-pine)"],
  SCRUB: ["var(--grass)", "var(--moss)", "var(--sand)"],
  MEADOW: ["var(--lime)", "var(--grass)", "var(--sun)"],
  GARDEN: ["var(--lime)", "var(--grass)", "var(--blossom)"],
  SHORE: ["var(--sand)", "var(--sky)", "var(--bark)"],
  URBAN: ["var(--alt-haze)", "var(--alt-dusk)", "var(--lime)"],
};

/** Screen · Encounter v2. */
export function Encounter({ spawn, player, biome, onClose }: EncounterProps) {
  const { data: details } = useTaxon(spawn.taxon.id, player);
  const [busy, setBusy] = useState(false);
  const [newEntry, setNewEntry] = useState<{ entry: DexEntry; details?: TaxonDetails } | null>(null);

  const dist = distanceM(player, spawn.at);
  const inReach = dist <= OBSERVE_RANGE_M;
  const name = displayName(spawn);
  const family = details?.lineage.find((l) => l.rank === "family")?.name;
  const [ground, fleckA, fleckB] = STAGE[biome ?? ""] ?? STAGE.MEADOW;
  const obs = spawn.observation;

  async function observe() {
    setBusy(true);
    try {
      const result = await logSighting({
        taxon: spawn.taxon,
        rarity: spawn.rarity,
        biome,
        at: spawn.at,
        observationId: obs.id,
        details,
      });
      if (result.isNew) setNewEntry({ entry: result.entry, details });
      else onClose(result);
    } finally {
      setBusy(false);
    }
  }

  if (newEntry) {
    return <NewSpecies spawn={spawn} entry={newEntry.entry} details={newEntry.details} biome={biome} onDone={() => onClose({ entry: newEntry.entry, isNew: true })} />;
  }

  return (
    <div role="dialog" aria-label={`Encounter: ${name}`} className="absolute inset-0 z-40 flex flex-col overflow-y-auto bg-ink px-4 pb-6 pt-[max(12px,env(safe-area-inset-top))]">
      <header className="flex h-12 items-center justify-between">
        <button type="button" onClick={() => onClose()} className="py-2 pr-3 font-display text-[11px] text-bone">
          &lt; BACK
        </button>
        <h1 className="font-display text-[11px] text-bone">ENCOUNTER</h1>
        <p className="font-ui text-[11px] tracking-[1px] text-sun">
          {Math.round(dist)}m {compass(spawn.bearing)}
        </p>
      </header>

      <div className="relative mt-2 aspect-[358/330] w-full overflow-hidden border-[3px] border-bone" style={{ background: ground }}>
        {Array.from({ length: 26 }, (_, i) => {
          const h = cellHash(i, spawn.taxon.id);
          return (
            <span
              key={i}
              aria-hidden
              className="absolute"
              style={{
                left: `${(h % 92) + 2}%`,
                top: `${((h >>> 8) % 70) + 2}%`,
                width: h % 2 ? 16 : 12,
                height: h % 2 ? 8 : 16,
                background: h % 3 ? fleckA : fleckB,
              }}
            />
          );
        })}
        <div className="absolute inset-x-0 bottom-0 h-[24%] bg-ink" />
        <div className="absolute inset-0 flex items-center justify-center pb-[10%]">
          <Sprite sprite={spawn.sprite} size={216} title={name} className="creature-idle" />
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h2 className="min-w-0 font-display text-xl leading-snug text-bone">{name.toUpperCase()}</h2>
        <RarityChip rarity={spawn.rarity} />
      </div>
      <p className="mt-2 font-body text-[15px] italic text-alt-dusk">{spawn.taxon.name}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {spawn.taxon.iconic && <TagChip>{spawn.taxon.iconic}</TagChip>}
        {family && <TagChip tone="plain">{family}</TagChip>}
      </div>

      <IdConfidence agree={obs.idAgree} total={obs.idTotal} />

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={!inReach || busy}
          onClick={observe}
          className="h-[46px] flex-[2] border-[3px] border-bone bg-sun font-display text-sm text-ink disabled:opacity-60"
        >
          {inReach ? (busy ? "…" : "OBSERVE") : "GET CLOSER"}
        </button>
        <button type="button" onClick={() => onClose()} className="h-[46px] flex-1 border-[3px] border-bone bg-shadow font-display text-sm text-bone">
          LEAVE
        </button>
      </div>

      <p className="mt-4 font-body text-[13px] leading-relaxed text-alt-dusk">
        {inReach
          ? `Observing logs this sighting in your Field Dex. It was seen here by @${obs.user}${obs.observedOn ? ` on ${obs.observedOn}` : ""}.`
          : `Walk within ${OBSERVE_RANGE_M}m to observe it. It's ${Math.round(dist)}m ${compass(spawn.bearing)} of you.`}
      </p>
    </div>
  );
}

/** ID CONFIDENCE bar: one segment per community ID (up to 10); agreeing IDs in teal. */
function IdConfidence({ agree, total }: { agree: number; total: number }) {
  const segments = Math.max(5, Math.min(10, total));
  return (
    <div className="mt-4">
      <div className="flex justify-between font-ui text-[10px] tracking-[2px]">
        <span className="text-alt-dusk">ID CONFIDENCE</span>
        <span className="text-sun">
          {agree} / {total} AGREE
        </span>
      </div>
      <div className="mt-1.5 flex gap-1 border-[3px] border-bone bg-shadow p-0.5" aria-hidden>
        {Array.from({ length: segments }, (_, i) => (
          <span key={i} className={`h-[18px] flex-1 ${i < agree ? "bg-teal" : i < total ? "bg-sun" : "bg-transparent"}`} />
        ))}
      </div>
    </div>
  );
}
