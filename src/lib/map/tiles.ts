// Vector tile source: OpenFreeMap (OpenStreetMap data in the OpenMapTiles schema).
// Served from a CDN with CORS and long-lived cache headers, so the browser fetches
// tiles directly and no server of ours is involved.
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import { classify, type Cell, type Layer } from "./classes";

export const SOURCE_ZOOM = 14; // OpenFreeMap's max zoom; geometry precision ≈ 0.6 m
export const EXTENT = 4096;

const TILEJSON_URL = "https://tiles.openfreemap.org/planet";

export interface MapFeature {
  cell: Cell;
  layer: Layer;
  widthM?: number;
  kind: "poly" | "line";
  /** Rings (polygons) or parts (lines) as flat [x0, y0, x1, y1, …] in tile extent units. */
  parts: Float32Array[];
  bbox: [number, number, number, number];
  area: number;
}

export interface PlaceName {
  name: string;
  kind: "park" | "water" | "place";
  x: number;
  y: number;
}

export interface TileData {
  x: number;
  y: number;
  features: MapFeature[];
  names: PlaceName[];
}

let tileUrlTemplate: Promise<string> | null = null;

function getTileUrlTemplate(): Promise<string> {
  tileUrlTemplate ??= fetch(TILEJSON_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`TileJSON ${r.status}`);
      return r.json();
    })
    .then((j: { tiles: string[] }) => j.tiles[0])
    .catch((err) => {
      tileUrlTemplate = null; // allow a retry later
      throw err;
    });
  return tileUrlTemplate;
}

const cache = new Map<string, Promise<TileData>>();

export function loadTile(x: number, y: number): Promise<TileData> {
  const key = `${x}/${y}`;
  let p = cache.get(key);
  if (!p) {
    p = fetchTile(x, y).catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, p);
  }
  return p;
}

async function fetchTile(x: number, y: number): Promise<TileData> {
  const template = await getTileUrlTemplate();
  const url = template.replace("{z}", String(SOURCE_ZOOM)).replace("{x}", String(x)).replace("{y}", String(y));
  const res = await fetch(url);
  if (res.status === 204 || res.status === 404) return { x, y, features: [], names: [] };
  if (!res.ok) throw new Error(`Tile ${SOURCE_ZOOM}/${x}/${y}: ${res.status}`);
  return decodeTile(x, y, new Uint8Array(await res.arrayBuffer()));
}

const NAMED_PLACES = new Set(["neighbourhood", "quarter", "suburb", "hamlet", "village", "town", "city"]);

export function decodeTile(x: number, y: number, buf: Uint8Array): TileData {
  const vt = new VectorTile(new PbfReader(buf));
  const features: MapFeature[] = [];
  const names: PlaceName[] = [];

  for (const [layerName, layer] of Object.entries(vt.layers)) {
    const scale = EXTENT / layer.extent;
    for (let i = 0; i < layer.length; i++) {
      const f = layer.feature(i);
      const props = f.properties as Record<string, string | number | boolean>;

      if (f.type === 1) {
        const label = collectName(layerName, props);
        if (label) {
          const pt = f.loadGeometry()[0][0];
          names.push({ name: label.name, kind: label.kind, x: pt.x * scale, y: pt.y * scale });
        }
        continue;
      }

      const c = classify(layerName, props, f.type);
      if (!c) continue;

      const geometry = f.loadGeometry();
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let area = 0;
      const parts = geometry.map((ring) => {
        const flat = new Float32Array(ring.length * 2);
        for (let k = 0; k < ring.length; k++) {
          const px = ring[k].x * scale;
          const py = ring[k].y * scale;
          flat[k * 2] = px;
          flat[k * 2 + 1] = py;
          if (px < minX) minX = px;
          if (py < minY) minY = py;
          if (px > maxX) maxX = px;
          if (py > maxY) maxY = py;
        }
        if (f.type === 3) area += Math.abs(ringArea(flat));
        return flat;
      });

      features.push({
        cell: c.cell,
        layer: c.layer,
        widthM: c.widthM,
        kind: f.type === 2 ? "line" : "poly",
        parts,
        bbox: [minX, minY, maxX, maxY],
        area,
      });
    }
  }

  // Paint order: by layer, then larger polygons first so small parks sit on top of big landuse.
  features.sort((a, b) => a.layer - b.layer || b.area - a.area);
  return { x, y, features, names };
}

function collectName(layer: string, p: Record<string, string | number | boolean>) {
  const name = (p["name:latin"] ?? p.name) as string | undefined;
  if (!name) return null;
  if (layer === "poi" && (p.class === "park" || p.subclass === "park" || p.subclass === "nature_reserve")) {
    return { name, kind: "park" as const };
  }
  if (layer === "water_name") return { name, kind: "water" as const };
  if (layer === "place" && NAMED_PLACES.has(String(p.class))) return { name, kind: "place" as const };
  return null;
}

function ringArea(flat: Float32Array): number {
  let a = 0;
  for (let i = 0, n = flat.length; i < n; i += 2) {
    const j = (i + 2) % n;
    a += flat[i] * flat[j + 1] - flat[j] * flat[i + 1];
  }
  return a / 2;
}
