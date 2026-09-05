# Village geography and layout

## Setting

Gamberale sits on a rocky spur of **Monte Sant'Antonio** (peak 1,352 m, OSM),
on the left bank of the **Sangro**, inside **Maiella National Park**. It is
the highest municipality in the Province of Chieti. Three sides of the spur
fall away; the historic centre is a packed medieval borgo that climbs toward
the castle.

Nearby winter towns: Roccaraso, Rivisondoli, Pizzoferrato. Ski area: Monti
Pizzi / Valle del Sole. A small lake (Lago di Gamberale) sits among beech,
oak and fir. The Area Faunistica del Cervo (red-deer enclosure) is around
1,500 m.

Seismic zone 1 (high). Climate zone F (3,425 heating degree days): long
snow season, short bright summers.

## Historic centre (what the 3D scene covers)

Surveyed pattern from OSM (Overpass, 5 Sep 2026), Wikipedia, and photographs:

1. **Castello / Piazza Castello** — highest point of the old town, SE end of
   the spur. White-plaster keep, stone bastions, battlemented clock tower
   with a radio antenna. One interior hall is used by the comune.
2. **Chiesa di San Lorenzo Martire** — 18th-century single-nave parish church
   with a side campanile, a short walk NW of the castle, at one of the
   village entries. Piazza San Lorenzo. **Casa Pollice** (18th c., three
   floors, limestone portal between buttresses) stands on this piazza.
3. **Town hall** — OSM tags a separate townhall footprint; written sources
   also place municipal meetings inside the castle. Both exist in the scene.
4. **Streets** named in OSM or the stradario:
   - Via Vittorio Emanuele III (OSM)
   - Via Santa Caterina (OSM)
   - Strada Provinciale 226 (OSM, the through-road)
   - Also attested: Via Roma, Via Giuseppe Garibaldi, Via Giuseppe Mazzini,
     Via Vittorio Veneto, Via Principessa Mafalda, Via 20 Settembre,
     Via 24 Maggio, Via Fonte, Via San Domenico, Via della Stazione,
     Piazza Duca degli Abruzzi, Largo 4 Novembre, Strada Comunale della Croce

The 3D draft walks the **historic core** (castle–church ridge), not the
outlying *casali*.

## Frazioni (not modelled in v1)

Casale Stazione, Casale Tesoro, Piane d'Ischia / Piano d'Ischia (Chiesa di
Sant'Antonio, post-WWII), Sant'Antonio, plus casali Mosè, Martini,
Conicella, Panicotti, Bellisari, Ciabacchi, Giardinari, Galeoti, Pollice.

Piano d'Ischia church: single nave, three bays, barrel vault, gable facade,
side campanile.

## Terrain numbers used

ASTER 30 m (OpenTopoData, 5 Sep 2026) is coarse but gives the **drop**:

| Point | Elev. (ASTER) |
| --- | --- |
| Castle area 41.9045, 14.2103 | 1,318 m |
| San Lorenzo 41.9051, 14.2094 | 1,310 m |
| Village node 41.9060, 14.2073 | 1,327 m |
| Monte S. Antonio 41.9033, 14.2072 | 1,315 m |
| East of spur 41.9055, 14.2115 | 1,281 m |

Official comune elevation is **1,343 m**. The scene uses a **relative**
heightfield: village plateau as local zero, castle rock a few metres higher,
steep fall to the east (Sangro / Sant'Angelo del Pesco side) matching the
~35 m ASTER drop over ~150 m.

## Visual character (from photos and descriptions)

- Compact stone-and-plaster houses, 2–3 storeys, terracotta *coppi* roofs
- Narrow streets, some stepped (`highway=steps` in OSM)
- White castle tower reading as the skyline marker, especially in snow
- Beech/fir woods wrapping the spur
- Clear long views to Maiella, Abruzzo National Park, and the Molise hills
