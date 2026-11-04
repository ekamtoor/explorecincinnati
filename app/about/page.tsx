import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPost, getSiteData } from '@/lib/posts';
import { explored } from '@/lib/format';
import s from '@/components/home/home.module.css';

export const metadata: Metadata = {
  title: 'About',
  description: 'explore.cincinnati is a living collection of photographs of the Queen City — every post with its story, its place on the map, and a print.',
};

export default function About() {
  const data = getSiteData();
  const hoods = Object.keys(explored(data.neighborhoods, data.posts)).length;
  const photo = getPost('spring-grove-reflection') ?? data.posts[0];

  return (
    <>
      <section className={`wrap ${s.aboutHero}`} aria-labelledby="about-h">
        <p className="eyebrow rise">About</p>
        <h1 id="about-h" className="h1 rise d1" style={{ marginTop: 20, maxWidth: '14ch' }}>A city, <em>seen slowly.</em></h1>
      </section>

      <section className="section wrap" aria-label="The project">
        <div className={s.aboutGrid}>
          {photo && (
            <figure className="plate reveal">
              <div className="plate-frame ratio-45" style={{ position: 'relative' }}>
                <Image src={photo.image} alt={photo.alt} fill sizes="(max-width: 860px) 100vw, 42vw" />
              </div>
              <figcaption className="meta">No. 05 · Spring Grove — shown as posted, upside down.</figcaption>
            </figure>
          )}
          <div className={`${s.aboutCopy} reveal`}>
            <blockquote className={s.quote}>I flipped this one on purpose. The reflection was sharper than the real thing that morning.</blockquote>
            <p>
              explore.cincinnati is the work of [PHOTOGRAPHER NAME], a photographer based in [NEIGHBORHOOD]. It started as an Instagram account
              and grew into a habit: going out when the fog sits on the river, finding the overlook nobody uses, and writing down what it was like to stand there.
            </p>
            <p>
              On Instagram the captions run long on purpose — the history of the spot, the time of night, the settings, the near-misses. Here they hang beside
              the photograph like a wall label: readable, searchable, pinned to the map, and linked to the print.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link className="btn" href="/works">See the works</Link>
              <a className="btn btn--ghost" href="https://www.instagram.com/explore.cincinnati/" target="_blank" rel="noopener noreferrer">@explore.cincinnati</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section rule-top wrap" aria-labelledby="grow-h">
        <div className={s.headRow}>
          <h2 className="h2" id="grow-h">How the map <em>grows.</em></h2>
          <p className="meta" style={{ fontSize: '.95rem' }}>{data.posts.length} works so far · {hoods} of {data.neighborhoods.length} neighborhoods</p>
        </div>
        <ol className={s.steps}>
          <li><span className="h3">A photograph goes up</span><p>A new post on @explore.cincinnati — fog on the river, a stairway in Mt. Adams, a mural in Over-the-Rhine.</p></li>
          <li><span className="h3">It becomes a story</span><p>The full caption is published here with the exact spot it was taken, and the print if there is one.</p></li>
          <li><span className="h3">The map moves</span><p>A pin drops, the route extends, and the neighborhood it was taken in lights up on the living map.</p></li>
        </ol>
        <p style={{ marginTop: 32 }}><Link className="link" href="/map">Open the living map</Link></p>
      </section>

      <section className="section rule-top wrap" aria-labelledby="contact-h">
        <h2 className="h2" id="contact-h" style={{ marginBottom: 'clamp(32px,4vw,56px)' }}>Get in <em>touch.</em></h2>
        <div className={s.contact}>
          <div><span className="h3">Prints &amp; commissions</span><p>[EMAIL] — framing questions, gifts, larger sizes and private commissions.</p></div>
          <div><span className="h3">Licensing</span><p>Editorial and commercial licensing for any photograph in the collection. [LICENSING EMAIL]</p></div>
          <div><span className="h3">Say hello</span><p>Know a corner of the city that should be on the map? Send it over on <a className="link" href="https://www.instagram.com/explore.cincinnati/" target="_blank" rel="noopener noreferrer">Instagram</a>.</p></div>
        </div>
      </section>
    </>
  );
}
