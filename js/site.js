/* explore.cincinnati — shared site behaviour + the post data that drives the map and home page. */
(function () {
  var root = document.documentElement;

  /* ---------- Mobile menu (state on <html>, outside any re-rendered template) ---------- */
  function setMenu(open) {
    root.classList.toggle('nav-open', open);
    var b = document.querySelector('.menu-toggle');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.nodeType === 1 ? e.target : e.target.parentElement;
    if (!t) return;
    if (t.closest('.menu-toggle')) { setMenu(!root.classList.contains('nav-open')); return; }
    if (root.classList.contains('nav-open') && t.closest('#primary-nav a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 760) setMenu(false); });

  /* ---------- Header hairline once the page scrolls ---------- */
  function onScroll() {
    var h = document.querySelector('.site-header');
    if (h) h.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('DOMContentLoaded', onScroll);

  /* ---------- Data ---------- */
  var cache = null;
  function loadPosts() {
    if (!cache) {
      cache = fetch('data/posts.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('posts.json ' + r.status); return r.json(); })
        .then(function (d) {
          d.posts.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.no - b.no; });
          d.posts.forEach(function (p) { p.pinned = typeof p.lat === 'number' && typeof p.lng === 'number'; });
          return d;
        });
    }
    return cache;
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso, withYear) {
    var p = iso.split('-');
    return MONTHS[+p[1] - 1] + ' ' + (+p[2]) + (withYear === false ? '' : ', ' + p[0]);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* Neighborhoods counted toward "explored": only names on the city list. */
  function explored(data, posts) {
    var set = {};
    var list = data.neighborhoods;
    (posts || data.posts).forEach(function (p) { if (p.neighborhood && list.indexOf(p.neighborhood) !== -1) set[p.neighborhood] = (set[p.neighborhood] || 0) + 1; });
    return set;
  }

  var ARROW = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  window.EC = { loadPosts: loadPosts, fmtDate: fmtDate, pad: pad, esc: esc, explored: explored, ARROW: ARROW };

  /* ---------- Home: anything marked data-* is filled from posts.json ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var latest = document.querySelector('[data-latest]');
    var needsData = latest || document.querySelector('[data-stat], [data-room-count]');
    if (!needsData) return;
    loadPosts().then(function (data) {
      var posts = data.posts;
      var newest = posts.slice().reverse();
      var ex = explored(data);
      var stats = {
        posts: posts.length,
        pinned: posts.filter(function (p) { return p.pinned; }).length,
        neighborhoods: Object.keys(ex).length,
        'neighborhoods-total': data.neighborhoods.length,
        latest: newest[0] ? newest[0].place : '',
        'latest-date': newest[0] ? fmtDate(newest[0].date) : ''
      };
      document.querySelectorAll('[data-stat]').forEach(function (el) {
        var k = el.getAttribute('data-stat'); if (k in stats) el.textContent = stats[k];
      });
      document.querySelectorAll('[data-room-count]').forEach(function (el) {
        var room = el.getAttribute('data-room-count');
        var n = posts.filter(function (p) { return p.room === room; }).length;
        el.textContent = n + (n === 1 ? ' work' : ' works');
      });
      if (latest) {
        var n = +latest.getAttribute('data-latest') || 3;
        latest.innerHTML = newest.slice(0, n).map(function (p, i) {
          return '<a class="lately-item reveal" href="' + esc(p.story) + '">' +
            '<span class="plate-frame ratio-45">' +
              '<img src="' + esc(p.image) + '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async">' +
              (i === 0 ? '<span class="badge lately-badge"><span class="dot"></span>Latest</span>' : '') +
            '</span>' +
            '<span class="plate-cap"><span class="num">No. ' + pad(p.no) + '</span>' +
              '<span class="h3">' + esc(p.title) + '</span>' +
              '<span class="meta">' + esc(p.place) + ' · ' + fmtDate(p.date) + '</span></span>' +
          '</a>';
        }).join('');
      }
    }).catch(function (err) { console.warn('[explore.cincinnati] could not load posts', err); });
  });
})();
