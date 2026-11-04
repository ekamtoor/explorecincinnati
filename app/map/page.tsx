import type { Metadata } from 'next';
import { getSiteData } from '@/lib/posts';
import LivingMap from '@/components/map/LivingMap';

export const metadata: Metadata = {
  title: 'The living map',
  description: 'Every place explore.cincinnati has photographed, pinned on a map of Cincinnati that grows with every post — and fills in neighborhood by neighborhood.',
  openGraph: { title: 'The living map — explore.cincinnati', images: ['/img/bellevue-hill.webp'] },
};

export default function MapPage() {
  const { posts, rooms, neighborhoods } = getSiteData();
  return <LivingMap posts={posts} rooms={rooms} neighborhoods={neighborhoods} />;
}
