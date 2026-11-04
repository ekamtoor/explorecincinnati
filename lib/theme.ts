'use client';
/* Day / night. The first decision happens in /js/theme-init.js before paint; this flips it later. */
export type Theme = 'day' | 'night';

export function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'night' ? 'night' : 'day';
}

export function applyTheme(theme: Theme, fromEl?: HTMLElement | null) {
  const root = document.documentElement;
  const apply = () => {
    root.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'night' ? '#12110E' : '#F3F0E8');
    document.dispatchEvent(new CustomEvent('ec:theme', { detail: { theme } }));
  };
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (fromEl && doc.startViewTransition && !reduce) {
    const r = fromEl.getBoundingClientRect();
    root.style.setProperty('--lx', `${r.left + r.width / 2}px`);
    root.style.setProperty('--ly', `${r.top + r.height / 2}px`);
    root.classList.add('vt-lights');
    doc.startViewTransition(apply).finished.finally(() => root.classList.remove('vt-lights'));
  } else apply();
}

/** The visitor flips the lamp: remember the choice. */
export function toggleTheme(fromEl?: HTMLElement | null): Theme {
  const next: Theme = currentTheme() === 'night' ? 'day' : 'night';
  try { localStorage.setItem('ec-lights', next); } catch { /* ignore */ }
  document.documentElement.setAttribute('data-theme-source', 'manual');
  applyTheme(next, fromEl);
  return next;
}

/** Read CSS custom properties (used by the map to colour vector layers). */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
