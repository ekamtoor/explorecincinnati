// Build: copy the static site into dist/, generate a page per story and print (with share
// previews), a sitemap, and — when originals are present in photos/ — sharp, sized images.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const EXCLUDE = new Set(['.git', '.github', 'node_modules', 'dist', 'scripts', 'photos', 'package.json', 'package-lock.json', 'README.md', '.gitignore', '.vercel', 'vercel.json']);

const ORIGIN = (process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://explorecincinnati.vercel.app')
).replace(/\/+$/, '');
const abs = (p) => `${ORIGIN}/${String(p).replace(/^\/+/, '')}`;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const pad = (n) => (n < 10 ? '0' : '') + n;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return `${MONTHS[+m - 1]} ${+d}, ${y}`; };

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  for (const ent of await fs.readdir(src, { withFileTypes: true })) {
    if (src === ROOT && EXCLUDE.has(ent.name)) continue;
    const s = path.join(src, ent.name), d = path.join(dst, ent.name);
    if (ent.isDirectory()) await copyDir(s, d);
    else if (ent.isFile()) await fs.copyFile(s, d);
  }
}

/* <head> injection: <base> first, then meta/OG, then the post id before the page's own scripts. */
function setHead(html, { base, title, description, og, postId }) {
  let out = html;
  if (title) out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  if (description) {
    if (/<meta name="description"[^>]*>/.test(out)) out = out.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}">`);
    else out = out.replace(/<\/title>/, `</title>\n<meta name="description" content="${esc(description)}">`);
  }
  const tags = [];
  if (og) {
    tags.push(
      `<link rel="canonical" href="${esc(og.url)}">`,
      `<meta property="og:site_name" content="explore.cincinnati">`,
      `<meta property="og:type" content="${esc(og.type)}">`,
      `<meta property="og:title" content="${esc(og.title)}">`,
      `<meta property="og:description" content="${esc(og.description)}">`,
      `<meta property="og:url" content="${esc(og.url)}">`,
      `<meta property="og:image" content="${esc(og.image)}">`,
      og.imageAlt ? `<meta property="og:image:alt" content="${esc(og.imageAlt)}">` : '',
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${esc(og.title)}">`,
      `<meta name="twitter:description" content="${esc(og.description)}">`,
      `<meta name="twitter:image" content="${esc(og.image)}">`
    );
  }
  if (postId) tags.push(`<script>window.EC_POST_ID=${JSON.stringify(postId)}</script>`);
  const block = tags.filter(Boolean).join('\n');
  // Before the first <script> or stylesheet in head, so the id exists when page scripts run.
  const headEnd = out.indexOf('</head>');
  const firstScript = out.slice(0, headEnd).search(/<script[\s>]/);
  const at = firstScript >= 0 ? firstScript : headEnd;
  out = out.slice(0, at) + block + '\n' + out.slice(at);
  if (base) out = out.replace(/<head>/, `<head>\n<base href="${base}">`);
  return out;
}

/* Replace the static fallback (Roebling) in a data-f element's text, and data-f images. */
function fillField(html, key, text) {
  const re = new RegExp(`(<([a-z0-9]+)([^>]*\\sdata-f="${key}"[^>]*)>)([^<]*)(</\\2>)`, 'g');
  return html.replace(re, (m, open, tag, attrs, _old, close) => open + esc(text) + close);
}
function fillImages(html, src, alt) {
  return html.replace(/<img([^>]*\sdata-f="image"[^>]*)>/g, (m, attrs) => {
    let a = attrs.replace(/\ssrc="[^"]*"/, ` src="${esc(src)}"`);
    if (/\salt="[^"]+"/.test(a)) a = a.replace(/\salt="[^"]*"/, ` alt="${esc(alt)}"`);
    return `<img${a}>`;
  });
}

