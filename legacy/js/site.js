/* explore.cincinnati — shared site behaviour + the post data that drives the map and home page. */
(function () {
  var root = document.documentElement;

  function closestEl(e, sel) { var t = e.target.nodeType === 1 ? e.target : e.target.parentElement; return t && t.closest(sel); }

  /* ---------- Lights: day / night ---------- */
  function setTheme(theme, fromEl) {
    var apply = function () {
      root.setAttribute('data-theme', theme);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'night' ? '#12110E' : '#F3F0E8');
      document.querySelectorAll('.lights').forEach(function (b) {
        b.setAttribute('aria-pressed', theme === 'night' ? 'true' : 'false');
        b.setAttribute('aria-label', theme === 'night' ? 'Lights on: switch to day' : 'Lights off: switch to night');
      });
      document.dispatchEvent(new CustomEvent('ec:theme', { detail: { theme: theme } }));
    };
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fromEl && document.startViewTransition && !reduce) {
      var r = fromEl.getBoundingClientRect();
      root.style.setProperty('--lx', (r.left + r.width / 2) + 'px');
      root.style.setProperty('--ly', (r.top + r.height / 2) + 'px');
      root.classList.add('vt-lights');
      var vt = document.startViewTransition(apply);
      vt.finished.finally(function () { root.classList.remove('vt-lights'); });
    } else apply();
  }
  document.addEventListener('click', function (e) {
    var b = closestEl(e, '.lights'); if (!b) return;
    var next = root.getAttribute('data-theme') === 'night' ? 'day' : 'night';
    try { localStorage.setItem('ec-lights', next); } catch (err) {}
    root.setAttribute('data-theme-source', 'manual');
    setTheme(next, b);
  });
  document.addEventListener('DOMContentLoaded', function () { setTheme(root.getAttribute('data-theme') || 'day'); });
  /* If the sun sets (or rises) while the page is open and the visitor hasn't chosen, follow it. */
  setInterval(function () {
    if (root.getAttribute('data-theme-source') !== 'sun' || !window.__ecIsNight) return;
    var want = window.__ecIsNight(Date.now()) ? 'night' : 'day';
    if (want !== root.getAttribute('data-theme')) setTheme(want);
  }, 5 * 60 * 1000);

  /* ---------- The Index: the whole collection, catalogue-style ---------- */
  var indexEl = null, lastFocus = null;
  function buildIndex(data) {
    if (indexEl) return indexEl;
    var posts = data.posts.slice().reverse();
    indexEl = document.createElement('div');
    indexEl.id = 'index-panel'; indexEl.className = 'index';
    indexEl.setAttribute('role', 'dialog'); indexEl.setAttribute('aria-modal', 'true'); indexEl.setAttribute('aria-label', 'Index of works');
    indexEl.innerHTML =
      '<div class="wrap index-top"><a class="brand" href="index.html"><span class="brand-name">explore<span class="brand-sep">.</span>cincinnati</span></a>' +
        '<button type="button" class="index-close">Close <span aria-hidden="true">×</span></button></div>' +
      '<div class="wrap index-body">' +
        '<div class="index-list">' +
          '<div class="index-filters" role="group" aria-label="Filter by room">' +
            ['All'].concat(data.rooms).map(function (r, i) { return '<button type="button" data-room="' + esc(r) + '" aria-pressed="' + (i === 0) + '">' + esc(r) + '</button>'; }).join('') +
          '</div>' +
          '<ol class="index-works">' + posts.map(function (p, i) {
            return '<li class="index-work" style="--i:' + i + '" data-room="' + esc(p.room) + '"><a href="' + esc(p.story) + '" data-id="' + esc(p.id) + '">' +
              '<span class="num">' + pad(p.no) + '</span><span class="index-work-title">' + esc(p.title) + '</span>' +
              '<span class="index-work-meta">' + esc(p.place) + ' · ' + fmtDate(p.date, false) + '</span></a></li>';
          }).join('') + '</ol>' +
        '</div>' +
        '<figure class="index-preview" aria-hidden="true"><div class="index-preview-frame">' +
          posts.map(function (p) { return '<img data-id="' + esc(p.id) + '" src="' + esc(p.image) + '" alt="" loading="lazy" decoding="async">'; }).join('') +
        '</div><figcaption><span class="index-cap-title"></span><span class="index-cap-room"></span></figcaption></figure>' +
      '</div>' +
      '<div class="wrap index-foot"><nav class="index-sections" aria-label="Sections">' +
        '<a href="collection.html">Works</a><a href="map.html">The map</a><a href="collection.html#stories">Stories</a><a href="index.html#about">About</a>' +
        '<a href="https://www.instagram.com/explore.cincinnati/" target="_blank" rel="noopener">Instagram</a></nav>' +
        '<span class="meta">' + posts.length + ' works · ' + Object.keys(explored(data)).length + ' of ' + data.neighborhoods.length + ' neighborhoods · updated ' + (posts[0] ? fmtDate(posts[0].date) : '') + '</span></div>';
    document.body.appendChild(indexEl);

    var imgs = indexEl.querySelectorAll('.index-preview img');
    var capT = indexEl.querySelector('.index-cap-title'), capR = indexEl.querySelector('.index-cap-room');
    function show(id) {
      imgs.forEach(function (im) { im.classList.toggle('is-on', im.getAttribute('data-id') === id); });
      var p = posts.filter(function (x) { return x.id === id; })[0];
      if (p) { capT.textContent = 'No. ' + pad(p.no) + ' — ' + p.place; capR.textContent = p.room; }
      indexEl.querySelectorAll('.index-work a').forEach(function (a) { a.classList.toggle('is-hot', a.getAttribute('data-id') === id); });
    }
    if (posts[0]) show(posts[0].id);
    indexEl.addEventListener('mouseover', function (e) { var a = closestEl(e, '.index-work a'); if (a) show(a.getAttribute('data-id')); });
    indexEl.addEventListener('focusin', function (e) { var a = closestEl(e, '.index-work a'); if (a) show(a.getAttribute('data-id')); });
    indexEl.querySelector('.index-filters').addEventListener('click', function (e) {
      var b = closestEl(e, '[data-room]'); if (!b) return;
      var room = b.getAttribute('data-room');
      indexEl.querySelectorAll('.index-filters button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var first = null;
      indexEl.querySelectorAll('.index-work').forEach(function (li) {
        var on = room === 'All' || li.getAttribute('data-room') === room;
        li.hidden = !on; if (on && !first) first = li;
      });
      if (first) show(first.querySelector('a').getAttribute('data-id'));
    });
    indexEl.querySelector('.index-close').addEventListener('click', function () { setIndex(false); });
    indexEl.addEventListener('click', function (e) { if (closestEl(e, 'a[href]')) setIndex(false, true); });
    return indexEl;
  }
  function setIndex(open, navigating) {
    var toggles = document.querySelectorAll('.index-toggle');
    if (open) {
      loadPosts().then(function (d) {
        buildIndex(d);
        lastFocus = document.activeElement;
        requestAnimationFrame(function () {
          root.classList.add('index-open');
          toggles.forEach(function (t) { t.setAttribute('aria-expanded', 'true'); });
          setTimeout(function () { var c = indexEl.querySelector('.index-close'); if (c) c.focus(); }, 60);
        });
      });
    } else {
      root.classList.remove('index-open');
      toggles.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
      if (!navigating && lastFocus && lastFocus.focus) lastFocus.focus();
    }
  }
  document.addEventListener('click', function (e) { if (closestEl(e, '.index-toggle')) setIndex(!root.classList.contains('index-open')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('index-open')) setIndex(false);
    if (e.key === 'Tab' && root.classList.contains('index-open') && indexEl) {
      var f = indexEl.querySelectorAll('a[href], button:not([disabled])');
      var vis = Array.prototype.filter.call(f, function (x) { return x.offsetParent !== null; });
      if (!vis.length) return;
      var first = vis[0], last = vis[vis.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('DOMContentLoaded', function () {
    loadPosts().then(function (d) {
      document.querySelectorAll('.index-count').forEach(function (el) { el.textContent = pad(d.posts.length); });
    }).catch(function () {});
  });

  /* ---------- The tapped photograph carries over to the next page ---------- */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = closestEl(e, 'a[href]');
    if (!a || a.target === '_blank') return;
    var img = a.querySelector('img');
    if (!img) return;
    document.querySelectorAll('.vt-photo').forEach(function (x) { x.classList.remove('vt-photo'); });
    img.classList.add('vt-photo');
  }, true);
  window.addEventListener('pageshow', function () { document.querySelectorAll('a .vt-photo').forEach(function (x) { x.classList.remove('vt-photo'); }); });

  /* ---------- Header hairline once the page scrolls ---------- */
  function onScroll() {
    var h = document.querySelector('.site-header');
    if (h) h.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('DOMContentLoaded', onScroll);

  /* ---------- Data ---------- */
  /* Point-in-polygon (ray casting) over GeoJSON [lng, lat] rings. */
  function inRings(x, y, rings) {
    var inside = false;
    for (var r = 0; r < rings.length; r++) {
      var ring = rings[r];
      for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
      }
    }
    return inside;
  }
  function hoodAt(geo, lat, lng) {
    for (var i = 0; i < geo.features.length; i++) {
      var g = geo.features[i].geometry;
      var polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
      for (var k = 0; k < polys.length; k++) if (inRings(lng, lat, polys[k])) return geo.features[i].properties.name;
    }
    return null;
  }

  var cache = null;
  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });
  }
  /* Posts + neighborhood outlines. Inside the city a post's neighborhood comes from its coordinates;
     the hand-entered `neighborhood` is only used outside the city (e.g. "Covington, KY"). */
  function loadPosts() {
    if (!cache) {
      var base = document.documentElement.getAttribute('data-root') || '';
      cache = Promise.all([
        getJSON(base + 'data/posts.json'),
        getJSON(base + 'data/neighborhoods.geojson').catch(function () { return null; })
      ]).then(function (res) {
        var d = res[0], geo = res[1];
        d.geo = geo;
        if (geo) d.neighborhoods = geo.features.map(function (f) { return f.properties.name; }).sort();
        else d.neighborhoods = d.neighborhoods || [];
        d.posts.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.no - b.no; });
        d.posts.forEach(function (p) {
          p.pinned = typeof p.lat === 'number' && typeof p.lng === 'number';
          var auto = geo && p.pinned ? hoodAt(geo, p.lat, p.lng) : null;
          if (auto) p.neighborhood = auto;
          p.inCity = !!auto;
        });
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
