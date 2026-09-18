// OSM → cell class (naturedex_design_system.pen › 09 · Map Engine / OSM → Map Texture).
// Source data is OpenMapTiles-schema vector tiles (OpenFreeMap), whose class/subclass
// fields carry the original OSM tag values.

export enum Cell {
  Urban = 0, // fallback ground + landuse=residential|retail|commercial
  Park,
  Meadow,
  Farmland,
  Forest,
  Scrub,
  Wetland,
  Shore,
  Water,
  Trail,
  Street,
  Road,
  Building,
}

export const CELL_COUNT = 13;

export type Biome = "URBAN" | "MEADOW" | "GARDEN" | "FOREST" | "SCRUB" | "WETLAND" | "SHORE" | "WATER";

export interface CellInfo {
  label: string;
  biome: Biome | null; // null = impassable, nothing spawns
}

export const CELL_INFO: Record<Cell, CellInfo> = {
  [Cell.Urban]: { label: "URBAN", biome: "URBAN" },
  [Cell.Park]: { label: "PARK", biome: "GARDEN" },
  [Cell.Meadow]: { label: "MEADOW", biome: "MEADOW" },
  [Cell.Farmland]: { label: "FARMLAND", biome: "MEADOW" },
  [Cell.Forest]: { label: "FOREST", biome: "FOREST" },
  [Cell.Scrub]: { label: "SCRUB", biome: "SCRUB" },
  [Cell.Wetland]: { label: "WETLAND", biome: "WETLAND" },
  [Cell.Shore]: { label: "SHORE", biome: "SHORE" },
  [Cell.Water]: { label: "WATER", biome: "WATER" },
  [Cell.Trail]: { label: "TRAIL", biome: "MEADOW" }, // corridor, +spawn
  [Cell.Street]: { label: "STREET", biome: null },
  [Cell.Road]: { label: "ROAD", biome: null },
  [Cell.Building]: { label: "BUILDING", biome: "URBAN" },
};

/** Paint order: later layers win. Matches the spec: landuse → water → highways → buildings. */
export enum Layer {
  Landuse = 0,
  Landcover = 1,
  Water = 2,
  Waterway = 3,
  Trail = 4,
  Street = 5,
  Road = 6,
  Building = 7,
}

export interface Classified {
  cell: Cell;
  layer: Layer;
  /** Real-world width for line features, in metres. */
  widthM?: number;
}

type Props = Record<string, string | number | boolean | undefined>;

const SUBCLASS: Record<string, Cell> = {
  park: Cell.Park,
  garden: Cell.Park,
  grass: Cell.Park,
  recreation_ground: Cell.Park,
  village_green: Cell.Park,
  flowerbed: Cell.Park,
  golf_course: Cell.Park,
  allotments: Cell.Farmland,
  meadow: Cell.Meadow,
  grassland: Cell.Meadow,
  farmland: Cell.Farmland,
  farm: Cell.Farmland,
  orchard: Cell.Farmland,
  vineyard: Cell.Farmland,
  plant_nursery: Cell.Farmland,
  wood: Cell.Forest,
  forest: Cell.Forest,
  scrub: Cell.Scrub,
  heath: Cell.Scrub,
  wetland: Cell.Wetland,
  marsh: Cell.Wetland,
  swamp: Cell.Wetland,
  bog: Cell.Wetland,
  reedbed: Cell.Wetland,
  wet_meadow: Cell.Wetland,
  basin: Cell.Wetland,
  beach: Cell.Shore,
  sand: Cell.Shore,
  dune: Cell.Shore,
};

const LANDCOVER_CLASS: Record<string, Cell> = {
  grass: Cell.Park,
  wood: Cell.Forest,
  farmland: Cell.Farmland,
  wetland: Cell.Wetland,
  sand: Cell.Shore,
};

const LANDUSE_CLASS: Record<string, Cell> = {
  pitch: Cell.Park,
  playground: Cell.Park,
  park: Cell.Park,
  garden: Cell.Park,
  cemetery: Cell.Park,
  basin: Cell.Wetland,
  reservoir: Cell.Water,
  residential: Cell.Urban,
  commercial: Cell.Urban,
  retail: Cell.Urban,
  industrial: Cell.Urban,
};

// Carriageway widths in metres.
const ROAD_WIDTH: Record<string, number> = { motorway: 16, trunk: 14, primary: 12, secondary: 11 };
const STREET_WIDTH: Record<string, number> = { tertiary: 9, minor: 7, service: 4.5, raceway: 7, busway: 6 };
const WATERWAY_WIDTH: Record<string, number> = { river: 14, canal: 10, stream: 3, ditch: 1.5, drain: 1.5 };

/**
 * Classify one vector-tile feature. `geom` is 2 for lines, 3 for polygons.
 * Returns null for features the map ignores (POIs, rail, tunnels, labels…).
 */
export function classify(layer: string, p: Props, geom: number): Classified | null {
  const cls = String(p.class ?? "");
  const sub = String(p.subclass ?? "");

  switch (layer) {
    case "landcover": {
      if (geom !== 3) return null;
      const cell = SUBCLASS[sub] ?? LANDCOVER_CLASS[cls];
      return cell === undefined ? null : { cell, layer: Layer.Landcover };
    }
    case "landuse": {
      if (geom !== 3) return null;
      const cell = LANDUSE_CLASS[cls];
      if (cell === undefined) return null;
      return { cell, layer: cell === Cell.Urban ? Layer.Landuse : Layer.Landcover };
    }
    case "water":
      return geom === 3 && p.brunnel !== "tunnel" ? { cell: Cell.Water, layer: Layer.Water } : null;
    case "waterway": {
      if (geom !== 2 || p.brunnel === "tunnel") return null;
      return { cell: Cell.Water, layer: Layer.Waterway, widthM: WATERWAY_WIDTH[cls] ?? 3 };
    }
    case "transportation": {
      if (p.brunnel === "tunnel") return null;
      if (cls === "path" || cls === "track" || cls === "bridleway") {
        return geom === 3
          ? { cell: Cell.Trail, layer: Layer.Trail }
          : { cell: Cell.Trail, layer: Layer.Trail, widthM: 2 };
      }
      if (geom !== 2) return null;
      if (cls in ROAD_WIDTH) return { cell: Cell.Road, layer: Layer.Road, widthM: ROAD_WIDTH[cls] };
      if (cls in STREET_WIDTH) return { cell: Cell.Street, layer: Layer.Street, widthM: STREET_WIDTH[cls] };
      return null;
    }
    case "building":
      return geom === 3 ? { cell: Cell.Building, layer: Layer.Building } : null;
    default:
      return null;
  }
}