async function buildImages(posts) {
  const manifest = {};
  const photosDir = path.join(ROOT, 'photos');
  let originals = [];
  try { originals = (await fs.readdir(photosDir)).filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f)); } catch { /* no photos/ */ }
  if (originals.length) {
    let sharp;
    try { sharp = (await import('sharp')).default; }
    catch (e) { console.warn('[build] photos/ present but sharp could not load — copying img/ as is.', e.message); return manifest; }
    const imgDir = path.join(ROOT, 'img');
    const existing = new Set(await fs.readdir(imgDir));
    for (const file of originals) {
      const baseName = file.replace(/\.[^.]+$/, '');
      if (!existing.has(`${baseName}.webp`)) { console.warn(`[build] photos/${file}: no img/${baseName}.webp to replace — skipped`); continue; }
      const src = path.join(photosDir, file);
      const meta = await sharp(src).metadata();
      const long = Math.max(meta.width || 0, meta.height || 0);
      const sizes = [];
      for (const w of [640, 1280, 2000]) {
        if (w !== 2000 && long <= w) continue;
        const target = Math.min(w, long);
        const out = path.join(DIST, 'img', w === 2000 ? `${baseName}.webp` : `${baseName}-${w}.webp`);
        await sharp(src).rotate().resize({ width: target, height: target, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
        sizes.push(target);
      }
      manifest[`img/${baseName}.webp`] = sizes.sort((a, b) => a - b);
      console.log(`[build] img/${baseName}.webp ← photos/${file} (${sizes.join(', ')})`);
    }
  }
  return manifest;
}

async function main() {
  await fs.rm(DIST, { recursive: true, force: true });
  await copyDir(ROOT, DIST);

  const data = JSON.parse(await fs.readFile(path.join(ROOT, 'data/posts.json'), 'utf8'));
  const posts = data.posts;

  const manifest = await buildImages(posts);
  await fs.mkdir(path.join(DIST, 'data'), { recursive: true });
  await fs.writeFile(path.join(DIST, 'data/image-sizes.json'), JSON.stringify(manifest, null, 2) + '\n');

  const storyTpl = await fs.readFile(path.join(ROOT, 'story.html'), 'utf8');
  const printTpl = await fs.readFile(path.join(ROOT, 'print.html'), 'utf8');
  await fs.mkdir(path.join(DIST, 'stories'), { recursive: true });
  await fs.mkdir(path.join(DIST, 'prints'), { recursive: true });

  for (const p of posts) {
    const printTitle = p.print || p.title;
    const desc = strip(p.excerpt).replace(/^\[|\]$/g, '') || `${p.title} — ${p.place}`;

    // Story page
    let s = setHead(storyTpl, {
      base: '/', postId: p.id,
      title: `${p.title} — explore.cincinnati`,
      description: `${p.place}. ${desc}`.slice(0, 300),
      og: { type: 'article', title: p.title, description: `${p.place} · ${desc}`.slice(0, 300), url: abs(`stories/${p.id}`), image: abs(p.image), imageAlt: p.alt }
    });
    s = fillField(s, 'title', p.title);
    s = fillField(s, 'no', `No. ${pad(p.no)}`);
    s = fillField(s, 'place', p.place);
    s = fillField(s, 'date', fmtDate(p.date));
    s = fillField(s, 'room', p.room);
    s = fillField(s, 'excerpt', p.excerpt);
    s = fillField(s, 'print', printTitle);
    if (p.price) s = fillField(s, 'price', p.price);
    s = fillImages(s, p.image, p.alt);
    await fs.writeFile(path.join(DIST, 'stories', `${p.id}.html`), s);

    // Print page
    const pdesc = `${printTitle} — archival pigment print${p.price ? ` · from ${p.price}` : ''}. Signed and numbered, printed in Cincinnati.`;
    let r = setHead(printTpl, {
      base: '/', postId: p.id,
      title: `${printTitle} — Print · explore.cincinnati`,
      description: pdesc,
      og: { type: 'product', title: `${printTitle} — Archival pigment print`, description: pdesc, url: abs(`prints/${p.id}`), image: abs(p.image), imageAlt: p.alt }
    });
    r = r.replace(/(<h1[^>]*id="print-title"[^>]*>)[\s\S]*?(<\/h1>)/, (m, a, b) => {
      const mm = printTitle.match(/^(.*?,)\s*(.+)$/);
      return a + (mm ? `${esc(mm[1])} <em>${esc(mm[2])}</em>` : esc(printTitle)) + b;
    });
    r = r.replace(/(<img[^>]*id="art-img")([^>]*)>/, (m, a, rest) => a + rest.replace(/\ssrc="[^"]*"/, ` src="${esc(p.image)}"`).replace(/\salt="[^"]*"/, ` alt="${esc(p.alt)}"`) + '>');
    r = r.replace(/<link rel="preload" as="image" href="[^"]*"/, `<link rel="preload" as="image" href="${esc(p.image)}"`);
    await fs.writeFile(path.join(DIST, 'prints', `${p.id}.html`), r);
  }

  // Share tags for the main pages (dist copies only)
  const latest = posts[posts.length - 1];
  const pages = [
    ['index.html', '', 'website', 'explore.cincinnati — Cincinnati, on view', 'Photographs, fine-art prints and the stories behind them — and a map of Cincinnati that grows with every post.', 'img/skyline-fog.webp'],
    ['collection.html', 'collection', 'website', 'The collection — explore.cincinnati', 'Archival prints of Cincinnati, signed and numbered, and the stories behind each photograph.', latest ? latest.image : 'img/skyline-fog.webp'],
    ['map.html', 'map', 'website', 'The living map — explore.cincinnati', 'Every place explore.cincinnati has photographed, pinned on a map of Cincinnati that grows with every post.', 'img/bellevue-hill.webp']
  ];
  for (const [file, route, type, title, description, image] of pages) {
    const fp = path.join(DIST, file);
    let html;
    try { html = await fs.readFile(fp, 'utf8'); } catch { continue; }
    if (html.includes('property="og:title"')) continue;
    html = setHead(html, { og: { type, title, description, url: abs(route), image: abs(image) } });
    await fs.writeFile(fp, html);
  }

  // Sitemap + robots
  const today = new Date().toISOString().slice(0, 10);
  const urls = [['', today], ['collection', today], ['map', today]]
    .concat(posts.flatMap((p) => [[`stories/${p.id}`, p.date], [`prints/${p.id}`, p.date]]));
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map(([u, d]) => `  <url><loc>${esc(abs(u))}</loc><lastmod>${d}</lastmod></url>`).join('\n')
    + '\n</urlset>\n';
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap);
  await fs.writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nDisallow: /studio\nSitemap: ${abs('sitemap.xml')}\n`);

  console.log(`[build] dist/ ready — ${posts.length} stories, ${posts.length} prints, origin ${ORIGIN}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
