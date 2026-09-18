// Creature Atlas (naturedex_design_system.pen › 04 · Creature Atlas).
// Each base sprite is an 18×18 grid of rectangles filled with design-token colours,
// so it follows the colour / 1-bit tone automatically.
import rects from "./atlas-rects.json";

export type Rarity = "C" | "U" | "R";
export type Rect = [token: string, x: number, y: number, w: number, h: number];

export interface AtlasCreature {
  key: string;
  iconic: string; // iNaturalist iconic_taxon_name
  family: string;
  familyTaxonId: number; // iNaturalist taxon id of the family
  exemplar: string; // scientific name of the species the sprite was drawn from
  habitat: string;
  rarity: Rarity;
  rects: Rect[];
}

type Meta = Omit<AtlasCreature, "key" | "rects">;

const META: Record<keyof typeof rects, Meta> = {
  Jaybit: { iconic: "Aves", family: "Corvidae", familyTaxonId: 7823, exemplar: "Cyanocitta cristata", habitat: "FOREST", rarity: "C" },
  Whirrbit: { iconic: "Aves", family: "Trochilidae", familyTaxonId: 5562, exemplar: "Archilochus colubris", habitat: "GARDEN", rarity: "R" },
  Hoolet: { iconic: "Aves", family: "Strigidae", familyTaxonId: 19728, exemplar: "Megascops asio", habitat: "FOREST · NIGHT", rarity: "R" },
  Monark: { iconic: "Insecta", family: "Nymphalidae", familyTaxonId: 47922, exemplar: "Danaus plexippus", habitat: "MEADOW", rarity: "C" },
  Dottle: { iconic: "Insecta", family: "Coccinellidae", familyTaxonId: 48486, exemplar: "Harmonia axyridis", habitat: "GARDEN", rarity: "C" },
  Buzzum: { iconic: "Insecta", family: "Apidae", familyTaxonId: 47221, exemplar: "Bombus impatiens", habitat: "MEADOW", rarity: "C" },
  Peepler: { iconic: "Amphibia", family: "Hylidae", familyTaxonId: 1658175, exemplar: "Hyla versicolor", habitat: "WETLAND", rarity: "U" },
  Newtle: { iconic: "Amphibia", family: "Salamandridae", familyTaxonId: 27701, exemplar: "Notophthalmus viridescens", habitat: "WETLAND", rarity: "U" },
  Basker: { iconic: "Reptilia", family: "Dactyloidae", familyTaxonId: 200152, exemplar: "Anolis carolinensis", habitat: "SCRUB", rarity: "U" },
  Shellby: { iconic: "Reptilia", family: "Emydidae", familyTaxonId: 39760, exemplar: "Chrysemys picta", habitat: "WETLAND", rarity: "U" },
  Nutkin: { iconic: "Mammalia", family: "Sciuridae", familyTaxonId: 45933, exemplar: "Sciurus carolinensis", habitat: "URBAN", rarity: "C" },
  Lopper: { iconic: "Mammalia", family: "Leporidae", familyTaxonId: 43095, exemplar: "Sylvilagus floridanus", habitat: "MEADOW", rarity: "U" },
  Finnick: { iconic: "Actinopterygii", family: "Cyprinidae", familyTaxonId: 49609, exemplar: "Notropis hudsonius", habitat: "RIVER", rarity: "U" },
  Spirl: { iconic: "Mollusca", family: "Helicidae", familyTaxonId: 47484, exemplar: "Cornu aspersum", habitat: "GARDEN", rarity: "C" },
  Webber: { iconic: "Arachnida", family: "Araneidae", familyTaxonId: 47535, exemplar: "Argiope aurantia", habitat: "MEADOW", rarity: "R" },
  Capsule: { iconic: "Fungi", family: "Amanitaceae", familyTaxonId: 118249, exemplar: "Amanita muscaria", habitat: "FOREST", rarity: "R" },
  Petalin: { iconic: "Plantae", family: "Asteraceae", familyTaxonId: 47604, exemplar: "Bellis perennis", habitat: "MEADOW", rarity: "C" },
  Blobule: { iconic: "Protozoa", family: "Amoebidae", familyTaxonId: 311345, exemplar: "Amoeba proteus", habitat: "POND · MICRO", rarity: "R" },
};

export const ATLAS: AtlasCreature[] = Object.entries(META).map(([key, meta]) => ({
  key,
  ...meta,
  rects: (rects as unknown as Record<string, Rect[]>)[key],
}));

export const ATLAS_BY_KEY = Object.fromEntries(ATLAS.map((c) => [c.key, c])) as Record<string, AtlasCreature>;

/** Base class for each iNaturalist iconic taxon when no family silhouette matches. */
export const ICONIC_FALLBACK: Record<string, string> = {
  Aves: "Jaybit",
  Insecta: "Monark",
  Amphibia: "Peepler",
  Reptilia: "Basker",
  Mammalia: "Nutkin",
  Actinopterygii: "Finnick",
  Mollusca: "Spirl",
  Arachnida: "Webber",
  Fungi: "Capsule",
  Plantae: "Petalin",
  Protozoa: "Blobule",
  Chromista: "Blobule",
  Animalia: "Webber",
};
