import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPost, getSiteData } from '@/lib/posts';
import { directionsUrl, fmtDate, pad } from '@/lib/format';
import Arrow from '@/components/story/Arrow';
import SpotMap from '@/components/story/SpotMap';
import s from './story.module.css';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getSiteData().posts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const p = getPost(id);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: p.story },
    openGraph: { type: 'article', title: p.title, description: p.excerpt, url: p.story, publishedTime: p.date, images: [{ url: p.image, alt: p.alt }] },
    twitter: { card: 'summary_large_image', title: p.title, description: p.excerpt, images: [p.image] },
  };
}

export default async function StoryPage({ params }: Params) {
  const { id } = await params;
  const { posts } = getSiteData();
  const idx = posts.findIndex((x) => x.id === id);
  if (idx < 0) notFound();
  const p = posts[idx];
  const no = `No. ${pad(p.no)}`;
  const hood = p.neighborhood && p.neighborhood !== p.place ? p.neighborhood : '';
  const prev = posts[idx - 1];
  const next = posts[idx + 1];
  const others = posts.slice().reverse().filter((x) => x.id !== p.id).slice(0, 3);
  const support = posts.find((x) => x.id !== p.id && x.room === p.room) ?? others[0];

  return (
    <>
      <article>
        <div className="wrap">
          <nav className={`${s.crumbs} rise`} aria-label="Breadcrumb">
            <Link href="/stories">Stories</Link><span aria-hidden="true">/</span>
            <Link href="/works">{p.room}</Link><span aria-hidden="true">/</span>
            <span aria-current="page">{no}</span>
          </nav>

          <header className={s.head}>
            <div>
              <div className={`${s.kicker} rise`}>
                <span className="num">{no}</span>
                <span className="eyebrow">{p.place} · {fmtDate(p.date)}</span>
              </div>
              <h1 className={`h1 ${s.title} rise d1`}>{p.title}</h1>
            </div>
            <p className={`${s.standfirst} rise d2`}>{p.excerpt}</p>
          </header>

          <figure className={`${s.hero} plate rise d3`}>
            <div className="plate-frame">
              <Image src={p.image} alt={p.alt} fill priority sizes="(max-width: 1440px) 100vw, 1340px" />
            </div>
            <figcaption>
              <span className="meta"><span className="num">{no}</span> · {p.print} · Archival pigment print</span>
              <Link className="link" href={p.printUrl}>Available as a print <Arrow /></Link>
            </figcaption>
          </figure>
        </div>

        <div className="section wrap">
          <div className={s.body}>
            <aside className={s.labelCol} aria-label="Wall label">
              <p className="eyebrow">Wall label</p>
              <dl className={s.wallLabel}>
                <dt>Work</dt><dd>{p.print}</dd>
                <dt>Place</dt><dd>{p.place}</dd>
                <dt>Area</dt><dd>{hood || '—'}</dd>
                <dt>Date</dt><dd>{fmtDate(p.date)}</dd>
                <dt>Camera</dt><dd>[CAMERA] · [LENS]</dd>
                <dt>Settings</dt><dd>[f-stop] · [shutter] · ISO [N]</dd>
                <dt>Gallery</dt><dd>{p.room}</dd>
              </dl>
              <Link className={s.own} href={p.printUrl}>
                <Image src={p.image} alt="" width={64} height={80} sizes="64px" />
                <span><strong>Own this print</strong><span className="meta">from {p.price} · signed &amp; numbered</span></span>
                <Arrow size={18} width={1.6} />
              </Link>
              <a className="link" href={p.instagram} target="_blank" rel="noopener noreferrer">See the original post <Arrow /></a>
            </aside>

            <div className={s.article}>
              <span className={s.placeholderNote}>Placeholder · full caption syncs from Instagram</span>
              <p className={s.first}>[The full Instagram caption lives here, formatted as proper paragraphs. The first paragraph is set larger as the lede.]</p>
              <p>[Second paragraph — the history of the spot: when it was built, who built it, why the light falls the way it does on nights like this one…]</p>
              <blockquote className={s.pull}>[A line from the caption worth pulling out — the moment the shot came together.]</blockquote>
              <p>[Third paragraph — how the shot was made: the wait, the tripod, the headlights that almost ruined it, the frame that finally worked.]</p>
              {support && (
                <figure className={`${s.inlineFig} plate`}>
                  <div className="plate-frame ratio-32">
                    <Image src={support.image} alt={support.alt} fill sizes="(max-width: 860px) 100vw, 640px" />
                  </div>
                  <figcaption className="meta">[Supporting frame from the same outing.]</figcaption>
                </figure>
              )}
              <p>[Closing — where to stand if you want to try it yourself, and the best time of year to go.]</p>
              <div className={s.tags}>
                <Link className="chip" href="/stories">History</Link>
                <Link className="chip" href="/stories">How it was shot</Link>
                <Link className="chip" href="/works">{p.room}</Link>
                {p.pinned && <Link className="chip" href={`/map#${p.id}`}><span className="dot" />On the map</Link>}
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className="section rule-top wrap" aria-labelledby="where-h">
        <div className={s.where}>
          <div className={s.whereCopy}>
            <p className="eyebrow">Where it was taken</p>
            <h2 className="h2" id="where-h">Go stand <em>in the same place.</em></h2>
            <p className="lede">{p.place}{hood ? ` · ${hood}` : ''}</p>
            <div className={s.whereLinks}>
              <Link className="btn" href={`/map#${p.id}`}>See it on the living map</Link>
              {p.pinned && (
                <a className="btn btn--ghost" href={directionsUrl(p.lat as number, p.lng as number)} target="_blank" rel="noopener noreferrer">Directions</a>
              )}
            </div>
          </div>
          <div className={s.spotMap}>
            {p.pinned ? (
              <SpotMap lat={p.lat as number} lng={p.lng as number} label={no} title={p.title} />
            ) : (
              <div className={s.spotEmpty}>
                <p className="eyebrow">Location to come</p>
                <p className="h2"><em>Somewhere</em> in the city.</p>
                <p className="meta">This spot isn’t pinned yet — it will appear on the map once it is.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <nav className="wrap" aria-label="More stories">
        <div className={s.pager}>
          {prev && (
            <Link href={prev.story}>
              <span className="eyebrow">← Earlier</span>
              <span className={s.pagerTitle}>{prev.title}</span>
              <span className="meta">No. {pad(prev.no)} · {prev.place}</span>
            </Link>
          )}
          {next && (
            <Link href={next.story} className={s.later}>
              <span className="eyebrow">Later →</span>
              <span className={s.pagerTitle}>{next.title}</span>
              <span className="meta">No. {pad(next.no)} · {next.place}</span>
            </Link>
          )}
        </div>
      </nav>

      <section className="section wrap" aria-labelledby="walk-h">
        <div className="section-head">
          <div>
            <p className="eyebrow">More from the feed</p>
            <h2 className="h2" id="walk-h">Keep <em>walking.</em></h2>
          </div>
          <Link className="link" href="/stories">All stories <Arrow /></Link>
        </div>
        <div className={s.walkGrid}>
          {others.map((q) => (
            <Link key={q.id} className="plate" href={q.story}>
              <span className="plate-frame ratio-45">
                <Image src={q.image} alt={q.alt} fill sizes="(max-width: 760px) 78vw, 33vw" />
              </span>
              <span className="plate-cap">
                <span className="num">No. {pad(q.no)}</span>
                <span className="h3">{q.title}</span>
                <span className="meta">{q.place} · {fmtDate(q.date)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
