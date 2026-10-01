"""Bouwt data/maps/wereld-49/territories(.geo).json uit standaard-43 (FO §4.5).

Geen Natural Earth-brondata nodig: elk nieuw gebied wordt uit de bestaande, al
geünieerde geometrie gehaald.
- chile/peru: rechtstreeks uit data/territories_extended.geo.json (identiek aan
  standaard-43 op peru na).
- hawaii, azores, philippines: losse eilandpolygonen, verplaatst op ligging.
- west-africa, western-china: één rechte snijlijn door het hoofdland (besluit
  2026-10-01: rechte lijn i.p.v. echte landsgrens); overige losse delen
  (eilanden) gaan als geheel naar de kant van hun middelpunt.

Draaien vanuit de repo-root: python files/build_wereld_49.py
"""
import json
import os

SOURCE = "data/maps/standaard-43"
EXTENDED = "data/territories_extended.geo.json"
TARGET = "data/maps/wereld-49"

# Snijlijnen (lon, lat); "links" van a->b is het westelijke, nieuwe gebied.
WEST_AFRICA_CUT = ((8.9, 4.0), (15.8, 23.4))
WESTERN_CHINA_CUT = ((97.4, 28.3), (100.8, 42.6))

WEST_AFRICA_CODES = ["NGA", "NER", "BEN", "TGO", "GHA", "CIV", "LBR", "SLE",
                     "GIN", "GNB", "SEN", "GMB", "MLI", "BFA"]
WESTERN_CHINA_CODES = ["CN-XJ", "CN-XZ", "CN-QH"]


def parts_of(geometry):
    return geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]


def multipolygon(parts):
    return {"type": "MultiPolygon", "coordinates": parts}


def ring_area_centroid(ring):
    area = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:]):
        cross = x0 * y1 - x1 * y0
        area += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    return area / 2, cx, cy


def centroid(parts):
    """Vlakke, oppervlakte-gewogen centroid in lon/lat — zelfde als shapely's .centroid."""
    total = sx = sy = 0.0
    for poly in parts:
        for index, ring in enumerate(poly):
            area, cx, cy = ring_area_centroid(ring)
            # Buitenring telt positief mee, gaten negatief, ongeacht de oriëntatie.
            sign = 1 if index == 0 else -1
            if (area < 0) == (sign > 0):
                area, cx, cy = -area, -cx, -cy
            total += area
            sx += cx
            sy += cy
    return [round(sx / (6 * total), 2), round(sy / (6 * total), 2)]


def part_centroid(poly):
    return centroid([poly])


def side(point, line):
    (ax, ay), (bx, by) = line
    return (bx - ax) * (point[1] - ay) - (by - ay) * (point[0] - ax)


def clip_ring(ring, line, keep_left):
    """Sutherland–Hodgman tegen één halfvlak; levert een gesloten ring of None."""
    def inside(p):
        return (side(p, line) > 0) == keep_left

    def intersection(p, q):
        sp, sq = side(p, line), side(q, line)
        t = sp / (sp - sq)
        return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]

    out = []
    points = ring[:-1]
    for index, current in enumerate(points):
        previous = points[index - 1]
        if inside(current):
            if not inside(previous):
                out.append(intersection(previous, current))
            out.append(current)
        elif inside(previous):
            out.append(intersection(previous, current))
    if len(out) < 3:
        return None
    return out + [out[0]]


def split_by_line(geometry, line, island_rule):
    """Verdeelt een gebied over (links, rechts). Delen die de lijn kruisen worden
    geknipt; delen die dat niet doen gaan als geheel naar links als island_rule
    (centroid) waar is."""
    left, right = [], []
    for poly in parts_of(geometry):
        outer = poly[0]
        crosses = any((side(p, line) > 0) != (side(q, line) > 0) for p, q in zip(outer, outer[1:]))
        if not crosses:
            (left if island_rule(part_centroid(poly)) else right).append(poly)
            continue
        for keep_left, target in ((True, left), (False, right)):
            clipped_outer = clip_ring(outer, line, keep_left)
            if clipped_outer is None:
                continue
            holes = [hole for hole in poly[1:]
                     if (side(part_centroid([hole]), line) > 0) == keep_left]
            target.append([clipped_outer] + holes)
    return left, right


