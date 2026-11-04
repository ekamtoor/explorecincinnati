import type { MetadataRoute } from 'next';
import { getSiteData } from '@/lib/posts';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const { posts } = getSiteData();
  const latest = posts[posts.length - 1]?.date;
  const page = (path: string, lastModified?: string) => ({ url: `${SITE_URL}${path}`, lastModified });
  return [
    page('/', latest), page('/works', latest), page('/stories', latest), page('/map', latest), page('/about'),
    ...posts.flatMap((p) => [page(p.story, p.date), page(p.printUrl, p.date)]),
  ];
}
