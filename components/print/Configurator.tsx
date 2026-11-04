'use client';
/* Print configurator: size / paper / frame with a live price, previewed on a real wall. */
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { SIZES, sizePrice } from '@/lib/format';
import { useCart } from '@/components/Providers';
import s from './print.module.css';

/* How wide each size hangs on the preview wall (% of the stage), to scale over a 4 ft bench. */
const PREVIEW_WIDTH = [24, 31, 37, 47];
const PAPERS = [
  { label: 'Matte cotton', sub: 'Soft, no glare', mat: '#F7F5EF', gloss: false },
  { label: 'Baryta gloss', sub: 'Deep blacks, light sheen', mat: '#FFFFFF', gloss: true },
];
const FRAMES = [
  { label: 'Unframed', add: 0, swatch: '', color: 'transparent' },
  { label: 'Black oak', add: 85, swatch: '#161719', color: '#161719' },
  { label: 'Natural oak', add: 85, swatch: '#C9A77A', color: '#C9A77A' },
];

type Props = {
  id: string;
  title: string;
  image: string;
  alt: string;
  basePrice: string;
  crumbs: React.ReactNode;
  head: React.ReactNode;
};

export default function Configurator({ id, title, image, alt, basePrice, crumbs, head }: Props) {
  const [size, setSize] = useState(1);
  const [paper, setPaper] = useState(0);
  const [frame, setFrame] = useState(0);
  const [view, setView] = useState<'wall' | 'print'>('wall');
  const [added, setAdded] = useState(false);
  const [status, setStatus] = useState('');
  const { add, count } = useCart();

  const sz = SIZES[size], pp = PAPERS[paper], fr = FRAMES[frame];
  const total = sizePrice(basePrice, size) + fr.add;
  const summary = `${sz.label} in · ${pp.label} · ${fr.label}`;
  const framed = fr.add > 0;

  const choose = (fn: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => { fn(Number(e.target.value)); setAdded(false); };

  const onAdd = () => {
    add({ id, title, size: sz.label, paper: pp.label, frame: fr.label, price: total, image });
    setAdded(true);
    setStatus(`${sz.label} added — ${count + 1} in your cart.`);
  };

  return (
    <>
      <div className="rise">
        {crumbs}
        <div className={`${s.stage}${view === 'print' ? ` ${s.isPrint}` : ''}`}>
          <span className={s.light} aria-hidden="true" />
          <span className={s.floor} aria-hidden="true" />
          <span className={s.bench} aria-hidden="true" />
          <div
            className={`${s.art}${pp.gloss ? ` ${s.isGloss}` : ''}`}
            style={{
              ['--w' as string]: PREVIEW_WIDTH[size],
              background: pp.mat,
              padding: framed ? '7%' : 0,
              border: framed ? `clamp(5px, ${0.9 + size * 0.15}vw, 14px) solid ${fr.color}` : '0 solid transparent',
            }}
          >
            <div className={s.artImg}>
              <Image src={image} alt={alt} fill priority sizes="(max-width: 960px) 66vw, 30vw" />
            </div>
          </div>
          <div className={s.viewToggle} role="group" aria-label="Preview">
            <button type="button" className="chip" aria-pressed={view === 'wall'} onClick={() => setView('wall')}>On a wall</button>
            <button type="button" className="chip" aria-pressed={view === 'print'} onClick={() => setView('print')}>Print only</button>
          </div>
        </div>
        <div className={s.stageCap}>
          <span className="meta"><span className="num">Your configuration</span> — <strong>{summary}</strong></span>
          <span className="meta">{view === 'wall' ? 'To scale over a 4 ft bench' : 'Print only'}</span>
        </div>
      </div>

      <form className={`${s.buy} rise d1`} onSubmit={(e) => e.preventDefault()}>
        <div className={s.buyHead}>{head}</div>
        <div className={s.priceRow}>
          <span className={s.price} aria-live="polite">${total}</span>
          <span className="meta">Signed, numbered, certificate included</span>
        </div>

        <fieldset>
          <legend><span>Size</span><span className="meta">inches, image area</span></legend>
          <div className={`${s.tiles} ${s.tiles2}`}>
            {SIZES.map((x, i) => (
              <label key={x.label} className={s.tile}>
                <input type="radio" name="size" value={i} checked={size === i} onChange={choose(setSize)} />
                <span className={s.tileFace}><span className={s.tileLabel}>{x.label}</span><span className={s.tileSub}>${sizePrice(basePrice, i)}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend><span>Paper</span></legend>
          <div className={`${s.tiles} ${s.tiles2}`}>
            {PAPERS.map((x, i) => (
              <label key={x.label} className={s.tile}>
                <input type="radio" name="paper" value={i} checked={paper === i} onChange={choose(setPaper)} />
                <span className={s.tileFace}><span className={s.tileLabel}>{x.label}</span><span className={s.tileSub}>{x.sub}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend><span>Frame</span></legend>
          <div className={`${s.tiles} ${s.tiles3}`}>
            {FRAMES.map((x, i) => (
              <label key={x.label} className={s.tile}>
                <input type="radio" name="frame" value={i} checked={frame === i} onChange={choose(setFrame)} />
                <span className={s.tileFace}>
                  <span className={s.tileLabel}>{x.swatch && <span className={s.swatch} style={{ background: x.swatch }} />}{x.label}</span>
                  <span className={s.tileSub}>{x.add ? `+$${x.add}` : 'Included'}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={s.actions}>
          <button type="button" className={`btn${added ? ` ${s.added}` : ''}`} onClick={onAdd}>
            {added ? 'Added to cart ✓' : `Add to cart · $${total}`}
          </button>
          <button type="button" className="btn btn--ghost" disabled aria-describedby="buy-now-note">Buy now · Apple Pay / Shop Pay</button>
          <p className="meta" id="buy-now-note" style={{ margin: 0 }}>Checkout isn’t connected on this test site yet.</p>
          <p className="meta" style={{ margin: '6px 0 0' }}>Ships in 3–5 business days from Cincinnati; framed in 7–10. 30-day returns. Free shipping over [AMOUNT].</p>
          <p className="meta" role="status" style={{ margin: 0 }}>
            {status && <>{status} <Link className="link" href="/cart">View cart</Link></>}
          </p>
        </div>

        <details className={s.details}>
          <summary>Paper, printing &amp; the signed back <span className={s.plus} aria-hidden="true">+</span></summary>
          <p>Printed on [PAPER NAME], a 100% cotton archival paper, with pigment inks rated 100+ years. A 0.5″ white border for matting; signed and numbered on the back with the edition stamp.</p>
        </details>
      </form>
    </>
  );
}
