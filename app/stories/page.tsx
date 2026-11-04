import type { Metadata } from 'next';
import { Suspense } from 'react';
import '@/components/works/works.css';
import StoriesList, { StoriesView } from '@/components/works/StoriesList';
import { toWorkItems } from '@/components/works/toItems';
import { getSiteData, newestFirst } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Stories',
  description: 'The captions, unabridged — every explore.cincinnati post as a story: the place, the history, how it was shot, and the print.',
  alternates: { canonical: '/stories' },
};

export default function StoriesPage() {
  const { rooms } = getSiteData();
  const stories = toWorkItems(newestFirst());
  return (
    <>
      <h1 className="sr-only">Stories</h1>
      <Suspense fallback={<StoriesView stories={stories} rooms={rooms} room="All" />}>
        <StoriesList stories={stories} rooms={rooms} />
      </Suspense>
    </>
  );
}
