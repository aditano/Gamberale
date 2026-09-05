# OSM → scene

## Projection

- Origin: 41.90515 N, 14.20955 E (between San Lorenzo and the castle)
- +X = east, −Z = north, +Y = up
- Metres: `x = Δlon · 111320 · cos(lat)`, `z = −Δlat · 110540`

## Extract (Overpass, 5 Sep 2026)

Around 450 m of 41.9045, 14.2103:

- 34 building ways
- 47 highway ways (residential 20, track 10, service 10, footway 2, steps 2, tertiary 2, secondary 1)
- Named streets: Via Vittorio Emanuele III, Via Santa Caterina, SP 226
- Landmarks: castle (historic=castle), San Lorenzo (place_of_worship + wikipedia), townhall
- Woods, farmland, cemetery, orchard, meadow, two leisure pitches
- Village place node, Monte S. Antonio peak

Raw processed dataset: `/data/gamberale.json` (also `public/data/gamberale.json` in this app).

## Densification

OSM building coverage is far below a packed Abruzzese borgo. Extra houses
(`source: "densify"`) are dropped along residential / footway / service
centreline offsets (~5.6–7 m) inside a 95 m radius, rejecting overlaps
with OSM footprints. They are **not** cadastral lots. Landmarks are never
invented: castle, church, and town hall stay on OSM polygons.

## Known gaps for a later draft

- Many named streets from the stradario are missing in OSM
- Castle OSM polygon is the keep, not bastions + piazza
- No LiDAR / cadastre
- No interior spaces
- Frazioni, lake, ski plant, deer enclosure are out of the walkable tile
