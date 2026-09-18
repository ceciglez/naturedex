// The Field Dex, stored on this device in IndexedDB (no accounts in v1).
import { createStore, set, values } from "idb-keyval";
import type { LatLng } from "../geo/mercator";
import type { NearbyTaxon, TaxonDetails } from "../inat/types";
import type { Rarity } from "../sprites/atlas";

export interface Sighting {
  at: LatLng;
  time: number;
  /** The iNaturalist observation this encounter came from. */
  observationId: number | null;
  biome: string | null;
}

export interface DexEntry {
  taxonId: number;
  dexNo: number;
  taxon: NearbyTaxon;
  rarity: Rarity;
  biome: string | null;
  firstSeen: number;
  lastSeen: number;
  sightings: Sighting[];
  /** Cached species data so the Species page works offline. */
  details?: TaxonDetails;
}

export interface DexSnapshot {
  ready: boolean;
  entries: DexEntry[]; // by dex number
}

const EMPTY: DexSnapshot = { ready: false, entries: [] };
let snapshot: DexSnapshot = EMPTY;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

const store = () => createStore("naturedex", "dex");

function publish(entries: DexEntry[]) {
  snapshot = { ready: true, entries: [...entries].sort((a, b) => a.dexNo - b.dexNo) };
  for (const fn of listeners) fn();
}

function load(): Promise<void> {
  loading ??= values<DexEntry>(store())
    .then(publish)
    .catch((err) => {
      console.warn("dex load", err);
      publish([]);
    });
  return loading;
}

export function subscribeDex(fn: () => void): () => void {
  listeners.add(fn);
  void load();
  return () => listeners.delete(fn);
}

export const getDexSnapshot = () => snapshot;
export const getServerDexSnapshot = () => EMPTY;

export async function getEntry(taxonId: number): Promise<DexEntry | undefined> {
  await load();
  return snapshot.entries.find((e) => e.taxonId === taxonId);
}

export interface LogInput {
  taxon: NearbyTaxon;
  rarity: Rarity;
  biome: string | null;
  at: LatLng;
  observationId: number | null;
  details?: TaxonDetails;
}

/** Record an encounter. Returns the entry and whether this species is new to the Dex. */
export async function logSighting(input: LogInput): Promise<{ entry: DexEntry; isNew: boolean }> {
  await load();
  const now = Date.now();
  const sighting: Sighting = { at: input.at, time: now, observationId: input.observationId, biome: input.biome };
  const existing = snapshot.entries.find((e) => e.taxonId === input.taxon.id);
  const entry: DexEntry = existing
    ? { ...existing, lastSeen: now, sightings: [...existing.sightings, sighting], details: input.details ?? existing.details }
    : {
        taxonId: input.taxon.id,
        dexNo: snapshot.entries.reduce((m, e) => Math.max(m, e.dexNo), 0) + 1,
        taxon: input.taxon,
        rarity: input.rarity,
        biome: input.biome,
        firstSeen: now,
        lastSeen: now,
        sightings: [sighting],
        details: input.details,
      };
  await set(entry.taxonId, entry, store());
  publish([...snapshot.entries.filter((e) => e.taxonId !== entry.taxonId), entry]);
  return { entry, isNew: !existing };
}

export async function saveDetails(taxonId: number, details: TaxonDetails) {
  const entry = await getEntry(taxonId);
  if (!entry) return;
  const next = { ...entry, details };
  await set(taxonId, next, store());
  publish([...snapshot.entries.filter((e) => e.taxonId !== taxonId), next]);
}


// Local species total (the "/ 240" in the Dex header), remembered from the last radar sweep.
const LOCAL_KEY = "naturedex:localSpecies";
export function rememberLocalSpecies(n: number | null) {
  if (n === null) return;
  try {
    localStorage.setItem(LOCAL_KEY, String(n));
  } catch {}
}
export function readLocalSpecies(): number | null {
  try {
    const v = Number(localStorage.getItem(LOCAL_KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}
