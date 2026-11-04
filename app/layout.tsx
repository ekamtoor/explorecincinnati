import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/jost';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { Providers } from '@/components/Providers';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import IndexPanel, { type IndexItem } from '@/components/IndexPanel';
import { getSiteData, newestFirst } from '@/lib/posts';
import { explored, fmtDate } from '@/lib/format';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'explore.cincinnati — Cincinnati, on view', template: '%s — explore.cincinnati' },
  description: 'Photographs, fine-art prints and the stories behind them — Cincinnati, seen slowly, and a map that grows with every post.',
  openGraph: { siteName: 'explore.cincinnati', type: 'website', images: ['/img/skyline-fog.webp'] },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F3F0E8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const data = getSiteData();
  const newest = newestFirst();
  const items: IndexItem[] = newest.map(({ id, no, title, place, date, room, image, alt, story }) => ({ id, no, title, place, date, room, image, alt, story }));
  const hoods = Object.keys(explored(data.neighborhoods, data.posts)).length;
  const summary = `${data.posts.length} works · ${hoods} of ${data.neighborhoods.length} neighborhoods · updated ${newest[0] ? fmtDate(newest[0].date) : ''}`;

  return (
    <html lang="en" data-theme="day" suppressHydrationWarning>
      <head>
        {/* Day or night before first paint — follows the real sunset over Cincinnati. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/js/theme-init.js" />
      </head>
      <body>
        <Providers>
          <a className="skip" href="#main">Skip to content</a>
          <SiteHeader workCount={data.posts.length} />
          <main id="main">{children}</main>
          <SiteFooter />
          <IndexPanel items={items} rooms={data.rooms} summary={summary} />
        </Providers>
      </body>
    </html>
  );
}
