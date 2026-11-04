'use client';
/* The living map. React owns the panel, list, card and checklist; Leaflet lives in a ref and is
   synced from state. Adding a post to posts.json is all it takes for the pins, route, timeline
   and neighborhood fill to grow. */
import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import type { Post } from '@/lib/posts';
import { directionsUrl, explored, fmtDate, pad } from '@/lib/format';
import { cssVar } from '@/lib/theme';
import {
  baseMap, fitLocal, hoodLayer, isLocal, latLng, loadNeighborhoods, pinEl, pinIcon, type HoodLayer,
} from './leaflet-helpers';
import './map-shared.css';
import './living-map.css';

type Props = { posts: Post[]; rooms: string[]; neighborhoods: string[] };

type Engine = {
  L: typeof Leaflet;
  map: Leaflet.Map;
  markers: Record<string, Leaflet.Marker>;
  shown: Record<string, boolean>;
  route: Leaflet.Polyline;
  hoods: HoodLayer | null;
};

function mapPad(): [number, number] { return window.innerWidth > 900 ? [80, 80] : [36, 36]; }

export default function LivingMap({ posts, rooms, neighborhoods }: Props) {
  const [room, setRoom] = useState('All');
  const [upto, setUpto] = useState(posts.length - 1);
  const [selected, setSelected] = useState<string | null>(null);
  const [route, setRoute] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [hood, setHood] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [hoodsReady, setHoodsReady] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  const viewEl = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);
  const animateNext = useRef(false);
  const pendingFly = useRef<{ id: string; fly: boolean } | null>(null);

  const visible = useMemo(
    () => posts.slice(0, upto + 1).filter((p) => room === 'All' || p.room === room),
    [posts, upto, room],
  );
  const counts = useMemo(() => explored(neighborhoods, visible), [neighborhoods, visible]);
  const exploredN = Object.keys(counts).length;
  const activeHood = hood && counts[hood] ? hood : null;
  const listed = (activeHood ? visible.filter((p) => p.neighborhood === activeHood) : visible).slice().reverse();
  const beyond = Array.from(new Set(visible.filter((p) => p.neighborhood && !neighborhoods.includes(p.neighborhood)).map((p) => p.place)));
  const selectedPost = selected ? posts.find((p) => p.id === selected && visible.includes(p)) ?? null : null;

  /* ---------- Fly to a post (once the map exists) ---------- */
  const flyTo = useCallback((id: string, fly: boolean) => {
    const e = engine.current;
    const p = posts.find((x) => x.id === id);
    if (!p || !p.pinned) return;
    if (!e) { pendingFly.current = { id, fly }; return; }
    if (fly) e.map.flyTo(latLng(p), isLocal(p) ? Math.max(e.map.getZoom(), 15) : 12, { duration: isLocal(p) ? 0.8 : 1.6 });
    else e.map.panTo(latLng(p));
  }, [posts]);

  const select = useCallback((id: string, opts: { fly?: boolean; scroll?: boolean } = {}) => {
    const p = posts.find((x) => x.id === id);
    if (!p) return;
    setSelected(id);
    flyTo(id, opts.fly !== false);
    if (window.location.hash !== `#${id}`) history.replaceState(history.state, '', `#${id}`);
    if (opts.scroll && window.innerWidth <= 900) mapEl.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [posts, flyTo]);

  const closeCard = useCallback(() => {
    setSelected(null);
    history.replaceState(history.state, '', window.location.pathname);
  }, []);

  /* ---------- Create the map once; tear it down on unmount ---------- */
  useEffect(() => {
    let cancelled = false;
    let onTheme: (() => void) | null = null;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapEl.current) return;
      const map = baseMap(L, mapEl.current, { scrollWheelZoom: true });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      const markers: Engine['markers'] = {};
      for (const p of posts) {
        if (!p.pinned) continue;
        const m = L.marker(latLng(p), { icon: pinIcon(L, p), title: p.title, riseOnHover: true });
        m.on('click', () => select(p.id, { fly: false }));
        markers[p.id] = m;
      }
      const routeLine = L.polyline([], { color: cssVar('--ink') || '#161719', weight: 1.2, opacity: 0.55, dashArray: '2 6', lineCap: 'round', interactive: false }).addTo(map);
      engine.current = { L, map, markers, shown: {}, route: routeLine, hoods: null };
      fitLocal(map, posts, mapPad());
      setReady(true);

      onTheme = () => {
        routeLine.setStyle({ color: cssVar('--ink') || '#161719' });
        document.dispatchEvent(new CustomEvent('ec:map-repaint'));
      };
      document.addEventListener('ec:theme', onTheme);

      const geo = await loadNeighborhoods();
      if (cancelled || !geo || !engine.current) return;
      engine.current.hoods = hoodLayer(L, map, geo, true);
      setHoodsReady(true);
    })();
    return () => {
      cancelled = true;
      if (onTheme) document.removeEventListener('ec:theme', onTheme);
      engine.current?.map.remove();
      engine.current = null;
    };
  }, [posts, select]);

  /* Pending deep-link fly once the map is ready */
  useEffect(() => {
    if (ready && pendingFly.current) { const { id, fly } = pendingFly.current; pendingFly.current = null; flyTo(id, fly); }
  }, [ready, flyTo]);

  /* ---------- Neighborhood tooltips + click-to-filter (needs live counts) ---------- */
  const countsRef = useRef(counts);
  countsRef.current = counts;
  useEffect(() => {
    const e = engine.current;
    if (!hoodsReady || !e?.hoods) return;
    for (const name of Object.keys(e.hoods.byName)) {
      const l = e.hoods.byName[name];
      l.bindTooltip(() => {
        const c = countsRef.current[name] || 0;
        const safe = name.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] as string);
        return `<b>${safe}</b> · <span>${c ? `${c} ${c === 1 ? 'post' : 'posts'}` : 'Not yet explored'}</span>`;
      }, { sticky: true, direction: 'top', offset: [0, -10], className: 'hood-tip', opacity: 1 });
      l.on('click', () => {
        if (countsRef.current[name]) setHood((cur) => (cur === name ? null : name));
        else l.openTooltip();
      });
    }
  }, [hoodsReady]);

  /* ---------- Sync Leaflet with state ---------- */
  useEffect(() => {
    const e = engine.current;
    if (!ready || !e) return;
    const animate = animateNext.current;
    animateNext.current = false;
    const visIds = new Set(visible.map((p) => p.id));
    const pinnedVis = visible.filter((p) => p.pinned);
    const latest = pinnedVis[pinnedVis.length - 1];
    for (const id of Object.keys(e.markers)) {
      const m = e.markers[id];
      if (visIds.has(id) && !e.shown[id]) {
        m.addTo(e.map); e.shown[id] = true;
        if (animate) pinEl(m)?.classList.add('is-new');
      } else if (!visIds.has(id) && e.shown[id]) { e.map.removeLayer(m); e.shown[id] = false; }
      const el = pinEl(m);
      if (el) { el.classList.toggle('is-latest', !!latest && id === latest.id); el.classList.toggle('is-active', id === selectedPost?.id); }
    }
    e.route.setLatLngs(route ? pinnedVis.filter(isLocal).map(latLng) : []);
    if (animate && latest && isLocal(latest) && !e.map.getBounds().pad(-0.1).contains(latLng(latest))) e.map.panTo(latLng(latest));
  }, [ready, visible, route, selectedPost]);

  useEffect(() => {
    const e = engine.current;
    if (!hoodsReady || !e?.hoods) return;
    const paint = () => e.hoods?.paint(counts, activeHood);
    paint();
    document.addEventListener('ec:map-repaint', paint);
    return () => document.removeEventListener('ec:map-repaint', paint);
  }, [hoodsReady, counts, activeHood]);

  /* ---------- Timeline playback ---------- */
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      setUpto((u) => {
        if (u >= posts.length - 1) { setPlaying(false); return u; }
        animateNext.current = true;
        return u + 1;
      });
    }, 900);
    return () => window.clearInterval(t);
  }, [playing, posts.length]);

  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (upto >= posts.length - 1) setUpto(0);
    animateNext.current = true;
    setPlaying(true);
  };

  /* ---------- Deep links: /map#post-id ---------- */
  useEffect(() => {
    /* A hash-only jump (typed URL, plain #link) creates a history entry without Next's router state,
       and Next ignores Back into such entries. Stamp them with the state we already have for /map. */
    let routerState: unknown = history.state;
    const fromHash = () => {
      if (history.state == null && routerState != null) history.replaceState(routerState, '', window.location.href);
      else if (history.state != null) routerState = history.state;
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id && posts.some((p) => p.id === id)) select(id, { fly: true });
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [posts, select]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCard(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected, closeCard]);

  const pickHood = (name: string) => {
    viewEl.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHood(name);
    const l = engine.current?.hoods?.byName[name];
    if (l && engine.current) engine.current.map.fitBounds(l.getBounds(), { padding: mapPad(), maxZoom: 15 });
  };

  const pickRoom = (r: string) => {
    setRoom(r);
    const e = engine.current;
    if (e) fitLocal(e.map, posts.slice(0, upto + 1).filter((p) => r === 'All' || p.room === r), mapPad());
  };

  const fill = posts.length > 1 ? (upto / (posts.length - 1)) * 100 : 100;

  return (
    <div className="map-page">
      <div className="mapview" ref={viewEl}>
        <aside className="map-panel" aria-label="Map controls and posts">
          <div className="map-intro">
            <p className="eyebrow">The living map</p>
            <h1 className="h1">Every place, <em>pinned.</em></h1>
            <p className="lede">Each photograph from @explore.cincinnati lands here the day it’s posted — a new pin, a longer route, one more neighborhood checked off.</p>
          </div>

          <div className="kpis">
            <div className="kpi"><span className="kpi-n">{visible.length}</span><span className="meta">posts on the map</span></div>
            <div className="kpi"><span className="kpi-n">{exploredN}<small> / {neighborhoods.length}</small></span><span className="meta">neighborhoods explored</span></div>
          </div>

          <div className="timeline">
            <div className="tl-head">
              <span className="tl-date">As of {fmtDate(posts[upto].date)}</span>
              <span className="meta">Post {upto + 1} of {posts.length}</span>
            </div>
            <div className="tl-track">
              <span className="tl-fill" style={{ width: `${fill}%` }} />
              <input
                className="tl-range" type="range" min={0} max={posts.length - 1} step={1} value={upto}
                aria-label="Timeline: show the map as it was after each post"
                onChange={(e) => { setPlaying(false); setUpto(Number(e.target.value)); }}
              />
            </div>
            <div className="tl-controls">
              <span className="meta">Drag back in time</span>
              <button type="button" className="btn btn--ghost tl-play" aria-pressed={playing} onClick={togglePlay}>
                {playing
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>}
                <span>{playing ? 'Pause' : 'Watch it grow'}</span>
              </button>
            </div>
          </div>

          <div className="map-filters">
            <div className="room-chips" role="group" aria-label="Filter by room">
              {['All', ...rooms].map((r) => (
                <button key={r} type="button" className="chip" aria-pressed={r === room} onClick={() => pickRoom(r)}>{r}</button>
              ))}
            </div>
            <label className="toggle"><input type="checkbox" checked={route} onChange={(e) => setRoute(e.target.checked)} /> Show the route walked</label>
          </div>

          <div className="map-list-wrap">
            <div className="list-head">
              <span className="eyebrow">Newest first</span>
              {activeHood && (
                <button type="button" className="hood-chip" aria-label={`Clear neighborhood filter: ${activeHood}`} onClick={() => setHood(null)}>
                  Neighborhood: {activeHood} <span aria-hidden="true">×</span>
                </button>
              )}
            </div>
            <ul className="post-list" aria-live="polite">
              {listed.length === 0 && <li className="meta" style={{ padding: '16px 0' }}>Nothing in this room yet — it’s coming.</li>}
              {listed.map((p) => (
                <li key={p.id}>
                  <button type="button" className={`post-row${p.id === selectedPost?.id ? ' is-active' : ''}`} onClick={() => select(p.id, { scroll: true })}>
                    <Image src={p.image} alt="" width={64} height={80} sizes="64px" />
                    <span className="post-row-text">
                      <span className="meta">No. {pad(p.no)} · {fmtDate(p.date)}</span>
                      <span className="post-row-title">{p.title}</span>
                      <span className="meta">{p.place}</span>
                      {!p.pinned ? <span className="tag">Location to come</span> : !isLocal(p) ? <span className="tag">Day trip</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="map-stage">
          <div id="living-map" ref={mapEl} role="region" aria-label="Interactive map of Cincinnati" />
          {selectedPost && (
            <article className="map-card" key={selectedPost.id} aria-live="polite">
              <button type="button" className="card-close" aria-label="Close" onClick={closeCard}>×</button>
              <div className="plate-frame ratio-32">
                <Image src={selectedPost.image} alt={selectedPost.alt} fill sizes="(max-width: 900px) 100vw, 380px" />
              </div>
              <div className="card-body">
                <p className="meta">No. {pad(selectedPost.no)} · {selectedPost.room} · {fmtDate(selectedPost.date)}</p>
                <h3 className="card-title">{selectedPost.title}</h3>
                <p className="meta card-place">
                  {selectedPost.place}
                  {selectedPost.neighborhood && selectedPost.neighborhood !== selectedPost.place ? ` · ${selectedPost.neighborhood}` : ''}
                </p>
                <p className="card-excerpt">{selectedPost.excerpt}</p>
                <div className="card-actions">
                  <Link className="btn" href={selectedPost.story}>Read the story</Link>
                  {selectedPost.pinned && (
                    <a className="btn btn--ghost" href={directionsUrl(selectedPost.lat as number, selectedPost.lng as number)} target="_blank" rel="noopener noreferrer">Directions</a>
                  )}
                </div>
                <div className="card-links">
                  {selectedPost.printUrl && <Link className="link" href={selectedPost.printUrl}>Print · from {selectedPost.price}</Link>}
                  <a className="link" href={selectedPost.instagram} target="_blank" rel="noopener noreferrer">On Instagram</a>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>

      <section className="section wrap" aria-labelledby="grow-h">
        <div className="section-head">
          <div>
            <p className="eyebrow">How the map grows</p>
            <h2 className="h2" id="grow-h">One post, <em>one pin.</em></h2>
          </div>
          <p className="lede">The map isn’t finished — it can’t be. It fills in at the pace of the feed.</p>
        </div>
        <ol className="grow-steps">
          <li><span className="h3">A photograph goes up</span><span className="meta">A new post on @explore.cincinnati — fog on the river, a stairway in Mt. Adams, a mural in OTR.</span></li>
          <li><span className="h3">It becomes a story</span><span className="meta">The full caption is published here with the exact spot it was taken, and the print if there is one.</span></li>
          <li><span className="h3">The map moves</span><span className="meta">A pin drops, the route extends, the timeline gains a day, and a neighborhood gets checked off.</span></li>
        </ol>
      </section>

      <section className="section rule-top wrap hoods-section" aria-labelledby="hoods-h">
        <div className="hoods-head">
          <div className="hoods-title">
            <p className="eyebrow">The checklist</p>
            <h2 className="h2" id="hoods-h">Every neighborhood, <em>eventually.</em></h2>
          </div>
          <div className="hood-progress">
            <span className="hood-count">{exploredN} of {neighborhoods.length}</span>
            <div className="hood-bar-track"><div className="hood-bar" style={{ width: `${(exploredN / neighborhoods.length) * 100}%` }} /></div>
            <span className="meta">Cincinnati neighborhoods photographed so far</span>
          </div>
        </div>
        <ul className="hood-grid">
          {neighborhoods.map((n) => {
            const c = counts[n];
            if (!c) return <li key={n} className="hood"><span>{n}</span></li>;
            return (
              <li key={n} className={`hood is-explored${n === activeHood ? ' is-filtered' : ''}`}>
                <button type="button" className="hood-btn" onClick={() => pickHood(n)}>
                  <span>{n}</span><span className="hood-n">{c}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {beyond.length > 0 && <p className="meta hood-beyond">Also beyond the city line: {beyond.join(' · ')}</p>}
        <div className="hoods-cta">
          <a className="btn" href="https://www.instagram.com/explore.cincinnati/" target="_blank" rel="noopener noreferrer">Suggest the next spot</a>
          <span className="meta">Know a corner of the city that should be on here? Send it over.</span>
        </div>
      </section>
    </div>
  );
}
