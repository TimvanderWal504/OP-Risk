import json
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
from shapely.affinity import scale

ADMIN0 = json.load(open("admin0_50m.geojson"))
ADMIN1 = json.load(open("admin1_50m.geojson"))

BIG9 = {"RUS", "USA", "CAN", "AUS", "ZAF", "CHN", "BRA", "IND", "IDN"}

# --- Bouw de atomaire regio-laag -------------------------------------------
atomic = {}         # atomic_id -> shapely geometry
atomic_meta = {}     # atomic_id -> {"name":..., "lon":..., "lat":...}

for f in ADMIN0["features"]:
    p = f["properties"]
    a3 = p["ADM0_A3"]
    if a3 in BIG9:
        continue  # deze landen komen uit admin1, niet als heel land
    geom = shape(f["geometry"])
    # Exclaves (overzeese gebiedsdelen ver van het hoofdland, bv. Frans-Guyana/Réunion bij
    # Frankrijk, Aruba/Curaçao bij Nederland) uitsluiten: anders "raakt" zo'n land opeens
    # een compleet ander continent in de adjacency-data.
    if geom.geom_type == "MultiPolygon" and len(geom.geoms) > 1:
        parts = sorted(geom.geoms, key=lambda g: -g.area)
        main = parts[0]
        main_c = main.centroid
        kept = [main] + [g for g in parts[1:] if g.centroid.distance(main_c) < 18]
        geom = unary_union(kept)
    if a3 in atomic:
        atomic[a3] = unary_union([atomic[a3], geom])
    else:
        atomic[a3] = geom
        atomic_meta[a3] = {"name": p["NAME"]}

for f in ADMIN1["features"]:
    p = f["properties"]
    code = p["iso_3166_2"]
    geom = shape(f["geometry"])
    atomic[code] = geom
    atomic_meta[code] = {"name": p["name"], "lon": p["longitude"], "lat": p["latitude"], "country": p["adm0_a3"]}

print(f"Atomaire regio's geladen: {len(atomic)}")

# --- Programmatische band-indeling voor Rusland en de VS -------------------
# Klassieke Risk-lay-out: Ural en Siberië zijn verticale banden over de volle
# hoogte (Siberië grenst daardoor aan Mongolië/China), Yakutsk (noord) en
# Irkutsk (zuid) liggen oostelijker, Kamchatka is het verre oosten.
def russia_group(code):
    m = atomic_meta[code]
    lon, lat = m["lon"], m["lat"]
    if lon < 0:
        lon += 360  # datumgrens (Tsjoekotka)
    if lon < 60:
        return "ukraine"
    if lon < 85:
        return "ural"
    if lon < 110:
        return "siberia"
    if lon < 145:
        return "yakutsk" if lat >= 58 else "irkutsk"
    return "kamchatka"

def us_group(code):
    m = atomic_meta[code]
    if code == "US-AK":
        return "alaska"
    return "western-united-states" if m["lon"] < -95 else "eastern-united-states"

auto_groups = {}  # atomic_id -> territory_id, voor RUS + USA
for code, m in atomic_meta.items():
    if m.get("country") == "RUS":
        auto_groups[code] = russia_group(code)
    elif m.get("country") == "USA":
        auto_groups[code] = us_group(code)

