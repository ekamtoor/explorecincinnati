'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/Providers';

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function CartView() {
  const { lines, count, clear } = useCart();
  const subtotal = lines.reduce((s, l) => s + (Number(l.price) || 0), 0);

  return (
    <section className="wrap cart-page" aria-labelledby="cart-h">
      <div className="cart-head">
        <h1 className="h1" id="cart-h">Your <em>cart.</em></h1>
        <span className="meta">{count} {count === 1 ? 'print' : 'prints'}</span>
      </div>

      {count === 0 ? (
        <div className="cart-empty">
          <p className="lede">Nothing here yet. Walk the room and pick something for your wall.</p>
          <Link className="btn" href="/works">Walk the collection</Link>
        </div>
      ) : (
        <div className="cart-grid">
          <ul className="cart-lines">
            {lines.map((l, i) => (
              <li className="cart-line" key={`${l.id}-${i}`}>
                <span className="plate-frame">
                  <Image src={l.image} alt="" fill sizes="88px" />
                </span>
                <div>
                  <h2 className="cart-line-title"><Link href={`/prints/${l.id}`}>{l.title}</Link></h2>
                  <p className="meta" style={{ margin: '6px 0 0' }}>{[l.size, l.paper, l.frame].filter(Boolean).join(' · ')}</p>
                </div>
                <span className="cart-line-price">{money(Number(l.price) || 0)}</span>
              </li>
            ))}
          </ul>
          <aside className="cart-summary" aria-label="Summary">
            <div className="cart-total"><span className="meta">Subtotal</span><strong>{money(subtotal)}</strong></div>
            <p className="meta" style={{ margin: 0 }}>Shipping and tax are worked out at checkout. Prints ship in 3–5 business days from Cincinnati.</p>
            <button type="button" className="btn" disabled aria-describedby="checkout-note">Checkout</button>
            <p className="meta" id="checkout-note" style={{ margin: 0 }}>Checkout isn’t connected on this test site yet.</p>
            <button type="button" className="cart-clear" onClick={clear}>Clear cart</button>
          </aside>
        </div>
      )}
    </section>
  );
}
