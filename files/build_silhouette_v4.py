import json

CONTINENT_COLORS = {
    'north-america': '#d9663f', 'south-america': '#5a9e4a', 'europe': '#4a72a8',
    'africa': '#d4a13a', 'asia': '#8a5aa8', 'australia': '#4aa896',
}
W, H = 1920, 1000
LON_MIN, LON_MAX = -180, 191  # ruimte voor Kamchatka's oostpunt tot ~190

def project(lon, lat):
    return (lon - LON_MIN) / (LON_MAX - LON_MIN) * W, (90 - lat) / 180 * H

# Alleen voor Kamchatka: de delen die over de datumgrens klappen (negatieve lon, dus het
# uiterste noordoosten van Rusland) krijgen +360 zodat ze rechts aan het vasteland plakken.
# We doen dit per RING, en tekenen ook de ringen die exact op de 180-lijn eindigen zodat er
# geen zichtbaar naadje ontstaat.
def shift_ring_for_kamchatka(ring):
    lons = [p[0] for p in ring]
    # als een ring zowel sterk negatieve als sterk positieve lon heeft, loopt hij zelf over de
    # datumgrens: normaliseer alles naar de oostkant (+360 op de negatieve helft).
    has_neg = any(l < -150 for l in lons)
    has_pos = any(l > 150 for l in lons)
    if has_neg and has_pos:
        return [[lon + 360 if lon < 0 else lon, lat] for lon, lat in ring]
    if all(l < 0 for l in lons):  # volledig omgeklapte oostpunt
        return [[lon + 360, lat] for lon, lat in ring]
    return ring

def ring_to_path(ring):
    return 'M ' + ' L '.join(f'{project(lon, lat)[0]:.1f},{project(lon, lat)[1]:.1f}' for lon, lat in ring) + ' Z'

def geom_to_paths(geom, tid):
    rings = []
    if geom['type'] == 'Polygon':
        rings = list(geom['coordinates'])
    elif geom['type'] == 'MultiPolygon':
        for poly in geom['coordinates']:
            rings.extend(poly)
    parts = []
    for ring in rings:
        if tid == 'kamchatka':
            ring = shift_ring_for_kamchatka(ring)
        parts.append(ring_to_path(ring))
    return ' '.join(parts)

data = json.load(open('../territories_extended.geo.json'))

svg = [f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">']
svg.append(f'<rect width="{W}" height="{H}" fill="#13333f"/>')
for feat in data['features']:
    p = feat['properties']
    d = geom_to_paths(feat['geometry'], p['id'])
    color = CONTINENT_COLORS[p['continent']]
    svg.append(f'<path d="{d}" fill="{color}" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round"/>')
svg.append('</svg>')
open('territories_silhouette_v4.svg', 'w').write('\n'.join(svg))
print('geschreven: territories_silhouette_v4.svg')
