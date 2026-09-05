# Gamberale

Walkable first-person 3D recreation of **Gamberale**, the highest village in the
Province of Chieti, Abruzzo (1,343 m, Maiella National Park).

Live: [aditano.github.io/Gamberale](https://aditano.github.io/Gamberale/)

This is a **first draft**. Landmark footprints and streets come from
OpenStreetMap. House packing in the historic core is densified because OSM only
maps a few dozen buildings. Materials and the castle/church silhouettes follow
photographs and written descriptions, not photogrammetry.

## Look around

- Click **Walk the village**, then look with the mouse
- **WASD** walk, **Shift** hurry, **Esc** release the pointer
- On a phone: left side moves, right side looks
- Jump to San Lorenzo, the castle, the piazza, or the ridge
- **Research notes** in the overlay for the dossier that built the scene

## Research

Everything used to build the scene is in [`research/`](./research/README.md):
geography, history, architecture, economy, visual notes, OSM notes, sources.

Processed map: [`public/data/gamberale.json`](./public/data/gamberale.json)
(ODbL 1.0 for OSM-derived geometry).

## GitHub Pages

The site deploys from GitHub Actions (`dist/`). A static copy also lives in
`docs/` so the repo can be served from `main /docs` if needed.

## Run locally

```
npm install
npm run dev
```

## Stack

Three.js, React, Vite. Procedural canvas textures. Preetham sky. No photogrammetry scans.
