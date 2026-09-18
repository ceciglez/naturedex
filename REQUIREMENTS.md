# Naturedex: Requirements

_Living document. Last updated 2026-09-18. Status: **draft**. Screen-level requirements are provisional until the UX flows in `naturedex_design_system.pen` are finished._

## 1. Concept

Naturedex is a mobile web game that mixes a **radar**, **Pokémon Go** and a **Tamagotchi**, built on real nature data.

- You walk around a **pixel-art map** of your surroundings, generated from OpenStreetMap.
- Real species that people have reported nearby on **iNaturalist** show up as creatures on the map and in a radar.
- You encounter and log them in your **Field Dex**. Each species appears as a procedurally generated pixel creature.
- You keep **field notes** and **sketches** of what you find.
- A **Tamagotchi-style layer** (a pet or companion) gives you a reason to come back. _Mechanics to be defined from the flows._

## 2. Design source

All visual design lives in `naturedex_design_system.pen` (open it with the Pencil app).

| Area | Frame in .pen | Notes |
|---|---|---|
| Tokens | Variables | Plum & Mint palette; `tone` theme with `color` and `mono` (1-bit) modes |
| Fonts | Variables | `font-display` Press Start 2P · `font-ui` Silkscreen · `font-body` DotGothic16 |
| Spacing | Variables | `px` 4 · `gap-sm` 8 · `gap-md` 16 · `gap-lg` 24 |
| Components | Design System › 00 · Components, 02 · UI Kit | Includes the reusable `State / Message` |
| Map | 09 · OSM → Map Texture, 09 · Map Engine | Tag → cell class table (see §5) |
| Creatures | 04 · Creature Atlas, 05 · Taxonomy → Sprite, 08 · Creature Scale | Procedural sprite system (see §6) |
| Screens | v2 · Screens (Plum & Mint · component-built) | Current source of truth. v1 and Archive frames are superseded |
| Flows | v2 › UX FLOWS & FEATURE DOCS | **In progress** |

The design frame size is **390 × 844** (iPhone 12–15 class).

## 3. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Platform | Mobile-first web app, installable (PWA) | No app store needed; works on any phone |
| Framework | Next.js (App Router) + TypeScript | Small server routes cache API data and can later hold the iNat login secret |
| Hosting | Vercel, Hobby (free) plan | Free for personal, non-commercial use at hobby scale |
| Repo | `github.com/ceciglez/naturedex` | Every push to `main` deploys automatically |
| Persistence (v1) | On the device only (IndexedDB) | No accounts; fast to ship; works offline |
| iNaturalist login | Later milestone ("Share to iNaturalist") | iNat suits real sightings, not game state or sketches |

## 4. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js App Router, TypeScript, npm |
| Styling | Tailwind CSS v4 + CSS custom properties generated from the .pen variables. Tone switches through `data-tone="color" \| "mono"` on `<html>` |
| Fonts | `next/font/google`: Press Start 2P, Silkscreen, DotGothic16 |
| Map rendering | Custom `<canvas>` renderer on a pixel cell grid (no slippy-map library) |
| Map data | OpenStreetMap through the Overpass API, proxied at `/api/osm` and cached at Vercel's edge |
| Species data | iNaturalist API v1, proxied at `/api/inat/*` with short caching |
| State | Zustand (UI); Dexie / IndexedDB (Dex, pet, notes, sketches) |
| Device | Geolocation `watchPosition`; Device Orientation for the radar heading |
| Offline / install | Web app manifest + service worker (Serwist) |
| Quality | ESLint, Prettier, Vitest (unit), Playwright (smoke test at 390×844) |

## 5. Map engine

- OSM features are rasterized onto a **square cell grid**. Every cell resolves to exactly **one class**. The class sets the cell's colour token, its 1-bit motif, and the **biome** that decides which creatures can spawn there.
- Tags resolve in priority order: **landuse polygons → water → highways → buildings**. Unmatched areas fall back to **URBAN**.

| OSM tags | Token | Spawns / role |
|---|---|---|
| `leisure=park` · `landuse=grass` · `leisure=garden` | `map-park` | MEADOW · GARDEN |
| `natural=wood` · `landuse=forest` | `map-wood` | FOREST |
| `natural=water` · `waterway=river/riverbank` | `map-water` | RIVER · POND |
| `natural=wetland` · `natural=marsh` · `landuse=basin` | `map-shore` | WETLAND |
| `natural=beach` · `natural=sand` | `map-shore` | SHORE |
| `natural=scrub` · `natural=heath` | `map-wood` | SCRUB |
| `landuse=meadow` · `landuse=farmland` · `landuse=orchard` | `map-park` | MEADOW / FARMLAND |
| `highway=primary\|trunk\|secondary\|residential\|service` | `map-road` | Impassable, no spawns |
| `highway=footway\|path\|cycleway` | `map-path` | Corridor, +spawn |
| `building=*` · `building:part` | `map-build` | URBAN |
| `landuse=residential\|retail\|commercial` (fallback) | `map-build` | URBAN |

