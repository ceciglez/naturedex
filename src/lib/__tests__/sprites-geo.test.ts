import { describe, expect, it } from "vitest";
import { ATLAS } from "../sprites/atlas";
import { resolveSprite } from "../sprites/resolve";
import { bearingDeg, distanceM, fromWorldPx, worldPx, compass } from "../geo/mercator";

describe("atlas", () => {
  it("has 18 creatures that stay inside the 18×18 grid", () => {
    expect(ATLAS).toHaveLength(18);
    for (const c of ATLAS) {
      for (const [, x, y, w, h] of c.rects) {
        expect(x + w).toBeLessThanOrEqual(18);
        expect(y + h).toBeLessThanOrEqual(18);
      }
    }
  });
});

describe("resolveSprite", () => {
  it("returns the drawn creature for its exemplar species", () => {
    const r = resolveSprite({ id: 1, name: "Danaus plexippus", iconic: "Insecta" });
    expect(r.creature.key).toBe("Monark");
    expect(r.match).toBe("exemplar");
  });

  it("matches the family silhouette through ancestor ids", () => {
    const r = resolveSprite({ id: 48662, name: "Vanessa atalanta", iconic: "Insecta", ancestorIds: [1, 47158, 47922, 48662] });
    expect(r.creature.key).toBe("Monark");
    expect(r.match).toBe("family");
  });

  it("falls back a rank to the iconic taxon", () => {
    const r = resolveSprite({ id: 12345, name: "Turdus migratorius", iconic: "Aves", ancestorIds: [1, 3] });
    expect(r.creature.key).toBe("Jaybit");
    expect(r.match).toBe("iconic");
  });

  it("is deterministic per taxon", () => {
    const t = { id: 777, name: "X y", iconic: "Plantae", ancestorIds: [47126, 47604] };
    expect(resolveSprite(t)).toEqual(resolveSprite(t));
  });
});

describe("mercator", () => {
  it("round-trips world pixels", () => {
    const p = { lat: 40.7812, lng: -73.9665 };
    const w = worldPx(p, 16);
    const back = fromWorldPx(w.x, w.y, 16);
    expect(back.lat).toBeCloseTo(p.lat, 6);
    expect(back.lng).toBeCloseTo(p.lng, 6);
  });

  it("measures distance and bearing", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 0.001 };
    expect(distanceM(a, b)).toBeCloseTo(111.2, 0);
    expect(compass(bearingDeg(a, b))).toBe("E");
  });
});
