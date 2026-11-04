'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCart, useIndexPanel } from './Providers';
import { applyTheme, currentTheme, toggleTheme, type Theme } from '@/lib/theme';
import { pad } from '@/lib/format';

const NAV = [
  { href: '/works', label: 'Works', match: (p: string) => p.startsWith('/works') || p.startsWith('/prints') },
  { href: '/map', label: 'Map', match: (p: string) => p.startsWith('/map') },
  { href: '/stories', label: 'Stories', match: (p: string) => p.startsWith('/stories') },
];

export default function SiteHeader({ workCount }: { workCount: number }) {
  const pathname = usePathname() || '/';
  const over = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<Theme>('day');
  const { count } = useCart();
  const { open, setOpen } = useIndexPanel();
  const indexBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  /* Sync with the pre-paint decision, follow the sun while the page is open, and with other toggles. */
  useEffect(() => {
    setTheme(currentTheme());
    const onTheme = (e: Event) => setTheme((e as CustomEvent<{ theme: Theme }>).detail.theme);
    document.addEventListener('ec:theme', onTheme);
    const timer = window.setInterval(() => {
      const w = window as Window & { __ecIsNight?: (t: number) => boolean };
      if (document.documentElement.getAttribute('data-theme-source') !== 'sun' || !w.__ecIsNight) return;
      const want: Theme = w.__ecIsNight(Date.now()) ? 'night' : 'day';
      if (want !== currentTheme()) applyTheme(want);
    }, 5 * 60 * 1000);
    return () => { document.removeEventListener('ec:theme', onTheme); window.clearInterval(timer); };
  }, []);

  const night = theme === 'night';
  return (
    <header className={`site-header${over ? ' site-header--over' : ''}${scrolled ? ' is-scrolled' : ''}`}>
      <div className="wrap header-row">
        <Link className="brand" href="/" aria-label="explore.cincinnati, home">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-name">explore<span className="brand-sep">.</span>cincinnati</span>
        </Link>
        <nav id="primary-nav" className="nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={n.match(pathname) ? 'page' : undefined}>{n.label}</Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="lights"
            aria-pressed={night}
            aria-label={night ? 'Lights on: switch to day' : 'Lights off: switch to night'}
            title="Lights"
            onClick={(e) => setTheme(toggleTheme(e.currentTarget))}
          >
            <span className="lights-lamp" aria-hidden="true" />
          </button>
          <button
            ref={indexBtn}
            type="button"
            className="index-toggle"
            aria-expanded={open}
            aria-controls="index-panel"
            onClick={() => setOpen(!open)}
          >
            <span>Index</span><span className="index-count" aria-hidden="true">{pad(workCount)}</span>
          </button>
          <Link className="cart" href="/cart" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
            Cart <span className="cart-count">{count}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
