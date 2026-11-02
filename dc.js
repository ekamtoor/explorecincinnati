/* Tiny runtime: renders the design templates ({{path}}, <sc-for>, <sc-if>, onClick handlers) in the browser. */
(function () {
  var RE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var ONLY = /^\{\{\s*([^}]+?)\s*\}\}$/;

  function get(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path !== '' && !isNaN(Number(path))) return Number(path);
    var v = scope, parts = path.split('.');
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function interp(str, scope) {
    var m = str.match(ONLY);
    if (m) return get(scope, m[1]);
    return str.replace(RE, function (_, p) { var v = get(scope, p); return v == null ? '' : String(v); });
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function renderInto(node, scope, parent) {
    if (node.nodeType === 3) {
      var txt = node.nodeValue;
      if (txt.indexOf('{{') !== -1) { var v = interp(txt, scope); txt = v == null ? '' : String(v); }
      parent.appendChild(document.createTextNode(txt));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') {
      var list = interp(node.getAttribute('list') || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var s = Object.assign({}, scope); s[as] = list[i]; s.$index = i;
        for (var c = 0; c < node.childNodes.length; c++) renderInto(node.childNodes[c], s, parent);
      }
      return;
    }
    if (tag === 'sc-if') {
      if (interp(node.getAttribute('value') || '', scope)) {
        for (var k = 0; k < node.childNodes.length; k++) renderInto(node.childNodes[k], scope, parent);
      }
      return;
    }
    // SVG children must be created in the SVG namespace or the browser renders nothing.
    var inSvg = tag === 'svg' || (parent.namespaceURI === SVG_NS);
    var el = inSvg ? document.createElementNS(SVG_NS, node.tagName) : document.createElement(tag);
    el.__h = {};
    for (var a = 0; a < node.attributes.length; a++) {
      var at = node.attributes[a], n = at.name;
      if (n.indexOf('hint-') === 0) continue;
      if (n.indexOf('on') === 0 && n.length > 2) {
        var fn = interp(at.value, scope);
        if (typeof fn === 'function') { el.__h[n.slice(2)] = fn; el.addEventListener(n.slice(2), fn); }
        continue;
      }
      if (n === 'ref') { var rf = interp(at.value, scope); if (typeof rf === 'function') { el.__ref = rf; rf(el); } continue; }
      var val = at.value.indexOf('{{') !== -1 ? interp(at.value, scope) : at.value;
      el.setAttribute(n, val == null ? '' : String(val));
    }
    for (var j = 0; j < node.childNodes.length; j++) renderInto(node.childNodes[j], scope, el);
    parent.appendChild(el);
  }

  function morph(oldN, newN) {
    if (oldN.nodeType !== newN.nodeType || (oldN.nodeType === 1 && oldN.tagName !== newN.tagName)) { oldN.replaceWith(newN); return; }
    if (oldN.nodeType === 3) { if (oldN.nodeValue !== newN.nodeValue) oldN.nodeValue = newN.nodeValue; return; }
    if (oldN.nodeType !== 1) return;
    var i;
    for (i = oldN.attributes.length - 1; i >= 0; i--) { var nm = oldN.attributes[i].name; if (!newN.hasAttribute(nm)) oldN.removeAttribute(nm); }
    for (i = 0; i < newN.attributes.length; i++) { var a = newN.attributes[i]; if (oldN.getAttribute(a.name) !== a.value) oldN.setAttribute(a.name, a.value); }
    var oh = oldN.__h || {}, nh = newN.__h || {};
    for (var ev in oh) { oldN.removeEventListener(ev, oh[ev]); }
    for (var ev2 in nh) { oldN.addEventListener(ev2, nh[ev2]); }
    oldN.__h = nh;
    if (newN.__ref) newN.__ref(oldN);
    morphChildren(oldN, newN);
  }
  function morphChildren(oldP, newP) {
    var oc = oldP.childNodes, nc = newP.childNodes;
    var same = oc.length === nc.length;
    if (same) for (var i = 0; i < oc.length; i++) { if (oc[i].nodeType !== nc[i].nodeType || (oc[i].nodeType === 1 && oc[i].tagName !== nc[i].tagName)) { same = false; break; } }
    if (!same) { oldP.replaceChildren.apply(oldP, Array.prototype.slice.call(nc)); return; }
    var pairs = [];
    for (var j = 0; j < oc.length; j++) pairs.push([oc[j], nc[j]]);
    for (var k = 0; k < pairs.length; k++) morph(pairs[k][0], pairs[k][1]);
  }

  var DC = { _rerender: function () {} };
  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (p) {
    this.state = Object.assign({}, this.state, typeof p === 'function' ? p(this.state) : p);
    DC._rerender();
  };
  DCLogic.prototype.forceUpdate = function () { DC._rerender(); };
  window.DCLogic = DCLogic;

  DC.mount = function (Comp) {
    var tpl = document.getElementById('tpl').content;
    var app = document.getElementById('app');
    var inst = new Comp({});
    function draw() {
      var scope = inst.renderVals() || {};
      var frag = document.createElement('div');
      for (var i = 0; i < tpl.childNodes.length; i++) renderInto(tpl.childNodes[i], scope, frag);
      if (!app.firstChild) app.replaceChildren.apply(app, Array.prototype.slice.call(frag.childNodes));
      else morphChildren(app, frag);
    }
    DC._rerender = draw;
    draw();
    if (inst.componentDidMount) inst.componentDidMount();
  };
  window.DC = DC;

  // Mobile menu: state lives on <html> (outside #app) so template re-renders don't reset it.
  var root = document.documentElement;
  function setMenu(open) {
    root.classList.toggle('nav-open', open);
    var b = document.querySelector('.menu-toggle');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    if (t.closest('.menu-toggle')) { setMenu(!root.classList.contains('nav-open')); return; }
    if (root.classList.contains('nav-open') && (t.closest('nav[aria-label="Primary"] a') || !t.closest('header'))) setMenu(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
})();
