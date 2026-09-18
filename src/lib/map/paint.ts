// Turn a class grid into pixels (one pixel per cell; the canvas scales it ×6 without smoothing).
import { Cell, CELL_COUNT } from "./classes";
import { MAP_PALETTE, INK, type Tone } from "./palette";
import { CHUNK, DECO_DASH, GRID, MARGIN, type ChunkGrid } from "./raster";

type RGB = [number, number, number];

function rgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Stable per-cell noise so motifs line up across chunk seams. */
export function cellHash(x: number, y: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** 1-bit motif per class (naturedex_design_system.pen › 09 · Map Engine, "1-BIT" column). */
export function monoInk(cell: Cell, gx: number, gy: number): boolean {
  const h = cellHash(gx, gy);
  switch (cell) {
    case Cell.Park: // scattered tufts
      return h % 19 === 0 || (h % 19 === 1 && (gx & 1) === 0);
    case Cell.Meadow:
      return h % 11 === 0;
    case Cell.Farmland: // furrows
      return gx % 3 === 0 && gy % 4 !== 3;
    case Cell.Forest: // dense canopy noise
      return h % 5 < 2;
    case Cell.Scrub: // diagonal hatch
      return (gx + gy) % 4 === 0;
    case Cell.Wetland: // broken dashes
      return (gy % 3 === 0 && (gx + gy) % 5 < 2) || h % 23 === 0;
    case Cell.Shore:
      return h % 13 === 0;
    case Cell.Trail: // dotted path
      return ((gx + gy) & 1) === 0;
    case Cell.Water: // ripples
      return gy % 3 === 1 && (gx + (gy % 6 === 1 ? 2 : 0)) % 4 < 2;
    default:
      return false;
  }
}

const isRoad = (c: number) => c === Cell.Road || c === Cell.Street;
const takesShore = (c: number) => c !== Cell.Water && !isRoad(c) && c !== Cell.Building && c !== Cell.Trail;

export function paintChunk(grid: ChunkGrid, tone: Tone): ImageData {
  const pal = MAP_PALETTE[tone];
  const base = Array.from({ length: CELL_COUNT }, (_, c) => rgb(pal.cell[c as Cell]));
  const roadEdge = rgb(pal.roadEdge);
  const roadLine = rgb(pal.roadLine);
  const buildEdge = rgb(pal.buildEdge);
  const shore = rgb(pal.shore);
  const ink = rgb(INK);
  const accent: Partial<Record<number, RGB>> = {};
  for (const [c, hex] of Object.entries(pal.accent)) accent[Number(c)] = rgb(hex!);

  const { cells, deco } = grid;
  const img = new ImageData(CHUNK, CHUNK);
  const px = img.data;
  const gx0 = grid.cx * CHUNK;
  const gy0 = grid.cy * CHUNK;

  for (let y = 0; y < CHUNK; y++) {
    for (let x = 0; x < CHUNK; x++) {
      const i = (y + MARGIN) * GRID + (x + MARGIN);
      const c = cells[i];
      const n = cells[i - GRID], s = cells[i + GRID], w = cells[i - 1], e = cells[i + 1];
      const gx = gx0 + x, gy = gy0 + y;
      let col: RGB = base[c];

      if (isRoad(c)) {
        if (!isRoad(n) || !isRoad(s) || !isRoad(w) || !isRoad(e)) col = roadEdge;
        else if (deco[i] & DECO_DASH) col = roadLine;
      } else if (c === Cell.Building) {
        if (n !== c || s !== c || w !== c || e !== c) col = buildEdge;
      } else if (takesShore(c) && (n === Cell.Water || s === Cell.Water || w === Cell.Water || e === Cell.Water)) {
        col = shore;
      } else if (tone === "mono") {
        if (monoInk(c, gx, gy)) col = ink;
      } else if (c === Cell.Farmland) {
        if (gx % 3 === 0) col = accent[c] ?? col;
      } else if (c === Cell.Wetland) {
        if (cellHash(gx, gy) % 4 === 0) col = accent[c] ?? col;
      }

      const o = (y * CHUNK + x) * 4;
      px[o] = col[0];
      px[o + 1] = col[1];
      px[o + 2] = col[2];
      px[o + 3] = 255;
    }
  }
  return img;
}
