// Map colour tokens for the canvas renderer (mirrors --map-* in src/styles/tokens.css).

export type Tone = "color" | "mono";

export type MapToken =
  | "park"
  | "wood"
  | "water"
  | "shore"
  | "road"
  | "roadLine"
  | "roadEdge"
  | "build"
  | "buildEdge"
  | "path";

const INK = "#452435";
const PAPER = "#ddedd5";

export const MAP_PALETTE: Record<Tone, Record<MapToken, string>> = {
  color: {
    park: "#a3c596",
    wood: "#567f4c",
    water: "#b7dcef",
    shore: "#f5e1a4",
    road: "#d3bcc8",
    roadLine: "#f1f8ec",
    roadEdge: "#b08ba0",
    build: "#c9b6e4",
    buildEdge: "#7a4e9e",
    path: "#f5e1a4",
  },
  mono: {
    park: PAPER,
    wood: INK,
    water: INK,
    shore: INK,
    road: PAPER,
    roadLine: INK,
    roadEdge: INK,
    build: PAPER,
    buildEdge: INK,
    path: INK,
  },
};
