// Map engine: loads source tiles, rasterises chunks per cell zoom, paints them per tone,
// and draws the visible window onto a canvas.
import { fromWorldPx, metresPerPx, worldPx, type LatLng } from "../geo/mercator";
import { Cell, CELL_INFO } from "./classes";
import { paintChunk } from "./paint";
import { MAP_PALETTE, type Tone } from "./palette";
import { CHUNK, GRID, MARGIN, rasterizeChunk, sourceTileOf, type ChunkGrid } from "./raster";
import { EXTENT, SOURCE_ZOOM, loadTile, type PlaceName } from "./tiles";

/** On-screen cell size in CSS px (fixed by the design; zoom changes metres per cell). */
export const CELL_PX = 6;
export const MIN_ZOOM = 16;
export const MAX_ZOOM = 19;
export const DEFAULT_ZOOM = 18;

/** Cell zoom for a display zoom: one cell = one world pixel at z − 2. */
export const cellZoom = (zoom: number) => zoom - 2;

export interface Viewport {
  /** Canvas size in device pixels. */
  width: number;
  height: number;
  dpr: number;
}

interface ChunkEntry {
  grid?: ChunkGrid;
  canvas?: HTMLCanvasElement;
  tone?: Tone;
  loading?: Promise<void>;
  error?: unknown;
  used: number;
}

const MAX_CHUNKS = 96;

export class MapEngine {
  private chunks = new Map<string, ChunkEntry>();
  private listeners = new Set<() => void>();
  private tick = 0;
  tone: Tone = "color";
  /** Bumped whenever new chunks become available; lets React re-derive data. */
  version = 0;
  lastError: unknown = null;

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  setTone(tone: Tone) {
    if (tone === this.tone) return;
    this.tone = tone;
    this.emit();
  }

  /** Device px per cell, snapped to a whole number so every cell has the same size. */
  cellDevicePx(dpr: number): number {
    return Math.max(1, Math.round(CELL_PX * dpr));
  }

  /** Top-left of the viewport in cell coordinates at the cell zoom. */
  viewOrigin(center: LatLng, zoom: number, vp: Viewport) {
    const zc = cellZoom(zoom);
    const c = worldPx(center, zc);
    const cd = this.cellDevicePx(vp.dpr);
    return { zc, cd, left: c.x - vp.width / 2 / cd, top: c.y - vp.height / 2 / cd };
  }

  /** Project a location to CSS px within the viewport. */
  project(p: LatLng, center: LatLng, zoom: number, vp: Viewport): { x: number; y: number } {
    const { zc, cd, left, top } = this.viewOrigin(center, zoom, vp);
    const w = worldPx(p, zc);
    return { x: ((w.x - left) * cd) / vp.dpr, y: ((w.y - top) * cd) / vp.dpr };
  }

  /** CSS px within the viewport → location. */
  unproject(x: number, y: number, center: LatLng, zoom: number, vp: Viewport): LatLng {
    const { zc, cd, left, top } = this.viewOrigin(center, zoom, vp);
    return fromWorldPx(left + (x * vp.dpr) / cd, top + (y * vp.dpr) / cd, zc);
  }

