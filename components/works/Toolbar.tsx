'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export type WorkItem = {
  id: string; no: number; title: string; print: string; place: string; room: string; date: string;
  image: string; alt: string; excerpt: string; story: string; printUrl: string; price: string; badge: string; pinned: boolean;
};

/** Room filter kept in the URL (?room=Autumn) so other pages can link straight to a room. */
export function useRoom(rooms: string[]): [string, (room: string) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromUrl = params.get('room');
  const valid = (r: string | null) => (r && rooms.includes(r) ? r : 'All');
  const [room, setRoomState] = useState(() => valid(fromUrl));
  useEffect(() => { setRoomState(valid(fromUrl)); }, [fromUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  const setRoom = useCallback((r: string) => {
    setRoomState(r);
    router.replace(r === 'All' ? pathname : `${pathname}?room=${encodeURIComponent(r)}`, { scroll: false });
  }, [router, pathname]);
  return [room, setRoom];
}

export default function Toolbar({
  mode, rooms, room, onRoom, countLabel, onPrev, onNext, roomHref,
}: {
  mode: 'prints' | 'stories';
  rooms: string[];
  room: string;
  onRoom?: (room: string) => void;
  countLabel: string;
  onPrev?: () => void;
  onNext?: () => void;
  roomHref?: (room: string) => string;
}) {
  const keep = (base: string) => (room !== 'All' ? `${base}?room=${encodeURIComponent(room)}` : base);
  return (
    <div className="wrap">
      <div className="works-toolbar">
        <div className="works-toolbar-start">
          <nav className="works-mode" aria-label="View">
            <Link href={keep('/works')} aria-current={mode === 'prints' ? 'page' : undefined}>Prints</Link>
            <Link href={keep('/stories')} aria-current={mode === 'stories' ? 'page' : undefined}>Stories</Link>
          </nav>
          <span className="works-mode-sep" aria-hidden="true" />
          <div className="works-chips" role="group" aria-label="Filter by room">
            {['All', ...rooms].map((r) =>
              onRoom ? (
                <button key={r} type="button" className="chip" aria-pressed={r === room} onClick={() => onRoom(r)}>{r}</button>
              ) : (
                <Link key={r} className={`chip${r === room ? ' is-on' : ''}`} aria-current={r === room ? 'true' : undefined} href={roomHref ? roomHref(r) : '#'}>{r}</Link>
              ),
            )}
          </div>
        </div>
        <div className="works-toolbar-end">
          <span className="works-count" aria-live="polite">{countLabel}</span>
          {onPrev && onNext ? (
            <div className="works-nav">
              <button type="button" aria-label="Previous work" onClick={onPrev}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              </button>
              <button type="button" aria-label="Next work" onClick={onNext}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
