# explore.cincinnati

Photographs of Cincinnati, fine-art prints, the stories behind them, and a living map that grows with every post.
Built with **Next.js** (App Router, React, TypeScript), deployed on Vercel.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## How the site grows

Everything comes from **`public/data/posts.json`**. Add one object to `posts` and the home page, works, stories,
print pages, the map, the Index and the sitemap all update on the next deploy. Inside Cincinnati a post's
neighborhood is worked out from its `lat`/`lng` using `public/data/neighborhoods.geojson`; `neighborhood` is
only used for places outside the city. Leave `lat`/`lng` as `null` to keep a spot private.

Dates, coordinates and captions in the current file are SAMPLE values.

## Structure

- `app/` — routes: `/`, `/works`, `/stories`, `/stories/[id]`, `/prints/[id]`, `/map`, `/about`, `/cart`
- `components/` — header, Index, footer, map and shared pieces
- `lib/posts.ts` — reads the data at build time; `lib/format.ts` — dates, prices; `lib/theme.ts` — day/night
- `app/globals.css` — the design system (paper/ink by day, after-dark palette at night)
- `public/img/` — photographs (resized automatically per screen by `next/image`; add larger originals for sharper images)
- `public/studio.html` — the private Studio mockup (static, legacy)
- `legacy/` — the previous plain-HTML version, kept for reference

## Notes before launch

- Map tiles: CARTO's free basemap is for non-commercial use — get a CARTO, MapTiler or Stadia key for the store.
- Neighborhood outlines are approximate 2013 data; replace with the city's official CAGIS file.
- Placeholders: `[PHOTOGRAPHER NAME]`, `[N]`, captions, dates.