def main():
    source_meta = json.load(open(f"{SOURCE}/territories.json", encoding="utf-8"))
    source_geo = {f["properties"]["id"]: f["geometry"]
                  for f in json.load(open(f"{SOURCE}/territories.geo.json", encoding="utf-8"))["features"]}
    extended_geo = {f["properties"]["id"]: f["geometry"]
                    for f in json.load(open(EXTENDED, encoding="utf-8"))["features"]}

    meta = {t["id"]: dict(t) for t in source_meta}
    geo = dict(source_geo)
    added = {}  # nieuw gebied -> (bron-gebied, naam, continent, atomicRegions)

    # Chili: kant-en-klaar uit de extended-set.
    geo["peru"] = extended_geo["peru"]
    geo["chile"] = extended_geo["chile"]
    added["chile"] = ("peru", "Chile", "south-america", ["CHL"])

    def move_islands(source_id, new_id, predicate):
        stay, move = [], []
        for poly in parts_of(geo[source_id]):
            (move if predicate(part_centroid(poly)) else stay).append(poly)
        if not move:
            raise SystemExit(f"Geen polygonen gevonden voor {new_id}")
        geo[source_id] = multipolygon(stay)
        geo[new_id] = multipolygon(move)

    move_islands("western-united-states", "hawaii", lambda c: c[0] < -150 and c[1] < 25)
    added["hawaii"] = ("western-united-states", "Hawaii", "north-america", ["US-HI"])

    # Azoren, Madeira en de Canarische eilanden: alles in West-Europa ten westen van 12°W.
    move_islands("western-europe", "azores", lambda c: c[0] < -12)
    added["azores"] = ("western-europe", "Azores", "europe", ["PT-20", "PT-30", "ES-CN"])

    # Filipijnen: noord van 4,6°N, tussen Borneo/Brunei (116,5°O) en de Talaud-eilanden (126,65°O).
    move_islands("indonesia", "philippines", lambda c: c[1] > 4.6 and 116.5 < c[0] < 126.65)
    added["philippines"] = ("indonesia", "Philippines", "australia", ["PHL"])

    # West-Afrika: eilanden ten zuiden van 4,2°N (Bioko, Annobón) blijven bij Congo.
    west, rest = split_by_line(geo["congo"], WEST_AFRICA_CUT,
                               lambda c: side(c, WEST_AFRICA_CUT) > 0 and c[1] > 4.2)
    geo["west-africa"], geo["congo"] = multipolygon(west), multipolygon(rest)
    added["west-africa"] = ("congo", "West Africa", "africa", WEST_AFRICA_CODES)

    west, rest = split_by_line(geo["china"], WESTERN_CHINA_CUT,
                               lambda c: side(c, WESTERN_CHINA_CUT) > 0)
    geo["western-china"], geo["china"] = multipolygon(west), multipolygon(rest)
    added["western-china"] = ("china", "Western China", "asia", WESTERN_CHINA_CODES)

    # Bron-gebieden de verhuisde atomaire regio's afnemen.
    for new_id, (source_id, _, _, codes) in added.items():
        meta[source_id]["atomicRegions"] = [c for c in meta[source_id]["atomicRegions"] if c not in codes]

    # Volgorde: elk nieuw gebied direct na het gebied waaruit het is afgesplitst.
    order = []
    for t in source_meta:
        order.append(t["id"])
        order.extend(new_id for new_id, (source_id, *_rest) in added.items() if source_id == t["id"])
    for new_id, (_, name, continent, codes) in added.items():
        meta[new_id] = {"id": new_id, "name": name, "continent": continent, "atomicRegions": codes}

    changed = {"peru", "chile", "western-united-states", "hawaii", "western-europe", "azores",
               "indonesia", "philippines", "congo", "west-africa", "china", "western-china"}
    for tid in changed:
        meta[tid]["centroid"] = centroid(parts_of(geo[tid]))

    os.makedirs(TARGET, exist_ok=True)
    territories = [{k: meta[tid][k] for k in ("id", "name", "continent", "atomicRegions", "centroid")}
                   for tid in order]
    with open(f"{TARGET}/territories.json", "w", encoding="utf-8") as f:
        json.dump(territories, f, indent=2)
    features = [{"type": "Feature",
                 "properties": {"id": tid, "name": meta[tid]["name"], "continent": meta[tid]["continent"],
                                "centroid": meta[tid]["centroid"]},
                 "geometry": geo[tid]} for tid in order]
    with open(f"{TARGET}/territories.geo.json", "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f)

    print(f"Weggeschreven: {len(order)} gebieden naar {TARGET}")
    for tid in sorted(changed):
        print(f"  {tid:24} delen={len(parts_of(geo[tid])):4}  centroid={meta[tid]['centroid']}")


if __name__ == "__main__":
    main()
