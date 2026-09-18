// Map colours for the canvas renderer. Values mirror the --map-* and palette tokens in
// src/styles/tokens.css (the canvas can't read CSS variables per pixel).
import { Cell } from "./classes";

export type Tone = "color" | "mono";

export const INK = "#452435";
export const PAPER = "#ddedd5";

export interface MapPalette {
  cell: Record<Cell, string>;
  roadEdge: string;
  roadLine: string;
  buildEdge: string;
  shore: string;
  /** Farmland furrows / wetland speckle. */
  accent: Partial<Record<Cell, string>>;
}

export const MAP_PALETTE: Record<Tone, MapPalette> = {
  color: {
    cell: {
      [Cell.Urban]: "#ddedd5", // alt-paper: pale ground so buildings and roads read clearly
      [Cell.Park]: "#a3c596", // map-park
      [Cell.Meadow]: "#c2ddb6", // cloud
      [Cell.Farmland]: "#c2ddb6",
      [Cell.Forest]: "#567f4c", // map-wood
      [Cell.Scrub]: "#7fa872", // grass
      [Cell.Wetland]: "#a5dcd8", // alt-aqua
      [Cell.Shore]: "#f5e1a4", // map-shore
      [Cell.Water]: "#b7dcef", // map-water
      [Cell.Trail]: "#f5e1a4", // map-path
      [Cell.Street]: "#d3bcc8", // map-road
      [Cell.Road]: "#d3bcc8",
      [Cell.Building]: "#c9b6e4", // map-build
    },
    roadEdge: "#b08ba0", // map-road-edge
    roadLine: "#f1f8ec", // map-road-line
    buildEdge: "#7a4e9e", // map-build-edge
    shore: "#f5e1a4",
    accent: { [Cell.Farmland]: "#a3c596", [Cell.Wetland]: "#7fa872" },
  },
  mono: {
    cell: {
      [Cell.Urban]: PAPER,
      [Cell.Park]: PAPER,
      [Cell.Meadow]: PAPER,
      [Cell.Farmland]: PAPER,
      [Cell.Forest]: PAPER,
      [Cell.Scrub]: PAPER,
      [Cell.Wetland]: PAPER,
      [Cell.Shore]: PAPER,
      [Cell.Water]: PAPER,
      [Cell.Trail]: PAPER,
      [Cell.Street]: PAPER,
      [Cell.Road]: PAPER,
      [Cell.Building]: PAPER,
    },
    roadEdge: INK,
    roadLine: INK,
    buildEdge: INK,
    shore: INK,
    accent: {},
  },
};
