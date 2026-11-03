# explore.cincinnati — test site

Photographs of Cincinnati, fine-art prints, the stories behind them, and a map that grows with every post.
Plain HTML/CSS/JS, no build step. Deployed on Vercel from this repo.

## Pages

- `index.html` — Home: hero, latest posts, map preview, print of the month, the four rooms
- `map.html` — **The living map**: every post pinned on a map of Cincinnati, with a timeline, room filters, the route walked, and a neighborhood checklist
- `collection.html` — Prints (gallery walk) ⇄ Stories (`collection.html#stories`)
- `print.html?id=…` — Print detail with size / paper / frame configurator
- `story.html?id=…` — A story (full Instagram caption), with a small map of where it was taken
- `studio.html` — Private admin & analytics mockup (sample data; still on the old styles)

## How the map (and the rest of the site) grows

Everything is driven by **`data/posts.json`**. To add a post, add one object to `posts`:

```json
{
  "id": "mt-adams-steps",
  "no": 8,
  "title": "The steps nobody counts",
  "print": "Mt. Adams steps",
  "place": "Mt. Adams steps",
  "neighborhood": "Mt. Adams",
  "lat": 39.1093, "lng": -84.4972,
  "date": "2026-11-08",
  "room": "Fog & Night",
  "image": "img/mt-adams-steps.webp",
  "alt": "Describe the photo for screen readers",
  "excerpt": "First lines of the caption…",
  "story": "story.html?id=mt-adams-steps",
  "printUrl": "print.html?id=mt-adams-steps",
  "price": "$55",
  "badge": "New",
  "instagram": "https://www.instagram.com/p/…/"
}
```

When the file is deployed, these all update on their own:

- a new pin on the map (the newest one pulses)
- the timeline gains a step, and "Watch it grow" replays the posts in date order
- the dotted route extends
- the neighborhood checklist ticks off the post's `neighborhood`
- the home page's "Fresh off the feed", map preview, room counts and stats
- the collection, story and print pages

Notes:

- `neighborhood` counts toward the checklist only if it exactly matches a name in the `neighborhoods` list. Anything else (e.g. `"Covington, KY"`, `"Day trip"`) still shows on the map as "beyond the city line". Check the list against the city's official one before launch.
- Leave `lat`/`lng` as `null` to keep a spot private. The post is listed as "Location to come" without a pin.
- Posts more than 40 km from downtown count as day trips: they're pinned, but the opening map view and the route stay on Cincinnati.
- Get coordinates by right-clicking the spot in Google Maps and copying the numbers.
- **Dates, coordinates and captions in the current file are sample values.**

### Making it automatic

The site can already rebuild itself from `posts.json`. Writing to that file automatically when an Instagram post goes up is the next step. The Studio's "Publish story" button would do it, or a small Vercel function using the Instagram Graph API that commits the new entry to this repo. The Graph API doesn't return a post's location, so a geotag step in Studio is still needed.

## Map tiles

The map uses Leaflet (bundled in `vendor/leaflet`, BSD-2) with CARTO's light basemap, toned to the site palette in `theme.css`. CARTO's free tiles are for non-commercial use, so for a store that sells prints, get a CARTO, MapTiler or Stadia key before launch. Only the `TILES` URL in `js/map.js` needs to change.

## Files

- `theme.css` — design system (colors, type, header/footer, buttons, map pins)
- `js/site.js` — menu, header, data loading and home-page fill-ins
- `js/map.js` — the living map and the home-page preview
- `dc.js` + `site.css` — tiny template runtime and legacy styles (used by `collection.html` / `studio.html`)

## Build

Vercel runs `npm run build` (`scripts/build.mjs`) and serves `dist/`. The build:

- copies the site into `dist/`
- generates `stories/<id>.html` and `prints/<id>.html` for every post, each with its own title, description and Open Graph/Twitter tags, so shared links preview with the right photo
- writes `sitemap.xml` and `robots.txt`

For local testing:

```bash
npm install && npm run build && cd dist && python3 -m http.server
```

Set `SITE_URL` to change the absolute origin used in share tags (it defaults to the Vercel production URL).

## Photos

Put full-resolution originals in `photos/`, named like the web image they replace (e.g. `photos/roebling-fog.jpg` → `img/roebling-fog.webp`). The build makes 2000px, 1280px and 640px WebP versions and lists them in `data/image-sizes.json`. If there are no originals, it just copies `img/`.
