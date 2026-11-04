'use client';
/* Home-page preview of the living map. STUB — implemented by the map work.
   Contract: posts carry coordinates; neighborhood outlines are fetched from /data/neighborhoods.geojson. */
export type MapPost = {
  id: string; no: number; title: string; place: string; room: string; date: string;
  lat: number | null; lng: number | null; pinned: boolean; inCity: boolean; neighborhood: string | null; story: string;
};
export default function MiniMap({ posts }: { posts: MapPost[]; className?: string }) {
  return <div data-mini-map-stub={posts.length} style={{ position: 'absolute', inset: 0 }} />;
}
