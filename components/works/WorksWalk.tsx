'use client';
/* The gallery walk: every print hung along one long wall of the room, walked sideways. */
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import Toolbar, { useRoom, type WorkItem } from './Toolbar';
import { pad } from '@/lib/format';

function Walk({ works }: { works: WorkItem[] }) {
  const walk = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);

  /* Works light up as they come into view; the sunlight lags a little behind for depth. */
  useEffect(() => {
    const el = walk.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>('.works-work'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let io: IntersectionObserver | null = null;
    if (reduce || !('IntersectionObserver' in window)) items.forEach((w) => w.classList.add('is-lit'));
    else {
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-lit'); }), { root: el, threshold: 0.25 });
      items.forEach((w) => io!.observe(w));
    }
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      const p = max > 0 ? el.scrollLeft / max : 1;
      el.style.setProperty('--sun-shift', `${(el.scrollLeft * 0.18).toFixed(1)}px`);
      progress.current?.style.setProperty('--p', `${Math.max(12, p * 100)}%`);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { io?.disconnect(); el.removeEventListener('scroll', onScroll); };
  }, [works]);

  return (
    <>
      <section className="room works-room" aria-label="Prints, hung along one wall">
        <div className="works-walk" ref={walk} tabIndex={0} aria-label="Gallery walk — scroll sideways">
          <div className="room-track works-track">
            <div className="surface wall" aria-hidden="true" />
            <div className="surface sun sun--glow" aria-hidden="true" />
            <div className="surface sun" aria-hidden="true" />
            <div className="surface skirting" aria-hidden="true" />
            <div className="surface floor" aria-hidden="true" />
            {works.map((p, i) => (
              <article className="hung works-work" key={p.id}>
                <Link className="hung-frame" href={p.printUrl} aria-label={`${p.print} — view print`}>
                  <span className="plate-frame ratio-45">
                    <Image src={p.image} alt={p.alt} fill sizes="(max-width: 760px) 84vw, 24vw" priority={i < 2} />
                  </span>
                  {p.badge ? <span className="badge"><span className="dot" />{p.badge}</span> : null}
                </Link>
                <div className="placard">
                  <span className="num">No. {pad(p.no)}</span>
                  <h2 className="placard-title">{p.print}</h2>
                  <span className="placard-place">{p.place}</span>
                  <span className="meta">Archival pigment print · from {p.price}</span>
                  <div className="placard-links">
                    <Link className="link" href={p.printUrl}>View print</Link>
                    {p.pinned ? <Link className="link link--quiet" href={`/map#${p.id}`}>Where it was taken</Link> : null}
                  </div>
                </div>
              </article>
            ))}
            <div className="works-end" aria-hidden="true" />
          </div>
        </div>
      </section>
      <div className="wrap">
        <div className="works-hint"><span>Walk the room →</span><span className="works-progress" aria-hidden="true"><span ref={progress} /></span></div>
      </div>
    </>
  );
}

function stepOf(el: HTMLElement) {
  const work = el.querySelector<HTMLElement>('.works-work');
  const track = el.querySelector<HTMLElement>('.works-track');
  const gap = track ? parseFloat(getComputedStyle(track).columnGap || '0') || 0 : 0;
  return work ? work.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
}

export function WorksView({ works, rooms, room, onRoom }: { works: WorkItem[]; rooms: string[]; room: string; onRoom?: (r: string) => void }) {
  const shown = useMemo(() => (room === 'All' ? works : works.filter((w) => w.room === room)), [works, room]);
  const scrollBy = useCallback((dir: number) => {
    const el = document.querySelector<HTMLElement>('.works-walk');
    if (el) el.scrollBy({ left: dir * stepOf(el), behavior: 'smooth' });
  }, []);
  const n = shown.length;
  return (
    <>
      <Toolbar
        mode="prints" rooms={rooms} room={room} onRoom={onRoom}
        roomHref={(r) => (r === 'All' ? '/works' : `/works?room=${encodeURIComponent(r)}`)}
        countLabel={`${n} ${n === 1 ? 'work' : 'works'}`}
        onPrev={n > 1 ? () => scrollBy(-1) : undefined}
        onNext={n > 1 ? () => scrollBy(1) : undefined}
      />
      {n > 0 ? <Walk key={room} works={shown} /> : <div className="wrap"><p className="works-empty">Nothing hangs in this room yet — it’s coming.</p></div>}
    </>
  );
}

export default function WorksWalk({ works, rooms }: { works: WorkItem[]; rooms: string[] }) {
  const [room, setRoom] = useRoom(rooms);
  return <WorksView works={works} rooms={rooms} room={room} onRoom={setRoom} />;
}
