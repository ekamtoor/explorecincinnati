'use client';
/* Every post as a story: the full caption, the place, the print. */
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import Toolbar, { useRoom, type WorkItem } from './Toolbar';
import { fmtDate, pad } from '@/lib/format';

export function StoriesView({ stories, rooms, room, onRoom }: { stories: WorkItem[]; rooms: string[]; room: string; onRoom?: (r: string) => void }) {
  const shown = useMemo(() => (room === 'All' ? stories : stories.filter((s) => s.room === room)), [stories, room]);
  const n = shown.length;
  return (
    <>
      <Toolbar
        mode="stories" rooms={rooms} room={room} onRoom={onRoom}
        roomHref={(r) => (r === 'All' ? '/stories' : `/stories?room=${encodeURIComponent(r)}`)}
        countLabel={`${n} ${n === 1 ? 'story' : 'stories'}`}
      />
      <section className="wrap" aria-label="Stories">
        {n > 0 ? (
          <div className="stories-grid rule-top">
            {shown.map((s, i) => (
              <Link className="stories-card" href={s.story} key={s.id}>
                <span className="plate-frame ratio-45">
                  <Image src={s.image} alt={s.alt} fill sizes="(max-width: 480px) 38vw, (max-width: 960px) 40vw, 20vw" priority={i < 2} />
                </span>
                <span className="stories-text">
                  <span className="meta">No. {pad(s.no)} · {fmtDate(s.date)} · {s.room}</span>
                  <h2 className="stories-title">{s.title}</h2>
                  <span className="stories-place">{s.place}</span>
                  <p className="stories-excerpt">{s.excerpt}</p>
                  <span className="link">Read the story</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="works-empty">Nothing in this room yet — it’s coming.</p>
        )}
      </section>
    </>
  );
}

export default function StoriesList({ stories, rooms }: { stories: WorkItem[]; rooms: string[] }) {
  const [room, setRoom] = useRoom(rooms);
  return <StoriesView stories={stories} rooms={rooms} room={room} onRoom={setRoom} />;
}
