'use client';
/* A small, still map of the spot a photograph was taken, with one amber pin. */
import { useEffect, useRef } from 'react';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export default function SpotMap({ lat, lng, label, title }: { lat: number; lng: number; label: string; title: string }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    let cancelled = false;
    import('leaflet').then((L) => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, {
        zoomControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false,
        doubleClickZoom: false, boxZoom: false, keyboard: false, attributionControl: true,
      }).setView([lat, lng], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 19, detectRetina: true, attribution: '&copy; OpenStreetMap &copy; CARTO',
      }).addTo(map);
      map.attributionControl.setPrefix(false);
      L.marker([lat, lng], {
        keyboard: false, interactive: false,
        icon: L.divIcon({
          className: 'pin-wrap', iconSize: [30, 30], iconAnchor: [15, 15],
          html: `<span class="pin is-latest is-active"><span class="pin-dot"></span><span class="pin-label">${esc(label)}</span></span>`,
        }),
      }).addTo(map);
    });
    return () => { cancelled = true; map?.remove(); };
  }, [lat, lng, label]);

  return <div ref={el} style={{ position: 'absolute', inset: 0 }} role="img" aria-label={`Map showing where “${title}” was taken`} />;
}
