/* Small helpers safe to use on the server and in the browser. */
import type { Post } from './posts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(iso: string, withYear = true): string {
  const [y, m, d] = iso.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}${withYear ? `, ${y}` : ''}`;
}

export function pad(n: number): string {
  return (n < 10 ? '0' : '') + n;
}

/** Posts per neighborhood, counting only names on the city list. */
export function explored(neighborhoods: string[], posts: Pick<Post, 'neighborhood'>[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of posts) {
    if (p.neighborhood && neighborhoods.includes(p.neighborhood)) out[p.neighborhood] = (out[p.neighborhood] || 0) + 1;
  }
  return out;
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Scale the $65-tier size table to a print's base price, rounded to $5. */
export const SIZES = [
  { label: '8 × 10', w: 8, h: 10, base: 65 },
  { label: '12 × 16', w: 12, h: 16, base: 95 },
  { label: '16 × 20', w: 16, h: 20, base: 140 },
  { label: '24 × 30', w: 24, h: 30, base: 240 },
];
export function sizePrice(basePrice: string, sizeIndex: number): number {
  const base = Number(basePrice.replace(/[^0-9.]/g, '')) || 65;
  const v = (SIZES[sizeIndex].base * base) / 65;
  return Math.round(v / 5) * 5;
}
