"""Build web/app/india.js (simplified state and UT outlines for the geographic map) from a full-resolution states GeoJSON.

Source file used: india_states.geojson from https://github.com/Tanmay53/india-state-boundries-geojson (served through Git LFS; 164 MB; 36 features:
28 states and 8 union territories, with Ladakh and the merged Dadra and Nagar Haveli and Daman and Diu). The repository states the data is under Apache 2.0
and thanks mapshaper.org; it does not say where the boundaries come from. We have not verified the boundary against Survey of India. See docs/map.md.
The 164 MB file is NOT kept in the repo. Usage (repo root):  python scripts/build_india_map.py path/to/india_states.geojson

Method: equirectangular projection with x = longitude * cos(23 deg) and y = -latitude; points closer than 0.012 degrees are dropped, then
Ramer-Douglas-Peucker at 0.025 degrees; rings smaller than a threshold are dropped (island UTs keep theirs, every unit keeps its largest ring).
Output defines window.KS_INDIA = {vb, states: {name: {d: svg path, c: [x, y] centroid of the largest ring, a: area}}, source}.
"""
import json
import math
import sys

COS = math.cos(math.radians(23))
NAME = {"Andaman & Nicobar": "Andaman and Nicobar Islands", "Jammu & Kashmir": "Jammu and Kashmir"}
ISLAND_UT = {"Andaman and Nicobar Islands", "Lakshadweep"}


def state_name(props):
    n = props.get("NAME_1") or props.get("ST_NM") or props.get("name")
    if isinstance(props, dict) and n is None:
        n = [v for v in props.values() if isinstance(v, str)][0]
    return NAME.get(n, n)


def radial(pts, tol):
    out, last = [pts[0]], pts[0]
    for p in pts[1:-1]:
        if (p[0] - last[0]) ** 2 + (p[1] - last[1]) ** 2 >= tol * tol:
            out.append(p)
            last = p
    out.append(pts[-1])
    return out


def rdp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy) or 1e-12
        dmax, idx = 0.0, -1
        for i in range(a + 1, b):
            d = abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / norm
            if d > dmax:
                dmax, idx = d, i
        if dmax > tol and idx > 0:
            keep[idx] = True
            stack.append((a, idx))
            stack.append((idx, b))
    return [p for p, k in zip(pts, keep) if k]


def ring_rdp(pts, tol):
    """RDP for a closed ring: split at the point farthest from the start, simplify both halves, rejoin (plain RDP collapses a ring whose ends coincide)."""
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) < 4:
        return pts
    x0, y0 = pts[0]
    i = max(range(len(pts)), key=lambda k: (pts[k][0] - x0) ** 2 + (pts[k][1] - y0) ** 2)
    return rdp(pts[: i + 1], tol)[:-1] + rdp(pts[i:] + [pts[0]], tol)[:-1]


def area(r):
    return abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2


def centroid(r):
    a = sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))
    if abs(a) < 1e-12:
        return [sum(p[0] for p in r) / len(r), sum(p[1] for p in r) / len(r)]
    cx = sum((r[i][0] + r[i - 1][0]) * (r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1]) for i in range(len(r))) / (3 * a)
    cy = sum((r[i][1] + r[i - 1][1]) * (r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1]) for i in range(len(r))) / (3 * a)
    return [cx, cy]


def polys(g):
    if g["type"] == "Polygon":
        return [g["coordinates"]]
    return g["coordinates"]


def main():
    src = json.load(open(sys.argv[1], encoding="utf-8"))
    states, xs, ys = {}, [], []
    for f in src["features"]:
        name = state_name(f["properties"])
        rings = []
        for poly in polys(f["geometry"]):
            ring = [(p[0] * COS, -p[1]) for p in poly[0]]            # outer ring only: no holes needed at this scale
            rings.append(ring)
        rings.sort(key=area, reverse=True)
        keep = []
        for k, r in enumerate(rings):
            a = area(r)
            thr = 0.00002 if name in ISLAND_UT else 0.0006
            if k == 0 or a >= thr:
                rt, dt = (0.012, 0.025) if a > 3 else (0.006, 0.012) if a > 0.3 else (0.0006, 0.0012)    # coarser for big states, fine for tiny units
                s = ring_rdp(radial(r, rt), dt)
                if len(s) < 3:
                    s = r[:: max(1, len(r) // 12)]
                if len(s) >= 3:
                    keep.append(s)
        d = "".join("M" + "L".join(f"{x:.2f},{y:.2f}" for x, y in r) + "Z" for r in keep)
        c = centroid(keep[0])
        states[name] = {"d": d, "c": [round(c[0], 2), round(c[1], 2)], "a": round(sum(area(r) for r in keep), 3)}
        for r in keep:
            xs += [p[0] for p in r]
            ys += [p[1] for p in r]
    vb = [round(min(xs) - 0.5, 2), round(min(ys) - 0.5, 2), round(max(xs) - min(xs) + 1, 2), round(max(ys) - min(ys) + 1, 2)]
    out = {"vb": vb, "states": states, "source": "Tanmay53/india-state-boundries-geojson (Apache-2.0 per the repository; origin of the boundaries not stated). Simplified. Not an authoritative boundary."}
    open("web/app/india.js", "w", encoding="utf-8").write("window.KS_INDIA = " + json.dumps(out, separators=(",", ":")) + ";\n")
    print(len(states), "units; viewBox", vb, "; file", round(len(json.dumps(out)) / 1024), "KB")


if __name__ == "__main__":
    main()
