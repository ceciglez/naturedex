// Turn nearby iNaturalist observations into creatures on the map.
import { bearingDeg, distanceM, type LatLng } from "../geo/mercator";
import type { Rarity } from "../sprites/atlas";
import { resolveSprite, type ResolvedSprite } from "../sprites/resolve";
import type { NearbyObservation, NearbyTaxon } from "./types";

export interface Spawn {
  id: string; // taxon id — one creature per species
  taxon: NearbyTaxon;
  observation: NearbyObservation;
  at: LatLng;
  sprite: ResolvedSprite;
  rarity: Rarity;
  count: number;
  distanceM: number;
  bearing: number;
}

const SPECIES_RANKS = new Set(["species", "subspecies", "variety", "form", "hybrid"]);
export const MAX_SPAWNS = 30;

export function buildSpawns(observations: NearbyObservation[], player: LatLng): Spawn[] {
  const byTaxon = new Map<number, NearbyObservation[]>();
  for (const o of observations) {
    if (!SPECIES_RANKS.has(o.taxon.rank)) continue;
    const list = byTaxon.get(o.taxon.id);
    if (list) list.push(o);
    else byTaxon.set(o.taxon.id, [o]);
  }

  const spawns: Spawn[] = [];
  for (const [taxonId, list] of byTaxon) {
    const latest = list[0]; // results are newest first
    const at = { lat: latest.lat, lng: latest.lng };
    spawns.push({
      id: String(taxonId),
      taxon: latest.taxon,
      observation: latest,
      at,
      sprite: resolveSprite(latest.taxon),
      // Legend: rarity comes from observation counts within the scan radius.
      rarity: list.length >= 5 ? "C" : list.length >= 2 ? "U" : "R",
      count: list.length,
      distanceM: distanceM(player, at),
      bearing: bearingDeg(player, at),
    });
  }
  return spawns.sort((a, b) => a.distanceM - b.distanceM).slice(0, MAX_SPAWNS);
}

/** Title-cased display name: the creature nickname for its exemplar, else the common name. */
export function displayName(s: Pick<Spawn, "sprite" | "taxon">): string {
  if (s.sprite.match === "exemplar") return s.sprite.creature.key;
  const name = s.taxon.common ?? s.taxon.name;
  return name.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}
