'use client';
/* The Index: every work, catalogue-style, with a live preview. Doubles as the menu on phones. */
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useIndexPanel } from './Providers';
import { fmtDate, pad } from '@/lib/format';

export type IndexItem = { id: string; no: number; title: string; place: string; date: string; room: string; image: string; alt: string; story: string };

export default function IndexPanel({ items, rooms, summary }: { items: IndexItem[]; rooms: string[]; summary: string }) {
  const { open, setOpen } = useIndexPanel();
  const pathname = usePathname();
  const [room, setRoom] = useState('All');
  const [hot, setHot] = useState(items[0]?.id ?? '');
  const panel = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const shown = useMemo(() => items.filter((p) => room === 'All' || p.room === room), [items, room]);
  const hotItem = items.find((p) => p.id === hot);

  /* Close on navigation */
  useEffect(() => { setOpen(false); }, [pathname, setOpen]);

  /* Focus in on open, back out on close; Esc closes; Tab stays inside */
  useEffect(() => {
    if (!open) { returnFocus.current?.focus?.(); return; }
    returnFocus.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>('.index-close')?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key !== 'Tab' || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [open, setOpen]);

  return (
    <div id="index-panel" className="index" ref={panel} role="dialog" aria-modal="true" aria-label="Index of works" aria-hidden={!open} inert={!open}>
      <div className="wrap index-top">
        <Link className="brand" href="/"><span className="brand-name">explore<span className="brand-sep">.</span>cincinnati</span></Link>
        <button type="button" className="index-close" onClick={() => setOpen(false)}>Close <span aria-hidden="true">×</span></button>
      </div>
      <div className="wrap index-body">
        <div className="index-list">
          <div className="index-filters" role="group" aria-label="Filter by room">
            {['All', ...rooms].map((r) => (
              <button key={r} type="button" aria-pressed={r === room} onClick={() => { setRoom(r); const first = items.find((p) => r === 'All' || p.room === r); if (first) setHot(first.id); }}>{r}</button>
            ))}
          </div>
          <ol className="index-works">
            {shown.map((p, i) => (
              <li key={p.id} className="index-work" style={{ ['--i' as string]: i }}>
                <Link href={p.story} className={p.id === hot ? 'is-hot' : undefined} onMouseEnter={() => setHot(p.id)} onFocus={() => setHot(p.id)}>
                  <span className="num">{pad(p.no)}</span>
                  <span className="index-work-title">{p.title}</span>
                  <span className="index-work-meta">{p.place} · {fmtDate(p.date, false)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <figure className="index-preview" aria-hidden="true">
          <div className="index-preview-frame">
            {items.map((p) => (
              <Image key={p.id} src={p.image} alt="" fill sizes="(max-width: 860px) 0px, 40vw" className={p.id === hot ? 'is-on' : undefined} />
            ))}
          </div>
          <figcaption><span>{hotItem ? `No. ${pad(hotItem.no)} — ${hotItem.place}` : ''}</span><span>{hotItem?.room}</span></figcaption>
        </figure>
      </div>
      <div className="wrap index-foot">
        <nav className="index-sections" aria-label="Sections">
          <Link href="/works">Works</Link><Link href="/map">The map</Link><Link href="/stories">Stories</Link><Link href="/about">About</Link>
          <a href="https://www.instagram.com/explore.cincinnati/" target="_blank" rel="noopener noreferrer">Instagram</a>
        </nav>
        <span className="meta">{summary}</span>
      </div>
    </div>
  );
}
