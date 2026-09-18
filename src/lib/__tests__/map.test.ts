import { describe, expect, it } from "vitest";
import { Cell, Layer, classify } from "../map/classes";
import { GRID, MARGIN, fillPolygon, rasterizeChunk } from "../map/raster";
import { EXTENT, type TileData } from "../map/tiles";
import { monoInk } from "../map/paint";

describe("classify (Map Engine table)", () => {
  const cases: [string, Record<string, string>, number, Cell][] = [
    ["landcover", { class: "grass", subclass: "park" }, 3, Cell.Park],
    ["landcover", { class: "grass", subclass: "garden" }, 3, Cell.Park],
    ["landcover", { class: "wood", subclass: "forest" }, 3, Cell.Forest],
    ["landcover", { class: "grass", subclass: "meadow" }, 3, Cell.Meadow],
    ["landcover", { class: "grass", subclass: "scrub" }, 3, Cell.Scrub],
    ["landcover", { class: "wetland", subclass: "marsh" }, 3, Cell.Wetland],
    ["landcover", { class: "sand", subclass: "beach" }, 3, Cell.Shore],
    ["landcover", { class: "farmland", subclass: "orchard" }, 3, Cell.Farmland],
    ["landuse", { class: "residential" }, 3, Cell.Urban],
    ["landuse", { class: "basin" }, 3, Cell.Wetland],
    ["water", { class: "river" }, 3, Cell.Water],
    ["waterway", { class: "stream" }, 2, Cell.Water],
    ["transportation", { class: "primary" }, 2, Cell.Road],
    ["transportation", { class: "minor" }, 2, Cell.Street],
    ["transportation", { class: "path", subclass: "footway" }, 2, Cell.Trail],
    ["building", {}, 3, Cell.Building],
  ];
  it.each(cases)("%s %j → %s", (layer, props, geom, cell) => {
    expect(classify(layer, props, geom)?.cell).toBe(cell);
  });

  it("ignores tunnels, rail and points", () => {
    expect(classify("transportation", { class: "primary", brunnel: "tunnel" }, 2)).toBeNull();
    expect(classify("transportation", { class: "rail" }, 2)).toBeNull();
    expect(classify("building", {}, 1)).toBeNull();
  });

  it("paints landuse, then water, then highways, then buildings", () => {
    const order = [
      classify("landuse", { class: "residential" }, 3)!.layer,
      classify("water", { class: "lake" }, 3)!.layer,
      classify("transportation", { class: "primary" }, 2)!.layer,
      classify("building", {}, 3)!.layer,
    ];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(order[0]).toBe(Layer.Landuse);
  });
});

describe("fillPolygon", () => {
  it("fills cells whose centres are inside, even-odd for holes", () => {
    const cells = new Uint8Array(GRID * GRID);
    const outer = new Float32Array([2, 2, 12, 2, 12, 12, 2, 12]);
    const hole = new Float32Array([5, 5, 9, 5, 9, 9, 5, 9]);
    fillPolygon(cells, [outer, hole], 7, 0, GRID - 1);
    const at = (x: number, y: number) => cells[y * GRID + x];
    expect(at(2, 2)).toBe(7);
    expect(at(11, 11)).toBe(7);
    expect(at(12, 12)).toBe(0);
    expect(at(1, 5)).toBe(0);
    expect(at(6, 6)).toBe(0); // hole
    let count = 0;
    for (const v of cells) if (v === 7) count++;
    expect(count).toBe(100 - 16);
  });
});

describe("rasterizeChunk", () => {
  it("maps source-tile units onto the chunk grid at the cell zoom", () => {
    // One building covering the top-left quarter of source tile 0/0 (at zc 14 that is chunk 0,0).
    const q = EXTENT / 4;
    const tile: TileData = {
      x: 0,
      y: 0,
      names: [],
      features: [
        {
          cell: Cell.Building,
          layer: Layer.Building,
          kind: "poly",
          parts: [new Float32Array([0, 0, q, 0, q, q, 0, q])],
          bbox: [0, 0, q, q],
          area: q * q,
        },
      ],
    };
    const g = rasterizeChunk(tile, 14, 0, 0, 9.5);
    const at = (x: number, y: number) => g.cells[(y + MARGIN) * GRID + (x + MARGIN)];
    expect(at(0, 0)).toBe(Cell.Building);
    expect(at(63, 63)).toBe(Cell.Building);
    expect(at(64, 64)).toBe(Cell.Urban);
  });

  it("gives roads a width in cells from metres", () => {
    const tile: TileData = {
      x: 0,
      y: 0,
      names: [],
      features: [
        {
          cell: Cell.Road,
          layer: Layer.Road,
          widthM: 12,
          kind: "line",
          parts: [new Float32Array([0, 400, 4096, 400])],
          bbox: [0, 400, 4096, 400],
          area: 0,
        },
      ],
    };
    // zc 16 → 4× finer than the source: y=400 units → 100 cells. 12 m at 2.4 m/cell → 5 cells.
    const g = rasterizeChunk(tile, 16, 0, 0, 2.4);
    let rows = 0;
    for (let y = 0; y < 256; y++) if (g.cells[(y + MARGIN) * GRID + MARGIN + 50] === Cell.Road) rows++;
    expect(rows).toBe(5);
  });
});

describe("1-bit motifs", () => {
  it("is deterministic and leaves urban ground blank", () => {
    expect(monoInk(Cell.Forest, 10, 20)).toBe(monoInk(Cell.Forest, 10, 20));
    expect(monoInk(Cell.Urban, 3, 3)).toBe(false);
  });
});
