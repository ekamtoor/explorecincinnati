/* explore.cincinnati — the living map.
   Reads data/posts.json (via EC.loadPosts) and draws one pin per post. Adding a post to that file is all it
   takes for the map, the timeline, the route and the neighborhood checklist to grow. */
(function () {
  var CENTER = [39.115, -84.515];          // downtown / the basin
  var LOCAL_KM = 40;                        // further than this = a day trip, not part of the city view
  var TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  function km(a, b) {
    var R = 6371, toR = Math.PI / 180;
    var dLat = (b[0] - a[0]) * toR, dLng = (b[1] - a[1]) * toR;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function isLocal(p) { return p.pinned && km(CENTER, [p.lat, p.lng]) < LOCAL_KM; }

  function baseMap(el, opts) {
    var map = L.map(el, Object.assign({ zoomControl: false, attributionControl: true, minZoom: 9, maxZoom: 18 }, opts));
    L.tileLayer(TILES, { subdomains: 'abcd', maxZoom: 19, attribution: ATTR, detectRetina: true }).addTo(map);
    map.attributionControl.setPrefix(false);
    return map;
  }
  function pinIcon(p) {
    return L.divIcon({
      className: 'pin-wrap', iconSize: [30, 30], iconAnchor: [15, 15],
      html: '<span class="pin" data-id="' + EC.esc(p.id) + '"><span class="pin-dot"></span><span class="pin-label">No. ' + EC.pad(p.no) + '</span></span>'
    });
  }
  function pinEl(marker) { var e = marker.getElement(); return e && e.querySelector('.pin'); }
  function fitLocal(map, posts, pad) {
    var pts = posts.filter(isLocal).map(function (p) { return [p.lat, p.lng]; });
    if (pts.length > 1) map.fitBounds(pts, { padding: pad || [60, 60], maxZoom: 14 });
    else if (pts.length === 1) map.setView(pts[0], 14);
    else map.setView(CENTER, 12);
  }
  function directions(p) { return 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng; }

  /* Colors come from the theme (day / night), read at draw time. */
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  /* Neighborhood outlines, drawn in their own pane below the pins.
     Fill opacity is set as an inline style (not the SVG attribute) so the CSS transition animates it. */
  function hoodLayer(map, geo, interactive) {
    if (!map.getPane('hoods')) { map.createPane('hoods'); map.getPane('hoods').style.zIndex = 350; }
    var renderer = L.svg({ pane: 'hoods', padding: 0.5 });
    var byName = {};
    var layer = L.geoJSON(geo, {
      pane: 'hoods', renderer: renderer, interactive: !!interactive,
      style: function () { return { className: 'hood-shape', weight: 0.8, fillOpacity: 0, opacity: 0 }; },
      onEachFeature: function (f, l) { byName[f.properties.name] = l; }
    }).addTo(map);
    var last = null;
    map.whenReady(function () { setTimeout(function () { if (last) paint(last[0], last[1]); }, 0); });
    function paint(counts, selected) {
      last = [counts, selected];
      var amber = cssVar('--amber', '#D9822B'), ink = cssVar('--ink', '#161719');
      Object.keys(byName).forEach(function (name) {
        var l = byName[name], c = counts[name] || 0, sel = name === selected;
        l.setStyle({ color: c ? amber : ink, fillColor: amber, weight: sel ? 2.2 : (c ? 1.2 : 0.7) });
        var el = l.getElement && l.getElement();
        if (el) {
          el.style.fillOpacity = c ? String(Math.min(0.18 + (c - 1) * 0.08, 0.42)) : '0';
          el.style.strokeOpacity = sel ? '0.95' : (c ? '0.75' : '0.16');
          el.classList.toggle('is-explored', !!c);
        }
      });
    }
    return { layer: layer, byName: byName, paint: paint };
  }

  /* ---------------- Home: a quiet preview ---------------- */
  function miniMap(el) {
    EC.loadPosts().then(function (data) {
      var map = baseMap(el, { dragging: !L.Browser.mobile, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, tap: false });
      var pinned = data.posts.filter(function (p) { return p.pinned; });
      var latest = pinned[pinned.length - 1];
      var hoods = data.geo ? hoodLayer(map, data.geo, false) : null;
      var counts = EC.explored(data);
      if (hoods) hoods.paint(counts, null);
      pinned.forEach(function (p) {
        var m = L.marker([p.lat, p.lng], { icon: pinIcon(p), title: p.title, keyboard: false }).addTo(map);
        m.on('click', function () { location.href = 'map.html#' + p.id; });
        var e = pinEl(m); if (e && p === latest) e.classList.add('is-latest');
      });
      function fit() {
        var b = L.latLngBounds([]);
        if (hoods) Object.keys(counts).forEach(function (n) { if (hoods.byName[n]) b.extend(hoods.byName[n].getBounds()); });
        data.posts.filter(isLocal).forEach(function (p) { b.extend([p.lat, p.lng]); });
        if (b.isValid()) map.fitBounds(b.pad(0.15), { padding: [24, 24], maxZoom: 14 });
        else map.setView(CENTER, 12);
      }
      fit();
      if ('ResizeObserver' in window) {
        var t; new ResizeObserver(function () { clearTimeout(t); t = setTimeout(function () { map.invalidateSize(); fit(); }, 120); }).observe(el);
      }
      document.addEventListener('ec:theme', function () { if (hoods) hoods.paint(counts, null); });
    });
  }

  /* ---------------- Map page ---------------- */
  function fullMap() {
    var $ = function (s) { return document.querySelector(s); };
    var mapEl = $('#living-map');
    if (!mapEl) return;

    EC.loadPosts().then(function (data) {
      var posts = data.posts;                       // oldest → newest
      var state = { room: 'All', upto: posts.length - 1, selected: null, route: true, playing: null, hood: null };
      var map = baseMap(mapEl, { zoomControl: false, scrollWheelZoom: true, tap: true });
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      var markers = {};
      var shown = {};
      posts.forEach(function (p) {
        if (!p.pinned) return;
        var m = L.marker([p.lat, p.lng], { icon: pinIcon(p), title: p.title, riseOnHover: true });
        m.on('click', function () { select(p.id, { fly: false }); });
        markers[p.id] = m;
      });
      var route = L.polyline([], { color: cssVar('--ink', '#161719'), weight: 1.2, opacity: .55, dashArray: '2 6', lineCap: 'round', interactive: false }).addTo(map);

      /* Neighborhoods: fill in as posts land in them (follows the timeline and room filter). */
      var counts = {};
      var hoods = data.geo ? hoodLayer(map, data.geo, true) : null;
      if (hoods) {
        Object.keys(hoods.byName).forEach(function (name) {
          var l = hoods.byName[name];
          l.bindTooltip(function () {
            var c = counts[name] || 0;
            return '<b>' + EC.esc(name) + '</b> · <span>' + (c ? c + (c === 1 ? ' post' : ' posts') : 'Not yet explored') + '</span>';
          }, { sticky: true, direction: 'top', offset: [0, -10], className: 'hood-tip', opacity: 1 });
          l.on('click', function () {
            if (counts[name]) setHood(state.hood === name ? null : name, false);
            else l.openTooltip();
          });
        });
      }
      function setHood(name, fit) {
        state.hood = name;
        render();
        if (name && fit && hoods && hoods.byName[name]) map.fitBounds(hoods.byName[name].getBounds(), { padding: mapPad(), maxZoom: 15 });
      }
      $('#map-hood-filter').addEventListener('click', function (e) { if (e.target.closest('.hood-chip')) setHood(null); });
      document.addEventListener('ec:theme', function () {
        route.setStyle({ color: cssVar('--ink', '#161719') });
        if (hoods) hoods.paint(counts, state.hood);
      });

      /* Timeline */
      var range = $('#tl-range');
      range.max = String(posts.length - 1);
      range.value = String(state.upto);
      range.addEventListener('input', function () { stop(); state.upto = +range.value; render(); });
      $('#tl-play').addEventListener('click', function () { state.playing ? stop() : play(); });
      function play() {
        if (state.upto >= posts.length - 1) { state.upto = 0; }
        var btn = $('#tl-play'); btn.setAttribute('aria-pressed', 'true'); btn.querySelector('.tl-play-label').textContent = 'Pause';
        state.playing = setInterval(function () {
          if (state.upto >= posts.length - 1) { stop(); return; }
          state.upto++; range.value = String(state.upto); render(true);
        }, 900);
        render(true);
      }
      function stop() {
        if (!state.playing) return;
        clearInterval(state.playing); state.playing = null;
        var btn = $('#tl-play'); btn.setAttribute('aria-pressed', 'false'); btn.querySelector('.tl-play-label').textContent = 'Watch it grow';
      }

      /* Room filters */
      var rooms = ['All'].concat(data.rooms);
      var chips = $('#map-rooms');
      chips.innerHTML = rooms.map(function (r) {
        return '<button type="button" class="chip" data-room="' + EC.esc(r) + '" aria-pressed="' + (r === state.room) + '">' + EC.esc(r) + '</button>';
      }).join('');
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('[data-room]'); if (!b) return;
        state.room = b.getAttribute('data-room');
        chips.querySelectorAll('[data-room]').forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); });
        render(); fitLocal(map, visible(), mapPad());
      });

      $('#map-route').addEventListener('change', function (e) { state.route = e.target.checked; render(); });

      function visible() {
        return posts.slice(0, state.upto + 1).filter(function (p) { return state.room === 'All' || p.room === state.room; });
      }
      function mapPad() { return window.innerWidth > 900 ? [80, 80] : [36, 36]; }

      function render(animate) {
        var vis = visible();
        var visIds = {}; vis.forEach(function (p) { visIds[p.id] = true; });
        var pinnedVis = vis.filter(function (p) { return p.pinned; });
        var latest = pinnedVis[pinnedVis.length - 1];

        Object.keys(markers).forEach(function (id) {
          var m = markers[id];
          if (visIds[id] && !shown[id]) {
            m.addTo(map); shown[id] = true;
            var e = pinEl(m); if (e && animate) e.classList.add('is-new');
          } else if (!visIds[id] && shown[id]) { map.removeLayer(m); shown[id] = false; }
          var el = pinEl(m);
          if (el) { el.classList.toggle('is-latest', latest && id === latest.id); el.classList.toggle('is-active', id === state.selected); }
        });
        route.setLatLngs(state.route ? pinnedVis.filter(isLocal).map(function (p) { return [p.lat, p.lng]; }) : []);
        if (animate && latest && isLocal(latest) && !map.getBounds().pad(-0.1).contains([latest.lat, latest.lng])) map.panTo([latest.lat, latest.lng]);

        /* Stats */
        var ex = EC.explored(data, vis);
        var exN = Object.keys(ex).length;
        counts = ex;
        if (state.hood && !ex[state.hood]) state.hood = null;
        if (hoods) hoods.paint(ex, state.hood);
        $('#stat-posts').textContent = vis.length;
        $('#stat-hoods').textContent = exN;
        $('#stat-hoods-total').textContent = data.neighborhoods.length;
        $('#tl-date').textContent = 'As of ' + EC.fmtDate(posts[state.upto].date);
        $('#tl-count').textContent = 'Post ' + (state.upto + 1) + ' of ' + posts.length;
        $('#tl-fill').style.width = (posts.length > 1 ? state.upto / (posts.length - 1) * 100 : 100) + '%';

        /* List, newest first (optionally narrowed to one neighborhood) */
        var listed = state.hood ? vis.filter(function (p) { return p.neighborhood === state.hood; }) : vis;
        $('#map-hood-filter').innerHTML = state.hood
          ? '<button type="button" class="hood-chip" aria-label="Clear neighborhood filter: ' + EC.esc(state.hood) + '">Neighborhood: ' + EC.esc(state.hood) + ' <span aria-hidden="true">×</span></button>'
          : '';
        $('#map-list').innerHTML = listed.slice().reverse().map(function (p) {
          var tag = !p.pinned ? '<span class="tag">Location to come</span>' : (!isLocal(p) ? '<span class="tag">Day trip</span>' : '');
          return '<li><button type="button" class="post-row' + (p.id === state.selected ? ' is-active' : '') + '" data-id="' + EC.esc(p.id) + '">' +
            '<img src="' + EC.esc(p.image) + '" alt="" loading="lazy" decoding="async">' +
            '<span class="post-row-text"><span class="meta">No. ' + EC.pad(p.no) + ' · ' + EC.fmtDate(p.date) + '</span>' +
            '<span class="post-row-title">' + EC.esc(p.title) + '</span>' +
            '<span class="meta">' + EC.esc(p.place) + '</span>' + tag + '</span></button></li>';
        }).join('') || '<li class="meta" style="padding:16px 0">Nothing in this room yet — it’s coming.</li>';

        /* Neighborhood checklist */
        var allEx = EC.explored(data, vis);
        $('#hood-count').textContent = exN + ' of ' + data.neighborhoods.length;
        $('#hood-bar').style.width = (exN / data.neighborhoods.length * 100) + '%';
        $('#hood-grid').innerHTML = data.neighborhoods.map(function (n) {
          var c = allEx[n];
          if (!c) return '<li class="hood"><span>' + EC.esc(n) + '</span></li>';
          return '<li class="hood is-explored' + (n === state.hood ? ' is-filtered' : '') + '"><button type="button" class="hood-btn" data-hood="' + EC.esc(n) + '"><span>' + EC.esc(n) + '</span><span class="hood-n">' + c + '</span></button></li>';
        }).join('');
        var beyond = vis.filter(function (p) { return p.neighborhood && data.neighborhoods.indexOf(p.neighborhood) === -1; });
        $('#hood-beyond').textContent = beyond.length ? 'Also beyond the city line: ' + beyond.map(function (p) { return p.place; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' · ') : '';

        if (state.selected && !visIds[state.selected]) closeCard();
      }

      /* Selection card */
      var card = $('#map-card');
      function select(id, o) {
        var p = posts.filter(function (x) { return x.id === id; })[0];
        if (!p) return;
        state.selected = id;
        card.innerHTML =
          '<button type="button" class="card-close" aria-label="Close">×</button>' +
          '<div class="plate-frame ratio-32"><img src="' + EC.esc(p.image) + '" alt="' + EC.esc(p.alt) + '"></div>' +
          '<div class="card-body">' +
            '<p class="meta">No. ' + EC.pad(p.no) + ' · ' + EC.esc(p.room) + ' · ' + EC.fmtDate(p.date) + '</p>' +
            '<h3 class="card-title">' + EC.esc(p.title) + '</h3>' +
            '<p class="meta card-place">' + EC.esc(p.place) + (p.neighborhood && p.neighborhood !== p.place ? ' · ' + EC.esc(p.neighborhood) : '') + '</p>' +
            '<p class="card-excerpt">' + EC.esc(p.excerpt) + '</p>' +
            '<div class="card-actions">' +
              '<a class="btn" href="' + EC.esc(p.story) + '">Read the story</a>' +
              (p.pinned ? '<a class="btn btn--ghost" href="' + directions(p) + '" target="_blank" rel="noopener">Directions</a>' : '') +
            '</div>' +
            '<div class="card-links">' +
              (p.printUrl ? '<a class="link" href="' + EC.esc(p.printUrl) + '">Print · from ' + EC.esc(p.price) + '</a>' : '') +
              '<a class="link" href="' + EC.esc(p.instagram) + '" target="_blank" rel="noopener">On Instagram</a>' +
            '</div>' +
          '</div>';
        card.hidden = false;
        card.querySelector('.card-close').addEventListener('click', closeCard);
        if (p.pinned && (!o || o.fly !== false)) map.flyTo([p.lat, p.lng], isLocal(p) ? Math.max(map.getZoom(), 15) : 12, { duration: isLocal(p) ? 0.8 : 1.6 });
        else if (p.pinned) map.panTo([p.lat, p.lng]);
        history.replaceState(null, '', '#' + id);
        render();
        if (window.innerWidth <= 900 && o && o.scroll) mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      function closeCard() {
        card.hidden = true; state.selected = null; history.replaceState(null, '', location.pathname);
        Object.keys(markers).forEach(function (id) { var e = pinEl(markers[id]); if (e) e.classList.remove('is-active'); });
        document.querySelectorAll('.post-row.is-active').forEach(function (r) { r.classList.remove('is-active'); });
      }
      $('#map-list').addEventListener('click', function (e) {
        var b = e.target.closest('[data-id]'); if (b) select(b.getAttribute('data-id'), { scroll: true });
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !card.hidden) closeCard(); });
      $('#hood-grid').addEventListener('click', function (e) {
        var b = e.target.closest('[data-hood]'); if (!b) return;
        var name = b.getAttribute('data-hood');
        var view = document.querySelector('.mapview') || mapEl;
        view.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHood(name, true);
      });

      render();
      fitLocal(map, posts, mapPad());
      var h = decodeURIComponent(location.hash.slice(1));
      if (h) select(h, { fly: true });
      window.addEventListener('hashchange', function () { var id = location.hash.slice(1); if (id) select(id); });
    }).catch(function (err) {
      mapEl.innerHTML = '<p class="meta" style="padding:24px">The map couldn’t load its data (' + EC.esc(err.message) + ').</p>';
    });
  }

  window.EC = window.EC || {};
  window.EC.miniMap = miniMap;
  document.addEventListener('DOMContentLoaded', function () {
    fullMap();
    var mini = document.querySelector('[data-mini-map]');
    if (mini) {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); miniMap(mini); } }, { rootMargin: '300px' });
        io.observe(mini);
      } else miniMap(mini);
    }
  });
})();