# --- Handmatige groepering: welke atomaire regio's vormen elk Risk-gebied --
# (Canada / Australië / Indonesië / rest van de wereld: vaste lijst per gebied)
MANUAL_GROUPS = {
    # Noord-Amerika
    "northwest-territory": ["CA-NT", "CA-NU", "CA-YT"],
    "greenland": ["GRL"],
    "alberta": ["CA-BC", "CA-AB", "CA-SK"],
    "ontario": ["CA-ON", "CA-MB"],
    "quebec": ["CA-QC", "CA-NB", "CA-NS", "CA-PE", "CA-NL"],
    "central-america": ["MEX", "GTM", "BLZ", "HND", "SLV", "NIC", "CRI", "PAN",
                          "CUB", "HTI", "DOM", "JAM", "BHS", "PRI", "TTO"],
    # Zuid-Amerika
    "venezuela": ["VEN", "GUY", "SUR", "COL"],
    "peru": ["PER", "ECU", "BOL", "CHL"],
    "brazil": ["BR_ALL"],
    "argentina": ["ARG", "URY", "PRY", "FLK"],
    # Europa
    "iceland": ["ISL"],
    "great-britain": ["GBR", "IRL"],
    "scandinavia": ["SWE", "NOR", "FIN", "DNK"],
    "western-europe": ["FRA", "ESP", "PRT"],
    "northern-europe": ["DEU", "POL", "CZE", "SVK", "AUT", "CHE", "BEL", "NLD", "LUX", "HUN"],
    "southern-europe": ["ITA", "GRC", "ALB", "SRB", "HRV", "BIH", "MNE", "MKD", "BGR", "ROU", "TUR",
                          "SVN", "KOS", "CYP", "CYN", "MLT"],
    # Afrika
    "north-africa": ["MAR", "DZA", "TUN", "LBY", "MRT", "SAH"],
    "egypt": ["EGY", "SDN"],
    "east-africa": ["ETH", "ERI", "DJI", "SOM", "SOL", "KEN", "UGA", "TZA", "RWA", "BDI", "SDS"],
    "congo": ["COD", "COG", "CAF", "CMR", "GAB", "GNQ", "AGO", "ZMB", "MWI", "TCD",
              "NER", "NGA", "BEN", "TGO", "GHA", "CIV", "LBR", "SLE", "GIN", "GNB",
              "SEN", "GMB", "MLI", "BFA"],
    "south-africa": ["AU_ZA_ALL", "NAM", "BWA", "ZWE", "LSO", "SWZ", "MOZ"],  # AU_ZA_ALL wordt hieronder vervangen
    "madagascar": ["MDG"],
    # Azië
    "mongolia": ["MNG"],
    "china": ["CN_ALL", "PRK", "KOR", "TWN"],  # wordt hieronder vervangen door alle CN-* admin1 codes
    "japan": ["JPN"],
    "middle-east": ["SAU", "IRQ", "IRN", "YEM", "OMN", "ARE", "QAT", "KWT", "BHR", "JOR", "SYR", "LBN", "ISR", "PSX"],
    "india": ["IN_ALL", "BGD", "BTN", "NPL", "LKA", "PAK"],  # IN_ALL -> alle IN-* admin1 codes
    "siam": ["THA", "MMR", "LAO", "KHM", "VNM", "MYS", "SGP"],
    "afghanistan": ["AFG", "TKM", "UZB", "TJK", "KGZ", "KAZ"],
    # Australië
    "western-australia": ["AU-WA"],
}

# Landen die als geheel bij het admin1-niveau horen (CN, IN, ZA, BR) volledig invullen:
for placeholder, country in [("CN_ALL", "CHN"), ("IN_ALL", "IND"), ("AU_ZA_ALL", "ZAF"), ("BR_ALL", "BRA")]:
    codes = [c for c, m in atomic_meta.items() if m.get("country") == country]
    for group, lst in MANUAL_GROUPS.items():
        if placeholder in lst:
            lst.remove(placeholder)
            lst.extend(codes)

# Indonesië: Papua-provincies gaan naar New Guinea, de rest naar Indonesië
idn_codes = [c for c, m in atomic_meta.items() if m.get("country") == "IDN"]
papua_codes = [c for c in idn_codes if c in ("ID-PA", "ID-PB")]
indonesia_codes = [c for c in idn_codes if c not in papua_codes]
MANUAL_GROUPS["indonesia"] = indonesia_codes + ["TLS", "PHL", "BRN"]
MANUAL_GROUPS["new-guinea"] = papua_codes + ["PNG"]

# Australië: alles behalve WA is "eastern-australia"
aus_codes = [c for c, m in atomic_meta.items() if m.get("country") == "AUS"]
MANUAL_GROUPS["eastern-australia"] = [c for c in aus_codes if c != "AU-WA"]

