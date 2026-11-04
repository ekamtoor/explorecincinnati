/* Shared Leaflet plumbing for the living map and the home-page preview.
   Leaflet is passed in (imported dynamically in effects) because it touches `window` on import. */
import type * as Leaflet from 'leaflet';
import { cssVar } from '@/lib/theme';
import { pad } from '@/lib/format';

type L = typeof Leaflet;

export const CENTER: [number, number] = [39.115, -84.515];   // downtown / the basin
const LOCAL_KM = 40;                                            // further = a day trip
const TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export type Pinnable = { id: string; no: number; title: string; lat: number | null; lng: number | null; pinned: boolean };

export type GeoCollection = {
  type: 'FeatureCollection';
  features: { type: 'Feature'; properties: { name: string }; geometry: unknown }[];
};

function km(a: [number, number], b: [number, number]) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (b[0] - a[0]) * toR, dLng = (b[1] - a[1]) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export function isLocal(p: Pinnable): boolean {
  return p.pinned && km(CENTER, [p.lat as number, p.lng as number]) < LOCAL_KM;
}
export function latLng(p: Pinnable): [number, number] { return [p.lat as number, p.lng as number]; }

export function baseMap(L: L, el: HTMLElement, opts: Leaflet.MapOptions = {}) {
  const map = L.map(el, { zoomControl: false, attributionControl: true, minZoom: 9, maxZoom: 18, ...opts });
  L.tileLayer(TILES, { subdomains: 'abcd', maxZoom: 19, attribution: ATTR, detectRetina: true }).addTo(map);
  map.attributionControl.setPrefix(false);
  return map;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export function pinIcon(L: L, p: Pinnable) {
  return L.divIcon({
    className: 'pin-wrap', iconSize: [30, 30], iconAnchor: [15, 15],
    html: `<span class="pin" data-id="${escapeHtml(p.id)}"><span class="pin-dot"></span><span class="pin-label">No. ${pad(p.no)}</span></span>`,
  });
}
export function pinEl(marker: Leaflet.Marker): HTMLElement | null {
  const e = marker.getElement();
  return e ? e.querySelector<HTMLElement>('.pin') : null;
}

export function fitLocal(map: Leaflet.Map, posts: Pinnable[], padding: [number, number] = [60, 60]) {
  const pts = posts.filter(isLocal).map(latLng);
  if (pts.length > 1) map.fitBounds(pts, { padding, maxZoom: 14 });
  else if (pts.length === 1) map.setView(pts[0], 14);
  else map.setView(CENTER, 12);
}

export type HoodLayer = {
  byName: Record<string, Leaflet.Path & { getBounds(): Leaflet.LatLngBounds }>;
  paint: (counts: Record<string, number>, selected: string | null) => void;
};

/* Neighborhood outlines in their own pane beneath the pins. Fill opacity is set as an inline style
   (not the SVG attribute) so the CSS transition animates it as neighborhoods fill in. */
export function hoodLayer(L: L, map: Leaflet.Map, geo: GeoCollection, interactive: boolean): HoodLayer {
  if (!map.getPane('hoods')) { map.createPane('hoods'); (map.getPane('hoods') as HTMLElement).style.zIndex = '350'; }
  const renderer = L.svg({ pane: 'hoods', padding: 0.5 });
  const byName: HoodLayer['byName'] = {};
  /* `renderer` is a valid layer option that @types/leaflet omits from GeoJSONOptions. */
  const options: Leaflet.GeoJSONOptions & { renderer: Leaflet.Renderer } = {
    pane: 'hoods', renderer, interactive,
    style: () => ({ className: 'hood-shape', weight: 0.8, fillOpacity: 0, opacity: 0 }),
    onEachFeature: (f, l) => { byName[(f.properties as { name: string }).name] = l as HoodLayer['byName'][string]; },
  };
  L.geoJSON(geo as unknown as GeoJSON.GeoJsonObject, options).addTo(map);

  let last: [Record<string, number>, string | null] | null = null;
  function paint(counts: Record<string, number>, selected: string | null) {
    last = [counts, selected];
    const amber = cssVar('--amber') || '#D9822B', ink = cssVar('--ink') || '#161719';
    for (const name of Object.keys(byName)) {
      const l = byName[name], c = counts[name] || 0, sel = name === selected;
      l.setStyle({ color: c ? amber : ink, fillColor: amber, weight: sel ? 2.2 : c ? 1.2 : 0.7 });
      const el = (l as unknown as { getElement?: () => SVGElement | undefined }).getElement?.();
      if (el) {
        el.style.fillOpacity = c ? String(Math.min(0.18 + (c - 1) * 0.08, 0.42)) : '0';
        el.style.strokeOpacity = sel ? '0.95' : c ? '0.75' : '0.16';
        el.classList.toggle('is-explored', !!c);
      }
    }
  }
  map.whenReady(() => window.setTimeout(() => { if (last) paint(last[0], last[1]); }, 0));
  return { byName, paint };
}

let geoPromise: Promise<GeoCollection | null> | null = null;
export function loadNeighborhoods(): Promise<GeoCollection | null> {
  if (!geoPromise) {
    geoPromise = fetch('/data/neighborhoods.geojson')
      .then((r) => (r.ok ? (r.json() as Promise<GeoCollection>) : null))
      .catch(() => null);
  }
  return geoPromise;
}
