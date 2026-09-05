# 3D methodology (v1 / first draft)

## What is surveyed

- Castle, San Lorenzo, and town-hall **footprints** (OSM)
- Street centrelines and highway class (OSM)
- Relative terrain drop (ASTER + spur description)
- Cemetery polygon, woods, farmland, orchard, meadow (OSM landuse)
- Materials and castle/church **silhouette** from written sources + photos

## What is interpreted

- House lots along streets (procedural densify)
- Window rhythm, shutter colours, chimneys, coppi roofs, eaves, flower boxes
- A few satellite dishes (modern Abruzzo hilltown detail)
- Castle apse, portico, clocks, antenna, merlons (described, not scanned)
- Fountain stand-in for Atteone
- Tree species mix (beech / fir / oak) as instanced meshes, denser in OSM woods
- Distant Maiella / Molise ridgeline (silhouette, not a DEM of the parks)
- Sky via three.js Sky (Preetham) at late-afternoon elevation ~21°

## What this is not

- Not photogrammetry, not a planning survey, not a certified reconstruction
- Not a WWII ruin (the scene shows the **present** pseudo-medieval castle)
- Not medical, cadastral, or navigation-grade
- Large OSM “building” polygons over ~400 m² are skipped (likely poorly
  mapped clusters) so they do not become a single giant roof

The in-app copy labels it a first draft. Later passes should pull Regione
Abruzzo CTR, a cadastre extract, and on-site photography before claiming
lot-accurate houses.
