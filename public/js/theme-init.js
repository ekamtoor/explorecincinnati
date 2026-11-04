/* Runs before first paint: day or night, decided by the real sunset over Cincinnati
   (or by the visitor's own choice, if they have flipped the lights). Kept tiny and synchronous. */
(function () {
  var root = document.documentElement;
  function isNightInCincinnati(now) {
    var rad = Math.PI / 180, lat = 39.1031, lng = -84.512;
    var jd = now / 86400000 + 2440587.5;
    var n = Math.ceil(jd - 2451545.0 + 0.0008);
    var jStar = n - lng / 360;
    var M = (357.5291 + 0.98560028 * jStar) % 360;
    var C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    var lam = (M + C + 180 + 102.9372) % 360;
    var jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lam * rad);
    var dec = Math.asin(Math.sin(lam * rad) * Math.sin(23.4397 * rad));
    var cosW = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
    var w = Math.acos(Math.max(-1, Math.min(1, cosW))) / rad;
    var rise = jTransit - w / 360, set = jTransit + w / 360;
    return jd < rise || jd > set;
  }
  var stored = null;
  try { stored = localStorage.getItem('ec-lights'); } catch (e) {}
  var night = stored ? stored === 'night' : isNightInCincinnati(Date.now());
  root.setAttribute('data-theme', night ? 'night' : 'day');
  root.setAttribute('data-theme-source', stored ? 'manual' : 'sun');
  window.__ecIsNight = isNightInCincinnati;
})();
