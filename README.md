# naturedex

Naturedex is a mobile web game that mixes a **radar**, **Pokémon Go** and a **Tamagotchi**, built on real nature data.

Walk around a pixel-art map generated from OpenStreetMap, find species that people have really reported nearby on iNaturalist, and collect them in your Field Dex as pixel creatures.

- **Requirements and roadmap:** [REQUIREMENTS.md](REQUIREMENTS.md)
- **Designs:** `naturedex_design_system.pen` (open it with [Pencil](https://pencil.dev))

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS v4 · deployed on Vercel. Design tokens live in [`src/styles/tokens.css`](src/styles/tokens.css) and mirror the `.pen` variables. Set `data-tone="mono"` on `<html>` for the 1-bit palette.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000, best viewed at 390×844 in device mode
npm run lint
npm run build
```

Every push to `main` deploys to production on Vercel, and every other branch gets a preview URL.

## Data and attribution

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, available under the ODbL.
- Observation data and photos from [iNaturalist](https://www.inaturalist.org). Each photo keeps its own licence and observer credit.
