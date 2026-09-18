// Rasterise vector features onto the cell grid: every cell resolves to exactly one class.
//
// A "chunk" is one Web-Mercator tile at the cell zoom (zc): 256 × 256 cells. With the
// on-screen cell fixed at 6 px, display zoom z uses zc = z − 2 (z18 → 1 cell ≈ 2.4 m).
import { Cell } from "./classes";
import { EXTENT, SOURCE_ZOOM, type MapFeature, type TileData } from "./tiles";

export const CHUNK = 256;
/** Extra cells rasterised around each chunk so edge detection works across chunk seams. */
export const MARGIN = 2;
export const GRID = CHUNK + MARGIN * 2;

export const DECO_DASH = 1;

export interface ChunkGrid {
  zc: number;
  cx: number;
  cy: number;
  /** GRID × GRID class ids (row-major), including the margin. */
  cells: Uint8Array;
  /** GRID × GRID decoration flags (road centre dashes). */
  deco: Uint8Array;
}

/** Source tile (at SOURCE_ZOOM) that contains a chunk. */
export function sourceTileOf(zc: number, cx: number, cy: number): { x: number; y: number } {
  const shift = zc - SOURCE_ZOOM;
  return { x: cx >> shift, y: cy >> shift };
}

export function rasterizeChunk(tile: TileData, zc: number, cx: number, cy: number, metresPerCell: number): ChunkGrid {
  const cells = new Uint8Array(GRID * GRID).fill(Cell.Urban);
  const deco = new Uint8Array(GRID * GRID);

  // Tile extent units → chunk-local cell coordinates.
  const k = (2 ** (zc - SOURCE_ZOOM) * CHUNK) / EXTENT;
  const ox = cx * CHUNK - MARGIN - tile.x * EXTENT * k;
  const oy = cy * CHUNK - MARGIN - tile.y * EXTENT * k;

  for (const f of tile.features) {
    const pad = f.kind === "line" ? 8 : 0;
    const x0 = f.bbox[0] * k - ox - pad;
    const y0 = f.bbox[1] * k - oy - pad;
    const x1 = f.bbox[2] * k - ox + pad;
    const y1 = f.bbox[3] * k - oy + pad;
    if (x1 < 0 || y1 < 0 || x0 >= GRID || y0 >= GRID) continue;

    const parts = f.parts.map((p) => {
      const out = new Float32Array(p.length);
      for (let i = 0; i < p.length; i += 2) {
        out[i] = p[i] * k - ox;
        out[i + 1] = p[i + 1] * k - oy;
      }
      return out;
    });

    if (f.kind === "poly") fillPolygon(cells, parts, f.cell, Math.max(0, Math.floor(y0)), Math.min(GRID - 1, Math.ceil(y1)));
    else strokeLines(cells, deco, parts, f, metresPerCell);
  }

  return { zc, cx, cy, cells, deco };
}

/** Even-odd scanline fill, sampling at cell centres. */
export function fillPolygon(cells: Uint8Array, rings: Float32Array[], value: number, rowStart: number, rowEnd: number) {
  const xs: number[] = [];
  for (let r = rowStart; r <= rowEnd; r++) {
    const yc = r + 0.5;
    xs.length = 0;
    for (const ring of rings) {
      const n = ring.length;
      for (let i = 0; i < n; i += 2) {
        const j = (i + 2) % n;
        const ya = ring[i + 1];
        const yb = ring[j + 1];
        if (ya <= yc !== yb <= yc) {
          const xa = ring[i];
          xs.push(xa + ((yc - ya) * (ring[j] - xa)) / (yb - ya));
        }
      }
    }
    if (xs.length < 2) continue;
    xs.sort((a, b) => a - b);
    const row = r * GRID;
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const from = Math.max(0, Math.ceil(xs[i] - 0.5));
      const to = Math.min(GRID, Math.ceil(xs[i + 1] - 0.5));
      if (to > from) cells.fill(value, row + from, row + to);
    }
  }
}

function strokeLines(cells: Uint8Array, deco: Uint8Array, parts: Float32Array[], f: MapFeature, metresPerCell: number) {
  const thickness = Math.max(1, Math.round((f.widthM ?? 1) / metresPerCell));
  const dashed = (f.cell === Cell.Road || f.cell === Cell.Street) && thickness >= 3;
  const radius = thickness / 2;
  const r2 = radius * radius;

  for (const line of parts) {
    let walked = 0;
    for (let i = 0; i + 3 < line.length; i += 2) {
      const ax = line[i], ay = line[i + 1];
      const dx = line[i + 2] - ax, dy = line[i + 3] - ay;
      const len = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(len * 2));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const px = ax + dx * t;
        const py = ay + dy * t;
        stamp(cells, px, py, radius, r2, thickness, f.cell);
        if (dashed && Math.floor((walked + len * t) / 2) % 2 === 0) {
          const cxi = Math.floor(px), cyi = Math.floor(py);
          if (cxi >= 0 && cyi >= 0 && cxi < GRID && cyi < GRID) deco[cyi * GRID + cxi] |= DECO_DASH;
        }
      }
      walked += len;
    }
  }
}

function stamp(cells: Uint8Array, px: number, py: number, radius: number, r2: number, thickness: number, value: number) {
  // Nudge off exact cell boundaries so a line of width n always covers n cells across.
  px += 1e-3;
  py += 1e-3;
  if (thickness === 1) {
    const x = Math.floor(px), y = Math.floor(py);
    if (x >= 0 && y >= 0 && x < GRID && y < GRID) cells[y * GRID + x] = value;
    return;
  }
  const xa = Math.max(0, Math.floor(px - radius)), xb = Math.min(GRID - 1, Math.ceil(px + radius));
  const ya = Math.max(0, Math.floor(py - radius)), yb = Math.min(GRID - 1, Math.ceil(py + radius));
  for (let y = ya; y <= yb; y++) {
    const ddy = y + 0.5 - py;
    for (let x = xa; x <= xb; x++) {
      const ddx = x + 0.5 - px;
      if (ddx * ddx + ddy * ddy <= r2) cells[y * GRID + x] = value;
    }
  }
}
