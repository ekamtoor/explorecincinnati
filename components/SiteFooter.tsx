import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-col footer-about">
            <span className="brand"><span className="brand-name">explore<span className="brand-sep">.</span>cincinnati</span></span>
            <p className="meta" style={{ maxWidth: '34ch', margin: '8px 0 0', fontSize: '.9rem' }}>
              Photographs and prints from the Queen City by [PHOTOGRAPHER NAME]. Printed locally, shipped everywhere.
            </p>
          </div>
          <nav className="footer-col" aria-label="Collection">
            <span className="eyebrow">Collection</span>
            <Link href="/works">All prints</Link>
            <Link href="/works">Galleries</Link>
            <Link href="/prints/roebling-fog">Framing</Link>
            <Link href="/about">Gift cards</Link>
          </nav>
          <nav className="footer-col" aria-label="Explore">
            <span className="eyebrow">Explore</span>
            <Link href="/stories">Stories</Link>
            <Link href="/map">The map</Link>
            <Link href="/about">About</Link>
            <Link href="/about">Licensing</Link>
          </nav>
          <nav className="footer-col" aria-label="Follow">
            <span className="eyebrow">Follow</span>
            <a href="https://www.instagram.com/explore.cincinnati/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <Link href="/about">TikTok</Link>
            <Link href="/about">YouTube</Link>
          </nav>
        </div>
        <p className="footer-mark" aria-hidden="true">explore<em>.</em>cincinnati</p>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} explore.cincinnati · All photographs © [PHOTOGRAPHER NAME]</span>
          <span>Shipping · Returns · Privacy</span>
        </div>
      </div>
    </footer>
  );
}
