// Taxon → sprite (naturedex_design_system.pen › 05 · Taxonomy → Sprite).
// iconic taxon → base class, family → silhouette, species → palette remap.
// Deterministic: the same taxon id always resolves to the same creature.
import { ATLAS, ATLAS_BY_KEY, ICONIC_FALLBACK, type AtlasCreature } from "./atlas";

export interface TaxonLike {
  id: number;
  name: string; // scientific name
  iconic?: string | null;
  ancestorIds?: number[];
}

export interface ResolvedSprite {
  creature: AtlasCreature;
  /** token → token swaps applied on top of the base palette. */
  remap: Record<string, string>;
  /** "family" when the silhouette matched, "iconic" when we fell back a rank. */
  match: "exemplar" | "family" | "iconic";
}

// Body colours a species skin can take. Ink (outline) never changes.
const SKIN_TOKENS = ["sky", "teal", "blossom", "sun", "lime", "rust", "berry", "violet", "grass", "sand", "bark", "stone", "moss", "water"];

const FAMILY_INDEX = new Map(ATLAS.map((c) => [c.familyTaxonId, c]));

export function hash32(n: number): number {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) >>> 0;
}

function primaryToken(c: AtlasCreature): string {
  const area = new Map<string, number>();
  for (const [token, , , w, h] of c.rects) {
    if (token === "ink") continue;
    area.set(token, (area.get(token) ?? 0) + w * h);
  }
  return [...area.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "ink";
}

export function resolveSprite(taxon: TaxonLike): ResolvedSprite {
  const exemplar = ATLAS.find((c) => c.exemplar === taxon.name);
  if (exemplar) return { creature: exemplar, remap: {}, match: "exemplar" };

  const family = taxon.ancestorIds?.map((id) => FAMILY_INDEX.get(id)).find(Boolean);
  const creature =
    family ?? ATLAS_BY_KEY[ICONIC_FALLBACK[taxon.iconic ?? ""] ?? "Blobule"] ?? ATLAS_BY_KEY.Blobule;

  const primary = primaryToken(creature);
  const choices = SKIN_TOKENS.filter((t) => t !== primary);
  const h = hash32(taxon.id);
  // One in four species keeps the base skin so the family's look stays recognisable.
  const remap = h % 4 === 0 ? {} : { [primary]: choices[h % choices.length] };

  return { creature, remap, match: family ? "family" : "iconic" };
}