**Zoom:** the on-screen cell is always **6 px**. Zooming changes how much ground a cell covers and which creature tier the markers use.

| Zoom | Name | 1 cell = | Markers |
|---|---|---|---|
| z19 | Street | 1.2 m | T3 · 72 px + label |
| z18 | Walk (**default**) | 2.4 m | T2 · 48 px |
| z17 | Park | 4.8 m | T1 · 24 px blip |
| z16 | District | 9.5 m | Cluster count badge |

Sprites are drawn only at whole-number multiples, so they are never resampled.

## 6. Creature sprite system

Every iNaturalist taxon ID resolves **deterministically** to a sprite, so no species ever needs hand-drawn art.

| Taxon rank | → | Sprite layer |
|---|---|---|
| Iconic taxon | → | **Base class** (12 classes: body plan, gait, idle animation) |
| Family | → | **Silhouette** (2–6 per class: proportions, limbs, wings, shell) |
| Genus / species | → | **Skin**: palette remap × pattern mask × size tier |

- 12 iconic taxa × 2–6 family silhouettes = **46 base sprites**, each with 4 palette slots, 3 pattern masks and 3 size tiers, for **≈ 1,650 distinct creatures**.
- **Fallback:** unmatched taxa use the next rank up, so a species with no skin still shows the correct family silhouette.
- Each creature gets a playful display name (e.g. _Monark_ for _Danaus plexippus_) alongside its real common and scientific names.

## 7. Screens and features (v1, provisional)

| # | Screen | Requirements |
|---|---|---|
| 1 | **Title** | Start game; explain and request location permission |
| 2 | **Map** (home) | Pixel map centred on the player; tiered creature markers; zoom z16–z19; **Radar drawer** (pull-up); **1-Bit** tone toggle |
| 3 | **Encounter** | Tap a nearby creature to see it and log / catch it |
| 4 | **New Species** | Celebration on the first sighting of a species |
| 5 | **Field Dex** | Grid of collected species; search and filter |
| 6 | **Species** | Taxon info from iNat; the player's own sightings; **Community** tab with recent nearby iNat observations |
| 7 | **Field Note** | Text note attached to a sighting (on the device) |
| 8 | **Sketch Pad** | Pixel drawing canvas attached to a sighting (on the device) |
| 9 | **Tamagotchi layer** | _To be defined from the flows_ |

**Empty and error states**, all built on the `State / Message` component:
- Map › Location Denied
- Radar › Nothing Nearby
- Radar › Cannot Reach Service
- Field Dex › Empty
- Field Dex › No Results
- Field Dex › Offline
- Community › Empty

**Out of scope for v1:** the smartwatch screens (Radar, Ping, Dex), accounts and cloud sync, and posting to iNaturalist.

## 8. Non-functional requirements

- **Mobile-first:** designed at 390 × 844, usable from 360 px wide, safe-area aware.
- **HTTPS required** for geolocation and orientation (Vercel provides it).
- **Privacy:** the player's location is never stored on a server; API proxies receive only tile or area coordinates.
- **Respect the APIs:** cache OSM tiles for about a week and iNat responses for minutes; send an identifying User-Agent; stay within iNat's recommended rate (about 1 request per second).
- **Attribution:** show "© OpenStreetMap contributors" on the map, and each iNat photo's licence and observer credit.
- **Offline:** the Field Dex, notes and sketches work without a connection.
- **Accessibility:** readable contrast in both tones, 44 px touch targets, and screen-reader labels on creatures and controls.
- **Cost:** stay within Vercel's Hobby free tier.

## 9. Milestones

| Milestone | Scope |
|---|---|
| **M0** Foundation | Repo, Next.js scaffold, design tokens + fonts, placeholder Title screen, Vercel deploy on push |
| **M1** Map engine | Overpass proxy, tag → cell classifier (unit-tested against §5), canvas renderer with colour + 1-bit motifs, geolocation, zoom |
| **M2** Spawns + Radar | iNat nearby observations → biome-filtered spawns; radar drawer; tiered markers |
| **M3** Sprites | Export base sprites and masks from the .pen file; taxon → sprite resolver; palette remap |
| **M4** Core loop | Encounter → New Species → Field Dex → Species + Community; IndexedDB |
| **M5** Companion & polish | Field Note, Sketch Pad, Tamagotchi layer, empty/error states, PWA offline |
| **M6** Post-v1 | iNaturalist OAuth + "Share sighting"; optional cloud sync |

## 10. Open questions

- [ ] UX flows: finish them in the .pen file, then refine §7.
- [ ] Tamagotchi layer: what is the pet, what does it need, and how do sightings feed it?
- [ ] Encounter mechanic: is it a simple "log", a mini-game, or does it require being within X metres?
- [ ] Spawn rules: how many creatures, how often they refresh, and the radius and research-grade filters.
- [ ] Are the local pixel fonts in `images/` (Pixel Operator, Minecraftia, Daydream) used anywhere, or only the three Google fonts?
- [ ] iNaturalist app registration requirements, to check before M6.