  draw(ctx: CanvasRenderingContext2D, center: LatLng, zoom: number, vp: Viewport) {
    const { zc, cd, left, top } = this.viewOrigin(center, zoom, vp);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = MAP_PALETTE[this.tone].cell[Cell.Urban];
    ctx.fillRect(0, 0, vp.width, vp.height);

    const cx0 = Math.floor(left / CHUNK);
    const cy0 = Math.floor(top / CHUNK);
    const cx1 = Math.floor((left + vp.width / cd) / CHUNK);
    const cy1 = Math.floor((top + vp.height / cd) / CHUNK);
    const size = CHUNK * cd;

    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const canvas = this.paintedChunk(zc, cx, cy, center.lat);
        if (!canvas) continue;
        const dx = Math.round((cx * CHUNK - left) * cd);
        const dy = Math.round((cy * CHUNK - top) * cd);
        ctx.drawImage(canvas, 0, 0, CHUNK, CHUNK, dx, dy, size, size);
      }
    }
  }

  /** True once every chunk under the viewport has been rasterised. */
  isReady(center: LatLng, zoom: number, vp: Viewport): boolean {
    const { zc, cd, left, top } = this.viewOrigin(center, zoom, vp);
    for (let cy = Math.floor(top / CHUNK); cy <= Math.floor((top + vp.height / cd) / CHUNK); cy++) {
      for (let cx = Math.floor(left / CHUNK); cx <= Math.floor((left + vp.width / cd) / CHUNK); cx++) {
        if (!this.chunks.get(key(zc, cx, cy))?.grid) return false;
      }
    }
    return true;
  }

  /** Class of the cell under a location at the given display zoom (undefined until loaded). */
  cellAt(p: LatLng, zoom = DEFAULT_ZOOM): Cell | undefined {
    const zc = cellZoom(zoom);
    const w = worldPx(p, zc);
    const gx = Math.floor(w.x), gy = Math.floor(w.y);
    const grid = this.gridFor(zc, gx, gy, p.lat);
    if (!grid) return undefined;
    return grid.cells[(gy - grid.cy * CHUNK + MARGIN) * GRID + (gx - grid.cx * CHUNK + MARGIN)];
  }

  /**
   * Nudge a location off roads and onto the nearest cell something could live on,
   * searching up to `maxCells` cells away. Returns the input if nothing better is loaded.
   */
  snapToSpawnable(p: LatLng, zoom = DEFAULT_ZOOM, maxCells = 10): LatLng {
    const zc = cellZoom(zoom);
    const w = worldPx(p, zc);
    const gx = Math.floor(w.x), gy = Math.floor(w.y);
    const here = this.cellAtGlobal(zc, gx, gy, p.lat);
    if (here === undefined || CELL_INFO[here].biome) return p;
    for (let r = 1; r <= maxCells; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const c = this.cellAtGlobal(zc, gx + dx, gy + dy, p.lat);
          if (c !== undefined && CELL_INFO[c].biome) return fromWorldPx(gx + dx + 0.5, gy + dy + 0.5, zc);
        }
      }
    }
    return p;
  }

  /** Best label for where the player is: a park, else water, else the neighbourhood. */
  async placeName(p: LatLng): Promise<string | null> {
    const w = worldPx(p, SOURCE_ZOOM);
    const tile = await loadTile(Math.floor(w.x / 256), Math.floor(w.y / 256));
    const px = (w.x / 256 - tile.x) * EXTENT;
    const py = (w.y / 256 - tile.y) * EXTENT;
    const unitsPerM = EXTENT / (256 * metresPerPx(p.lat, SOURCE_ZOOM));
    const nearest = (kind: PlaceName["kind"], maxM: number) =>
      tile.names
        .filter((n) => n.kind === kind)
        .map((n) => ({ n, d: Math.hypot(n.x - px, n.y - py) / unitsPerM }))
        .filter((o) => o.d <= maxM)
        .sort((a, b) => a.d - b.d)[0]?.n.name ?? null;
    return nearest("park", 350) ?? nearest("water", 250) ?? nearest("place", 3000);
  }

  private cellAtGlobal(zc: number, gx: number, gy: number, lat: number): Cell | undefined {
    const grid = this.gridFor(zc, gx, gy, lat);
    if (!grid) return undefined;
    return grid.cells[(gy - grid.cy * CHUNK + MARGIN) * GRID + (gx - grid.cx * CHUNK + MARGIN)];
  }

  private gridFor(zc: number, gx: number, gy: number, lat: number): ChunkGrid | undefined {
    const cx = Math.floor(gx / CHUNK), cy = Math.floor(gy / CHUNK);
    const entry = this.ensure(zc, cx, cy, lat);
    return entry.grid;
  }

  private paintedChunk(zc: number, cx: number, cy: number, lat: number): HTMLCanvasElement | undefined {
    const entry = this.ensure(zc, cx, cy, lat);
    if (!entry.grid) return undefined;
    if (!entry.canvas || entry.tone !== this.tone) {
      entry.canvas ??= document.createElement("canvas");
      entry.canvas.width = CHUNK;
      entry.canvas.height = CHUNK;
      entry.canvas.getContext("2d")!.putImageData(paintChunk(entry.grid, this.tone), 0, 0);
      entry.tone = this.tone;
    }
    return entry.canvas;
  }

  private ensure(zc: number, cx: number, cy: number, lat: number): ChunkEntry {
    const k = key(zc, cx, cy);
    let entry = this.chunks.get(k);
    if (!entry) {
      entry = { used: 0 };
      this.chunks.set(k, entry);
      this.evict();
    }
    entry.used = ++this.tick;
    if (!entry.grid && !entry.loading && !entry.error) {
      const e = entry;
      const src = sourceTileOf(zc, cx, cy);
      e.loading = loadTile(src.x, src.y)
        .then((tile) => {
          e.grid = rasterizeChunk(tile, zc, cx, cy, metresPerPx(lat, zc));
          this.lastError = null;
        })
        .catch((err) => {
          e.error = err;
          this.lastError = err;
          // Forget the failure after a while so a flaky connection can recover.
          setTimeout(() => this.chunks.get(k) === e && this.chunks.delete(k), 10_000);
        })
        .finally(() => {
          e.loading = undefined;
          this.emit();
        });
    }
    return entry;
  }

  private evict() {
    if (this.chunks.size <= MAX_CHUNKS) return;
    const oldest = [...this.chunks.entries()].sort((a, b) => a[1].used - b[1].used);
    for (const [k] of oldest.slice(0, this.chunks.size - MAX_CHUNKS)) this.chunks.delete(k);
  }
}

const key = (zc: number, cx: number, cy: number) => `${zc}/${cx}/${cy}`;
