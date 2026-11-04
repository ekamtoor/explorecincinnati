'use client';
/* Home-page preview of the living map: pins, neighborhoods filled in amber, the latest pin pulsing.
   Not interactive beyond a click — it hands off to /map. Outlines come from /data/neighborhoods.geojson. */
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type * as Leaflet from 'leaflet';
import { CENTER, baseMap, hoodLayer, isLocal, latLng, loadNeighborhoods, pinEl, pinIcon } from './map/leaflet-helpers';
import './map/map-shared.css';

export type MapPost = {
  id: string; no: number; title: string; place: string; room: string; date: string;
  lat: number | null; lng: number | null; pinned: boolean; inCity: boolean; neighborhood: string | null; story: string;
};

export default function MiniMap({ posts, className }: { posts: MapPost[]; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    let ro: ResizeObserver | null = null;
    let onTheme: (() => void) | null = null;
    let timer = 0;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current) return;
      map = baseMap(L, el.current, {
        dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false,
      });
      const m = map;
      const counts: Record<string, number> = {};
      for (const p of posts) if (p.inCity && p.neighborhood) counts[p.neighborhood] = (counts[p.neighborhood] || 0) + 1;

      const fit = (hoods: ReturnType<typeof hoodLayer> | null) => {
        const b = L.latLngBounds([]);
        if (hoods) for (const n of Object.keys(counts)) if (hoods.byName[n]) b.extend(hoods.byName[n].getBounds());
        for (const p of posts) if (isLocal(p)) b.extend(latLng(p));
        if (b.isValid()) m.fitBounds(b.pad(0.15), { padding: [24, 24], maxZoom: 14 });
        else m.setView(CENTER, 12);
      };
      fit(null); // the map needs a view before markers get their elements

      const pinned = posts.filter((p) => p.pinned);
      const latest = pinned[pinned.length - 1];
      for (const p of pinned) {
        const mk = L.marker(latLng(p), { icon: pinIcon(L, p), title: p.title, keyboard: false }).addTo(m);
        mk.on('click', (e) => { L.DomEvent.stopPropagation(e); router.push(`/map#${p.id}`); });
        if (p === latest) pinEl(mk)?.classList.add('is-latest');
      }
      m.on('click', () => router.push('/map'));

      const geo = await loadNeighborhoods();
      if (cancelled) return;
      const hoods = geo ? hoodLayer(L, m, geo, false) : null;
      hoods?.paint(counts, null);
      fit(hoods);
      onTheme = () => hoods?.paint(counts, null);
      document.addEventListener('ec:theme', onTheme);
      if ('ResizeObserver' in window && el.current) {
        ro = new ResizeObserver(() => {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => { m.invalidateSize(); fit(hoods); }, 120);
        });
        ro.observe(el.current);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      ro?.disconnect();
      if (onTheme) document.removeEventListener('ec:theme', onTheme);
      map?.remove();
    };
  }, [posts, router]);

  return (
    <div
      ref={el}
      className={className}
      style={className ? undefined : { position: 'absolute', inset: 0 }}
      role="img"
      aria-label="Map of Cincinnati: neighborhoods photographed so far are filled in amber"
    />
  );
}
