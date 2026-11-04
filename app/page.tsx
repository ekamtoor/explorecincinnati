import Image from 'next/image';
import Link from 'next/link';
import { getPost, getSiteData, newestFirst } from '@/lib/posts';
import { explored, fmtDate, pad } from '@/lib/format';
import MiniMap, { type MapPost } from '@/components/MiniMap';
import Opening, { type Slide } from '@/components/home/Opening';
import AlertsForm from '@/components/home/AlertsForm';
import s from '@/components/home/home.module.css';

function Arrow({ size = 16, stroke = 1.5, className }: { size?: number; stroke?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
/* How each room's name is set: the italic word gives each line its own voice. */
const ROOM_TYPE: Record<string, React.ReactNode> = {
  'Fog & Night': <>Fog <em>&amp;</em> Night</>,
  Autumn: <em>Autumn</em>,
  Reflections: <>Reflections</>,
  'Day trips': <>Day <em>trips</em></>,
};

export default function Home() {
  const data = getSiteData();
  const newest = newestFirst();
  const hoods = explored(data.neighborhoods, data.posts);
  const hoodCount = Object.keys(hoods).length;
  const pinned = data.posts.filter((p) => p.pinned);
  const latest = newest[0];

  /* Opening: start on the fog over the Ohio, then the newest posts */
  const first = data.posts.find((p) => p.id === 'fog-over-the-ohio') ?? newest[0];
  const slides: Slide[] = [first, ...newest.filter((p) => p.id !== first.id)].slice(0, 5)
    .map(({ id, no, title, place, image, alt, story }) => ({ id, no, title, place, image, alt, story }));

  const mapPosts: MapPost[] = data.posts.map(({ id, no, title, place, room, date, lat, lng, pinned, inCity, neighborhood, story }) =>
    ({ id, no, title, place, room, date, lat, lng, pinned, inCity, neighborhood, story }));

  const pom = getPost('roebling-fog') ?? latest;
  const inset = (id: string) => data.posts.find((p) => p.id === id);
  const insets = [inset('fog-over-the-ohio'), inset('roebling-fog'), inset('bellevue-hill')];

  return (
    <>
      <Opening slides={slides} />

      {/* STATEMENT */}
      <section id="about" className="section wrap" aria-label="About">
        <p className={`${s.statement} reveal`}>
          Cincinnati is best seen slowly —{' '}
          {insets[0] && <Link className={s.inset} href={insets[0].story} aria-label={insets[0].title}><Image src={insets[0].image} alt="" fill sizes="120px" /></Link>}{' '}
          in fog over the Ohio,{' '}
          {insets[1] && <Link className={s.inset} href={insets[1].story} aria-label={insets[1].title}><Image src={insets[1].image} alt="" fill sizes="120px" /></Link>}{' '}
          from the Covington landing at midnight,{' '}
          {insets[2] && <Link className={s.inset} href={insets[2].story} aria-label={insets[2].title}><Image src={insets[2].image} alt="" fill sizes="120px" /></Link>}{' '}
          under concrete <em>nobody looks up at.</em>
        </p>
        <div className={s.statementFoot}>
          <p>
            A living collection by [PHOTOGRAPHER NAME]. Every photograph posted to @explore.cincinnati hangs here with its full caption,
            the exact spot it was taken, and — for most of them — a signed print you can take home. <Link className="link" href="/about">About the project</Link>
          </p>
          <div className={s.facts}>
            <div className={s.fact}><span className={s.factN}>{data.posts.length}</span><span className="meta">works on view</span></div>
            <div className={s.fact}><span className={s.factN}>{hoodCount}<small> / {data.neighborhoods.length}</small></span><span className="meta">neighborhoods</span></div>
            <div className={s.fact}><span className={s.factN}>[N]k</span><span className="meta">following along</span></div>
          </div>
        </div>
      </section>

      {/* LATELY */}
      <section className="section rule-top wrap" aria-labelledby="lately-h" style={{ paddingTop: 'clamp(64px,9vw,128px)' }}>
        <div className={s.headRow}>
          <h2 className="h2" id="lately-h">Lately</h2>
          <Link className="link" href="/stories">All the stories <Arrow /></Link>
        </div>
        <div className={s.lately}>
          {newest.slice(0, 3).map((p, i) => (
            <Link key={p.id} className={`${s.latelyItem} reveal`} href={p.story}>
              <span className="plate-frame ratio-45">
                <Image src={p.image} alt={p.alt} fill sizes="(max-width: 760px) 78vw, 30vw" />
                {i === 0 && <span className={`badge ${s.latelyBadge}`}><span className="dot" />Latest</span>}
              </span>
              <span className="plate-cap">
                <span className="num">No. {pad(p.no)}</span>
                <span className="h3">{p.title}</span>
                <span className="meta">{p.place} · {fmtDate(p.date)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* THE MAP */}
      <section id="map" className={`${s.atlas} section`} aria-labelledby="atlas-h">
        <div className={`wrap ${s.atlasGrid}`}>
          <div className={`${s.atlasMap} reveal`}>
            <MiniMap posts={mapPosts} />
            <Link href="/map" className="sr-only">Open the living map</Link>
            {latest && <span className="badge"><span className="dot" />Latest · {latest.place}</span>}
          </div>
          <div className={`${s.atlasCopy} reveal`}>
            <h2 className="h2" id="atlas-h">The city, <em>filling in.</em></h2>
            <div className={s.atlasCount}>{hoodCount}<small> of {data.neighborhoods.length} neighborhoods</small></div>
            <p className="lede">Every photograph is pinned where it was taken. Each new post drops a pin and lights up its neighborhood — the map grows at the pace of the feed.</p>
            <ul className={s.atlasList}>
              <li><span>Places pinned</span><span>{pinned.length}</span></li>
              <li><span>Last pin</span><span>{latest ? fmtDate(latest.date) : '–'}</span></li>
            </ul>
            <div><Link className="btn" href="/map">Open the living map <Arrow /></Link></div>
          </div>
        </div>
      </section>

      {/* PRINT OF THE MONTH, in the room */}
      {pom && (
        <section className={s.pom} aria-labelledby="pom-h">
          <div className="room">
            <div className="room-track">
              <div className="surface wall" aria-hidden="true" />
              <div className="surface sun sun--glow" aria-hidden="true" />
              <div className="surface sun" aria-hidden="true" />
              <div className="surface skirting" aria-hidden="true" />
              <div className="surface floor" aria-hidden="true" />
              <div className={s.wallText}>
                <p className="eyebrow">Print of the month</p>
                <h2 id="pom-h">Roebling, <em>in the fog.</em></h2>
                <p>The suspension bridge that came before Brooklyn’s, on a night the far tower never showed up. Archival pigment on cotton, signed and numbered.</p>
              </div>
              <div className="hung">
                <Link className="hung-frame" href={pom.printUrl} aria-label={`${pom.print} — view print`}>
                  <span className="plate-frame ratio-11"><Image src={pom.image} alt={`Framed print: ${pom.alt}`} fill sizes="(max-width: 860px) 84vw, 24vw" /></span>
                </Link>
                <div className="placard">
                  <span className="num">No. {pad(pom.no)}</span>
                  <span className="placard-title">{pom.print}</span>
                  <span className="placard-place">Covington landing</span>
                  <span className="meta">Edition of [N] · from {pom.price}</span>
                  <div className="placard-links">
                    <Link className="link" href={pom.printUrl}>View print</Link>
                    <Link className="link link--quiet" href={pom.story}>Read the story</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`wrap ${s.pomBuy}`}>
            <ul className={s.sizes}><li>8 × 10</li><li>12 × 16</li><li>16 × 20</li><li>24 × 30</li><li>Framed in oak</li></ul>
            <Link className="btn" href={pom.printUrl}>Choose a size · from {pom.price}</Link>
          </div>
        </section>
      )}

      {/* ROOMS */}
      <section className="section wrap" aria-labelledby="rooms-h">
        <div className={s.headRow}>
          <h2 className="h2" id="rooms-h">{data.rooms.length === 4 ? 'Four rooms' : 'The rooms'}</h2>
          <Link className="link" href="/works">Walk the collection <Arrow /></Link>
        </div>
        <ul className={s.rooms}>
          {data.rooms.map((room, k) => {
            const inRoom = newest.filter((p) => p.room === room);
            const peek = inRoom[0];
            const n = inRoom.length;
            return (
              <li key={room}>
                <Link className={s.roomRow} href={`/works?room=${encodeURIComponent(room)}`}>
                  <span className="num">{NUMERALS[k] ?? k + 1}</span>
                  <span className={s.roomName}>{ROOM_TYPE[room] ?? room}</span>
                  <span className={`meta ${s.roomCount}`}>{n} {n === 1 ? 'work' : 'works'}</span>
                  <Arrow size={22} stroke={1.4} className={s.roomArrow} />
                  {peek && <span className={s.roomPeek} aria-hidden="true"><Image src={peek.image} alt="" fill sizes="(max-width: 760px) 64px, 18vw" /></span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* FOG ALERTS */}
      <section className="wrap" aria-labelledby="alerts-h" style={{ paddingBottom: 'clamp(80px,11vw,150px)' }}>
        <div className={s.alerts}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 className="h2" id="alerts-h">Fog <em>alerts.</em></h2>
            <p className="lede">One email when a new print drops or a new pin lands on the map. No schedule, no spam — just the good mornings.</p>
          </div>
          <AlertsForm />
        </div>
      </section>
    </>
  );
}