# Ukraine: Europees Rusland (uit auto_groups) + kernlanden + Kaukasus (B1: dicht het gat naar Middle East)
MANUAL_GROUPS["ukraine"] = ["UKR", "BLR", "MDA", "LTU", "LVA", "EST", "GEO", "ARM", "AZE"]

TERRITORY_META = {
    "alaska": ("Alaska", "north-america"), "northwest-territory": ("Northwest Territory", "north-america"),
    "greenland": ("Greenland", "north-america"), "alberta": ("Alberta", "north-america"),
    "ontario": ("Ontario", "north-america"), "quebec": ("Quebec", "north-america"),
    "western-united-states": ("Western United States", "north-america"),
    "eastern-united-states": ("Eastern United States", "north-america"),
    "central-america": ("Central America", "north-america"),
    "venezuela": ("Venezuela", "south-america"), "peru": ("Peru", "south-america"),
    "brazil": ("Brazil", "south-america"), "argentina": ("Argentina", "south-america"),
    "iceland": ("Iceland", "europe"), "great-britain": ("Great Britain", "europe"),
    "scandinavia": ("Scandinavia", "europe"), "western-europe": ("Western Europe", "europe"),
    "northern-europe": ("Northern Europe", "europe"), "southern-europe": ("Southern Europe", "europe"),
    "ukraine": ("Ukraine", "europe"),
    "north-africa": ("North Africa", "africa"), "egypt": ("Egypt", "africa"),
    "east-africa": ("East Africa", "africa"), "congo": ("Congo", "africa"),
    "south-africa": ("South Africa", "africa"), "madagascar": ("Madagascar", "africa"),
    "ural": ("Ural", "asia"), "siberia": ("Siberia", "asia"), "yakutsk": ("Yakutsk", "asia"),
    "irkutsk": ("Irkutsk", "asia"), "kamchatka": ("Kamchatka", "asia"), "mongolia": ("Mongolia", "asia"),
    "china": ("China", "asia"), "japan": ("Japan", "asia"), "middle-east": ("Middle East", "asia"),
    "india": ("India", "asia"), "siam": ("Siam", "asia"), "afghanistan": ("Afghanistan", "asia"),
    "indonesia": ("Indonesia", "australia"), "new-guinea": ("New Guinea", "australia"),
    "western-australia": ("Western Australia", "australia"), "eastern-australia": ("Eastern Australia", "australia"),
}

# --- Alle groepen samenvoegen: handmatig + automatisch (RUS/USA) ----------
groups = {k: list(v) for k, v in MANUAL_GROUPS.items()}
for code, territory in auto_groups.items():
    groups.setdefault(territory, []).append(code)

missing_atomics = []
territories_out = []
for tid, (name, continent) in TERRITORY_META.items():
    codes = groups.get(tid, [])
    geoms = []
    for c in codes:
        g = atomic.get(c)
        if g is None:
            missing_atomics.append((tid, c))
            continue
        geoms.append(g)
    if not geoms:
        print(f"WAARSCHUWING: geen geometrie gevonden voor {tid}")
        continue
    merged = unary_union(geoms)
    centroid = merged.centroid
    territories_out.append({
        "id": tid, "name": name, "continent": continent,
        "atomicRegions": codes,
        "centroid": [round(centroid.x, 2), round(centroid.y, 2)],
        "geometry": mapping(merged),
    })

print(f"\nGebouwde territoria: {len(territories_out)} (verwacht: 42)")
if missing_atomics:
    print("Niet gevonden atomaire ID's:", missing_atomics)

json.dump(
    {"type": "FeatureCollection", "features": [
        {"type": "Feature",
         "properties": {"id": t["id"], "name": t["name"], "continent": t["continent"], "centroid": t["centroid"]},
         "geometry": t["geometry"]}
        for t in territories_out
    ]},
    open("territories.geo.json", "w"),
)

json.dump(
    [{"id": t["id"], "name": t["name"], "continent": t["continent"],
      "atomicRegions": t["atomicRegions"], "centroid": t["centroid"]} for t in territories_out],
    open("territories.json", "w"), indent=2,
)

print("Weggeschreven: territories.geo.json + territories.json")
