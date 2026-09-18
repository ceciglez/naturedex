"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sprite } from "@/components/sprites/Sprite";
import { dexNo } from "@/components/encounter/NewSpecies";
import { RarityChip, TagChip } from "@/components/ui/Chip";
import { SparkGlyph, StateMessage } from "@/components/ui/StateMessage";
import { useDex } from "@/hooks/useDex";
import { useTaxon } from "@/hooks/useTaxon";
import { saveDetails } from "@/lib/dex/store";
import { displayName } from "@/lib/inat/spawns";
import type { TaxonDetails } from "@/lib/inat/types";
import { resolveSprite } from "@/lib/sprites/resolve";

const MONTHS = "JFMAMJJASOND".split("");
const RANK_LABEL: Record<string, string> = {
  kingdom: "KINGDOM",
  phylum: "PHYLUM",
  class: "CLASS",
  order: "ORDER",
  family: "FAMILY",
  genus: "GENUS",
};

function since(date: string | null): string {
  if (!date) return "—";
  const d = Math.round((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (d <= 0) return "TODAY";
  if (d < 60) return `${d}d AGO`;
  if (d < 730) return `${Math.round(d / 30)}mo AGO`;
  return `${Math.round(d / 365)}y AGO`;
}

/** Screen · Species v2 (DATA) and Species · Community (empty for now). */
export function SpeciesPage({ taxonId }: { taxonId: number }) {
  const { ready, entries } = useDex();
  const entry = entries.find((e) => e.taxonId === taxonId);
  const lastAt = entry?.sightings.at(-1)?.at ?? null;
  const { data, error, loading } = useTaxon(entry ? taxonId : null, lastAt, entry?.details);
  const [tab, setTab] = useState<"data" | "community">("data");

  // Keep a copy of the species data with the entry so the page works offline next time.
  useEffect(() => {
    if (entry && data && data !== entry.details) void saveDetails(taxonId, data);
  }, [entry, data, taxonId]);

  if (!ready) return <div className="h-dvh bg-ink" />;
  if (!entry) {
    return (
      <div className="flex h-dvh items-center justify-center bg-ink px-8">
        <StateMessage
          dark
          title="NOT IN YOUR DEX"
          body="This species hasn't been observed on this device yet. Find it on the map to add it."
          alt={{ label: "BACK TO THE DEX", href: "/dex" }}
        />
      </div>
    );
  }

  const sprite = resolveSprite(entry.taxon);
  const name = displayName({ sprite, taxon: entry.taxon });

  return (
    <div className="min-h-dvh bg-ink px-4 pb-10 pt-[max(12px,env(safe-area-inset-top))]">
      <header className="flex h-12 items-center justify-between">
        <Link href="/dex" className="py-2 pr-3 font-display text-[11px] text-bone">
          &lt; DEX
        </Link>
        <p className="font-ui text-[11px] tracking-[2px] text-sun">{dexNo(entry.dexNo)}</p>
      </header>

      <div className="mt-2 flex gap-3">
        <span className="flex size-[72px] shrink-0 items-center justify-center bg-lcd-bg">
          <Sprite sprite={sprite} size={72} title={name} />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="font-display text-lg leading-tight text-bone">{name.toUpperCase()}</h1>
          <p className="font-body text-sm italic text-teal">{entry.taxon.name}</p>
          <div className="flex flex-wrap gap-2">
            {entry.taxon.iconic && <TagChip>{entry.taxon.iconic}</TagChip>}
            <RarityChip rarity={entry.rarity} />
          </div>
        </div>
      </div>

      <div role="tablist" className="mt-4 flex border-2 border-shadow">
        {(["data", "community"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`h-8 flex-1 font-ui text-[10px] tracking-[2px] ${tab === t ? "border-2 border-sun bg-shadow text-sun" : "text-alt-dusk"}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "data" ? (
        <DataTab data={data} loading={loading} error={error} sightings={entry.sightings.length} firstSeen={entry.firstSeen} />
      ) : (
        <div className="flex flex-col items-center pt-16">
          <StateMessage
            dark
            icon={<SparkGlyph />}
            title="NOBODY HAS WRITTEN THIS DOWN"
            body="Local names, sketches and notes from other people arrive once Naturedex has accounts. Your own field notes are coming next."
          />
          <p className="mt-16 font-body text-[11px] text-alt-dusk">Names, notes and sketches are contributed by people here · CC BY-NC</p>
        </div>
      )}
    </div>
  );
}

function DataTab({
  data,
  loading,
  error,
  sightings,
  firstSeen,
}: {
  data?: TaxonDetails;
  loading: boolean;
  error: boolean;
  sightings: number;
  firstSeen: number;
}) {
  const max = data ? Math.max(1, ...data.byMonth) : 1;
  const lineage = data?.lineage.filter((l) => RANK_LABEL[l.rank]) ?? [];
  const species = data?.lineage.at(-1);

  return (
    <>
      {data?.photo ? (
        <figure className="relative mt-4 aspect-[358/146] overflow-hidden border-[3px] border-bone">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote iNaturalist photo, shown as-is */}
          <img src={data.photo.url} alt={`Photo of ${data.name}`} className="size-full object-cover" loading="lazy" />
          <figcaption className="absolute inset-x-0 bottom-0 truncate bg-ink/70 px-2 py-1 font-ui text-[9px] text-cloud">
            {data.photo.attribution}
          </figcaption>
        </figure>
      ) : (
        <div className="mt-4 flex aspect-[358/146] items-center justify-center border-[3px] border-shadow font-ui text-[10px] tracking-[2px] text-alt-dusk">
          {loading ? "LOADING…" : error ? "OFFLINE · NO PHOTO SAVED" : "NO PHOTO"}
        </div>
      )}

      {lineage.length > 0 && (
        <dl className="mt-4">
          {[...lineage, ...(species ? [{ rank: "species", name: species.name }] : [])].map((l, i) => (
            <div key={l.rank} className={`flex items-center justify-between px-3 py-2.5 ${i % 2 ? "bg-ink-deep" : "bg-shadow"}`}>
              <dt className="font-ui text-[9px] tracking-[3px] text-alt-dusk">{RANK_LABEL[l.rank] ?? "SPECIES"}</dt>
              <dd className={`font-body text-[13px] ${l.rank === "species" ? "text-sun" : "text-bone"}`}>
                {l.rank === "species" ? l.name.replace(/^(\w)\w+ /, "$1. ") : l.name}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {data && (
        <>
          <h2 className="mt-5 font-ui text-[9px] tracking-[3px] text-alt-dusk">
            OBSERVATIONS BY MONTH · {data.byMonthScope === "nearby" ? "NEAR YOU" : "WORLDWIDE"}
          </h2>
          <div className="mt-2 flex h-24 items-end gap-1" role="img" aria-label="Observations per month, January to December">
            {data.byMonth.map((n, i) => {
              const r = n / max;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className={`w-full ${r > 0.75 ? "bg-sun" : r > 0.3 ? "bg-teal" : "bg-moss"}`} style={{ height: `${Math.max(6, r * 76)}px` }} />
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex gap-1" aria-hidden>
            {MONTHS.map((m, i) => (
              <span key={i} className="flex-1 text-center font-ui text-[9px] text-alt-dusk">
                {m}
              </span>
            ))}
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["OBS. NEARBY", data.nearbyCount.toLocaleString("en")],
              ["IDENTIFIERS", data.identifiers.toLocaleString("en")],
              ["LAST SEEN", since(data.lastSeenNearby)],
            ].map(([k, v]) => (
              <div key={k} className="bg-shadow px-3 py-2.5">
                <dt className="font-ui text-[8px] tracking-[2px] text-alt-dusk">{k}</dt>
                <dd className="mt-1 font-display text-xs text-bone">{v}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <p className="mt-5 font-ui text-[9px] tracking-[2px] text-alt-dusk">
        YOUR SIGHTINGS · {sightings} · FIRST {new Date(firstSeen).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}
      </p>
    </>
  );
}
