import type { Metadata } from 'next';
import { Suspense } from 'react';
import '@/components/works/works.css';
import WorksWalk, { WorksView } from '@/components/works/WorksWalk';
import { toWorkItems } from '@/components/works/toItems';
import { getSiteData, newestFirst } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Works',
  description: 'Archival prints of Cincinnati, signed and numbered — hung along one wall. Walk the room, then take one home.',
  alternates: { canonical: '/works' },
};

export default function WorksPage() {
  const { rooms } = getSiteData();
  const works = toWorkItems(newestFirst());
  return (
    <>
      <h1 className="sr-only">Works — the prints</h1>
      {/* Prerendered with every room shown; the ?room= filter takes over in the browser. */}
      <Suspense fallback={<WorksView works={works} rooms={rooms} room="All" />}>
        <WorksWalk works={works} rooms={rooms} />
      </Suspense>
      <section className="section wrap" aria-label="About the prints" style={{ paddingTop: 'clamp(48px,6vw,88px)' }}>
        <div className="works-promise">
          <div><span className="num">01</span><h3 className="h3">Archival paper</h3><p>Cotton matte or baryta. Rated 100+ years.</p></div>
          <div><span className="num">02</span><h3 className="h3">Signed &amp; numbered</h3><p>Hand-signed on the back, with the edition number.</p></div>
          <div><span className="num">03</span><h3 className="h3">Framed locally</h3><p>Black or natural oak, built in [NEIGHBORHOOD].</p></div>
          <div><span className="num">04</span><h3 className="h3">Easy returns</h3><p>30 days, no questions.</p></div>
        </div>
      </section>
    </>
  );
}
