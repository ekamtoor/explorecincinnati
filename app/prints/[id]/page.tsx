import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPost, getSiteData } from '@/lib/posts';
import { fmtDate, pad } from '@/lib/format';
import Arrow from '@/components/story/Arrow';
import Configurator from '@/components/print/Configurator';
import s from '@/components/print/print.module.css';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getSiteData().posts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const p = getPost(id);
  if (!p) return {};
  const title = `${p.print || p.title} — Print`;
  const description = `Archival pigment print · from ${p.price}. ${p.place}, signed and numbered.`;
  return {
    title,
    description,
    alternates: { canonical: p.printUrl },
    openGraph: { type: 'website', title, description, url: p.printUrl, images: [{ url: p.image, alt: p.alt }] },
    twitter: { card: 'summary_large_image', title, description, images: [p.image] },
    other: { 'product:price:amount': p.price.replace(/[^0-9.]/g, ''), 'product:price:currency': 'USD' },
  };
}

/* Serif title with the words after the first comma set in italic: "Roebling, *in the fog*". */
function SplitTitle({ text }: { text: string }) {
  const m = text.match(/^(.*?,)\s*(.+)$/);
  return m ? <>{m[1]} <em>{m[2]}</em></> : <>{text}</>;
}

export default async function PrintPage({ params }: Params) {
  const { id } = await params;
  const p = getPost(id);
  if (!p) notFound();
  const { posts } = getSiteData();
  const title = p.print || p.title;
  const no = `No. ${pad(p.no)}`;
  const hood = p.neighborhood && p.neighborhood !== p.place ? ` · ${p.neighborhood}` : '';

  // Related: same room first, then the newest of the rest — three works.
  const others = posts.filter((x) => x.id !== p.id);
  const same = others.filter((x) => x.room === p.room);
  const rest = others.filter((x) => x.room !== p.room).reverse();
  const picks = [...same, ...rest].slice(0, 3);

  return (
    <>
      <section className={`wrap ${s.product}`} aria-labelledby="print-title">
        <Configurator
          id={p.id}
          title={title}
          image={p.image}
          alt={p.alt}
          basePrice={p.price}
          crumbs={
            <nav className={s.crumbs} aria-label="Breadcrumb">
              <Link href="/works">Collection</Link><span aria-hidden="true">/</span>
              <Link href="/works">{p.room}</Link><span aria-hidden="true">/</span>
              <span aria-current="page">{no}</span>
            </nav>
          }
          head={
            <>
              <p className="eyebrow">{no} · {p.room}</p>
              {p.badge && <span className="badge"><span className="dot" />{p.badge}</span>}
              <h1 className={`h1 ${s.buyTitle}`} id="print-title"><SplitTitle text={title} /></h1>
              <p className="meta">{p.place} · {fmtDate(p.date)} · Edition of [N], [N] remaining</p>
            </>
          }
        />
      </section>

      <section className="section rule-top wrap" aria-labelledby="label-h">
        <div className={s.labelGrid}>
          <div className={`${s.labelSide} reveal`}>
            <p className="eyebrow">Wall label</p>
            <h2 className="h2" id="label-h">{p.title}</h2>
            <dl className={s.spec}>
              <dt>Posted</dt><dd>{fmtDate(p.date)}</dd>
              <dt>Where</dt><dd>{p.place}{hood}</dd>
              <dt>Camera</dt><dd>[CAMERA] · [LENS]</dd>
              <dt>Settings</dt><dd>[f-stop] · [shutter] · ISO [N]</dd>
            </dl>
            <div className={s.labelLinks}>
              <Link className="link" href={p.story}>Read the full story <Arrow /></Link>
              {p.pinned && <Link className="link" href={`/map#${p.id}`}>Pinned on the map <Arrow /></Link>}
            </div>
          </div>
          <div className={`${s.captionProse} reveal`}>
            <p>{p.excerpt}</p>
            <p>[The Instagram caption, synced automatically. The first paragraphs show here; the full text lives on the story page.]</p>
          </div>
        </div>
      </section>

      <section className="section rule-top wrap" aria-labelledby="related-h" style={{ paddingBottom: 'clamp(72px,10vw,140px)' }}>
        <div className="section-head">
          <div>
            <p className="eyebrow">Keep looking</p>
            <h2 className="h2" id="related-h">Also in <em>{same.length ? p.room : 'the collection'}</em></h2>
          </div>
          <Link className="link" href="/works">The whole collection <Arrow /></Link>
        </div>
        <div className={s.related}>
          {picks.map((x) => (
            <Link key={x.id} className="plate" href={x.printUrl}>
              <span className="plate-frame">
                <Image src={x.image} alt={x.alt} fill sizes="(max-width: 760px) 70vw, 33vw" />
              </span>
              <span className="plate-cap">
                <span className="num">No. {pad(x.no)}</span>
                <span className="h3">{x.print || x.title}</span>
                <span className="meta">{x.room} · from {x.price}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
