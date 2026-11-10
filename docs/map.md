# The India map

The Map page now draws a geographic map of India's 28 states and 8 union territories, coloured by CPCB % treated, MoHUA % processed, or the gap. A "Tiles" switch gives the earlier tile-grid map, which is easier for tiny units and never touches the question of borders. The choice is remembered in the browser. Tiny units (Delhi, Chandigarh, Goa, Puducherry, Lakshadweep, Dadra and Nagar Haveli and Daman and Diu, the Andaman and Nicobar Islands) also get round pins so they can be seen and tapped. Keyboard: one unit is in the tab order, the arrow keys move to the nearest unit in that direction, Enter selects.

Files: `web/app/geomap.js` (drawing), `web/app/geomap.css`, `web/app/india.js` (outlines, generated), `scripts/build_india_map.py` (builds `india.js`).

## Where the outlines come from
`india_states.geojson` from https://github.com/Tanmay53/india-state-boundries-geojson , fetched through Git LFS on 2026-11-10 (164 MB, 36 features). The repository states it is under Apache 2.0 and thanks mapshaper.org. It does not say where the boundaries originally come from. We simplified it with `scripts/build_india_map.py` (about 193 KB). The 164 MB original is not kept in this repo.

## Read this before showing the map publicly
- **Boundaries are not verified.** India treats its external boundary, especially around Jammu and Kashmir, Ladakh and Arunachal Pradesh, as a matter of law and policy, and many open maps draw it differently. The map in this file extends Ladakh into the north-west and north-east areas that India's official map includes, and shows Arunachal Pradesh whole; that is what we saw on screen. **We did not compare it with a Survey of India map**, and the dataset's origin is unstated. Someone who can judge this must check it against the official depiction before the map is shown in a deployed app, a video or a submission. The footer on the map says "outlines simplified, not an authoritative boundary".
- **Licence.** We rely on the repository's Apache 2.0 statement. We could not confirm the licence of the underlying boundary data. Two other candidates were not used: one has no licence at all (`udit-001/india-maps-data`), and Natural Earth's default draws India's borders differently.
- **Simplification.** Coastlines and borders are simplified (a few kilometres), so it is not suitable for measurement.
- **Names.** The 36 names match the dataset exactly (28 states and 8 UTs, with Ladakh separate and the two Dadra and Daman units merged).
- If the boundary check fails, switch the default to Tiles: set `VIEW` in `web/app/app.js` to default to `"tiles"`, or delete `india.js`, and the page falls back to the tile map without other changes.
