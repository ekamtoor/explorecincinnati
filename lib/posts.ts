/* The single source of truth for the site: public/data/posts.json + neighborhood outlines.
   Read at build time on the server. Adding a post to posts.json updates every page. */
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import rawPosts from '@/public/data/posts.json';

export type Post = {
  id: string;
  no: number;
  title: string;          // story title
  print: string;          // print title
  place: string;
  neighborhood: string | null;
  lat: number | null;
  lng: number | null;
  date: string;           // ISO yyyy-mm-dd
  room: string;
  image: string;          // /img/...
  alt: string;
  excerpt: string;
  story: string;          // /stories/<id>
  printUrl: string;       // /prints/<id>
  price: string;          // "$65"
  badge: string;
  instagram: string;
  pinned: boolean;        // has coordinates
  inCity: boolean;        // inside a Cincinnati neighborhood outline
};

export type SiteData = {
  rooms: string[];
  neighborhoods: string[];
  posts: Post[];          // oldest → newest
};

type Ring = number[][];
type Geometry = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };
type Feature = { type: 'Feature'; properties: { name: string }; geometry: Geometry };
export type NeighborhoodCollection = { type: 'FeatureCollection'; features: Feature[] };

const geo = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/neighborhoods.geojson'), 'utf8'),
) as NeighborhoodCollection;

function inRings(x: number, y: number, rings: Ring[]) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

export function neighborhoodAt(lat: number, lng: number): string | null {
  for (const f of geo.features) {
    const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
    if (polys.some((rings) => inRings(lng, lat, rings))) return f.properties.name;
  }
  return null;
}

let cached: SiteData | null = null;
export function getSiteData(): SiteData {
  if (cached) return cached;
  const src = rawPosts as unknown as { rooms: string[]; posts: Omit<Post, 'pinned' | 'inCity'>[] };
  const posts: Post[] = src.posts
    .map((p) => {
      const pinned = typeof p.lat === 'number' && typeof p.lng === 'number';
      const auto = pinned ? neighborhoodAt(p.lat as number, p.lng as number) : null;
      return { ...p, neighborhood: auto ?? p.neighborhood, pinned, inCity: !!auto };
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.no - b.no));
  cached = {
    rooms: src.rooms,
    neighborhoods: geo.features.map((f) => f.properties.name).sort(),
    posts,
  };
  return cached;
}

export function getNeighborhoods(): NeighborhoodCollection { return geo; }
export function getPost(id: string): Post | undefined { return getSiteData().posts.find((p) => p.id === id); }
export function newestFirst(): Post[] { return getSiteData().posts.slice().reverse(); }
