"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Sprite } from "@/components/sprites/Sprite";
import { ICONIC_STYLE } from "@/components/ui/Chip";
import { GridGlyph, StateMessage } from "@/components/ui/StateMessage";
import { TabBar } from "@/components/ui/TabBar";
import { useDex } from "@/hooks/useDex";
import { readLocalSpecies, type DexEntry } from "@/lib/dex/store";
import { displayName } from "@/lib/inat/spawns";
import { resolveSprite } from "@/lib/sprites/resolve";

const noSubscribe = () => () => {};
const nameOf = (e: DexEntry) => displayName({ sprite: resolveSprite(e.taxon), taxon: e.taxon });

function ago(t: number): string {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "JUST NOW";
  if (m < 60) return `${m} MIN AGO`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}H AGO`;
  return `${Math.round(h / 24)}D AGO`;
}

/** Screen · Field Dex v2 (+ Empty and No Results states). */
export function FieldDex() {
  const { ready, entries } = useDex();
  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);
  const total = useSyncExternalStore(noSubscribe, readLocalSpecies, () => null);

  const groups = useMemo(() => {
    const present = new Set(entries.map((e) => e.taxon.iconic ?? ""));
    // Always offer the four headline groups from the design, plus any others you've caught.
    return Object.keys(ICONIC_STYLE).filter((k) => ["Aves", "Insecta", "Amphibia", "Fungi"].includes(k) || present.has(k));
  }, [entries]);

  const shown = filter ? entries.filter((e) => e.taxon.iconic === filter) : entries;
  const slots = Math.max(20, Math.ceil((shown.length + 4) / 4) * 4);
  const last = [...entries].sort((a, b) => b.lastSeen - a.lastSeen)[0];
  const denom = total ? Math.max(total, entries.length) : null;
  const filled = denom ? Math.round((entries.length / denom) * 10) : Math.min(10, entries.length);

  return (
    <div className="flex h-dvh flex-col bg-paper">
      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-[max(16px,env(safe-area-inset-top))]">
        <header className="flex items-baseline justify-between pt-4">
          <h1 className="font-display text-xl text-ink">FIELD DEX</h1>
          <p className="font-display text-[13px] text-berry" title={denom ? "Species that turned up around your last radar sweep" : undefined}>
            {entries.length} / {denom ?? "?"}
          </p>
        </header>

        <div className="mt-3 flex gap-1 border-[3px] border-ink p-0.5" aria-hidden>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`h-[18px] flex-1 ${i < filled ? "bg-violet" : "bg-alt-haze"}`} />
          ))}
        </div>

        <div role="radiogroup" aria-label="Filter" className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          <FilterChip label="ALL" chip="bg-sun" on={!filter} onClick={() => setFilter(null)} />
          {groups.map((g) => (
            <FilterChip key={g} label={ICONIC_STYLE[g].label} chip={ICONIC_STYLE[g].chip} on={filter === g} onClick={() => setFilter(g)} />
          ))}
        </div>

        {!ready ? (
          <p className="mt-16 text-center font-display text-xs text-stone">OPENING DEX…</p>
        ) : entries.length === 0 ? (
          <div className="mt-16 flex justify-center">
            <StateMessage
              icon={<GridGlyph />}
              title="NOTHING IN THE DEX YET"
              body="Species you observe land here. The radar will tell you what is close enough to be worth looking for."
              action={{ label: "OPEN THE RADAR", onClick: () => router.push("/map?radar=1") }}
            />
          </div>
        ) : shown.length === 0 ? (
          <div className="mt-16 flex justify-center">
            <StateMessage
              title={`NO ${ICONIC_STYLE[filter!]?.label ?? "SPECIES"} IN YOUR DEX`}
              body={`You have ${entries.length} species logged and none of them are ${ICONIC_STYLE[filter!]?.label.toLowerCase() ?? "that"} yet. Clear the filter to see what you do have.`}
              action={{ label: "CLEAR FILTER", onClick: () => setFilter(null) }}
            />
          </div>
        ) : (
          <>
            <ul className="mt-3 grid grid-cols-4 gap-1.5">
              {Array.from({ length: slots }, (_, i) => {
                const e = shown[i];
                return (
                  <li key={e?.taxonId ?? `empty-${i}`} className="aspect-square">
                    {e ? (
                      <Link
                        href={`/dex/${e.taxonId}`}
                        aria-label={`${nameOf(e)}, number ${e.dexNo}`}
                        className="flex size-full items-center justify-center border-[3px] border-ink bg-lcd-bg"
                      >
                        <Sprite sprite={resolveSprite(e.taxon)} size={72} className="max-w-[82%]" />
                      </Link>
                    ) : (
                      <span className="flex size-full items-center justify-center border-[3px] border-ink bg-alt-haze font-display text-3xl text-alt-dusk" aria-hidden>
                        ?
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {last && (
              <Link href={`/dex/${last.taxonId}`} className="mt-3 flex items-center gap-2.5 border-2 border-shell-edge bg-paper px-[9px] py-[7px]">
                <span className="flex size-10 shrink-0 items-center justify-center border-2 border-ink bg-lcd-bg">
                  <Sprite sprite={resolveSprite(last.taxon)} size={36} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-display text-[11px] text-ink">{nameOf(last)}</span>
                  <span className="font-ui text-[9px] tracking-[1px] text-stone">LAST ADDED · {ago(last.lastSeen)}</span>
                </span>
                <span className="font-ui text-[11px] text-moss">&gt;</span>
              </Link>
            )}
          </>
        )}
      </main>
      <TabBar active="dex" />
    </div>
  );
}

function FilterChip({ label, chip, on, onClick }: { label: string; chip: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`h-7 shrink-0 border-2 px-2.5 font-ui text-[11px] tracking-[2px] ${on ? "border-ink bg-ink text-sun" : `border-ink ${chip} text-ink`}`}
    >
      {label}
    </button>
  );
}
