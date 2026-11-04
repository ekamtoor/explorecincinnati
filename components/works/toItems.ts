import type { Post } from '@/lib/posts';
import type { WorkItem } from './Toolbar';

/** Only what the browser needs, in the order given (pages pass newest first). */
export function toWorkItems(posts: Post[]): WorkItem[] {
  return posts.map(({ id, no, title, print, place, room, date, image, alt, excerpt, story, printUrl, price, badge, pinned }) => ({
    id, no, title, print: print || title, place, room, date, image, alt, excerpt, story, printUrl, price, badge, pinned,
  }));
}
