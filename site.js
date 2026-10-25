/* Artefactos — portada: mapa de relaciones + índice filtrable.
   Los datos viven en assets/js/artefactos.js (window.ARTEFACTOS). */

(function () {
  "use strict";

  var DATA = (window.ARTEFACTOS || []).slice().sort(function (a, b) {
    return (b.fecha || "").localeCompare(a.fecha || "");
  });

  // Color por categoría (variables definidas en site.css)
  var COLORS = {
    "quantil": "var(--c-quantil)",
    "académico": "var(--c-academico)",
    "academico": "var(--c-academico)",
    "personal": "var(--c-personal)",
    "herramientas": "var(--c-herramientas)"
  };
  function colorFor(cat) {
    return COLORS[(cat || "").toLowerCase()] || "var(--c-otro)";
  }

  function hrefFor(a) {
    return a.enlace || ("artefactos/" + a.slug + "/");
  }

  var MESES = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
  function fechaCorta(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    return MESES[parseInt(p[1], 10) - 1] + " " + p[0];
  }

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }

  var SVGNS = "http://www.w3.org/2000/svg";
  function sv(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  /* ---------- Mapa ---------- */

  var mapRoot = document.getElementById("mapa");
  var nodeEls = {};
  var edgeEls = [];
  var neighbors = {};

  function buildGraph(items) {
    var edges = [];
    for (var i = 0; i < items.length; i++) {
      for (var j = i + 1; j < items.length; j++) {
        var a = items[i].temas || [], b = items[j].temas || [];
        var shared = a.filter(function (t) { return b.indexOf(t) !== -1; }).length;
        if (shared > 0) edges.push({ s: i, t: j, w: shared });
      }
    }
    return edges;
  }

  // Disposición por fuerzas, calculada de una vez (sin animar la física)
  function layout(items, edges, W, H) {
    var n = items.length;
    var cats = [];
    items.forEach(function (it) { if (cats.indexOf(it.categoria) === -1) cats.push(it.categoria); });
    var anchors = {};
    cats.forEach(function (c, k) {
      var ang = (2 * Math.PI * k) / Math.max(cats.length, 1) - Math.PI / 2;
      var r = cats.length > 1 ? Math.min(W, H) * 0.24 : 0;
      anchors[c] = { x: W / 2 + Math.cos(ang) * r * 1.25, y: H / 2 + Math.sin(ang) * r };
    });

    var P = items.map(function (it, i) {
      var ang = (2 * Math.PI * i) / Math.max(n, 1);
      return { x: W / 2 + Math.cos(ang) * W * 0.3, y: H / 2 + Math.sin(ang) * H * 0.3, vx: 0, vy: 0, cat: it.categoria };
    });

    var L = Math.min(W, H) * 0.22;
    var ITER = 420;
    for (var it = 0; it < ITER; it++) {
      var alpha = 1 - it / ITER;
      for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
          var dx = P[j].x - P[i].x, dy = P[j].y - P[i].y;
          var d2 = dx * dx + dy * dy + 0.01;
          var d = Math.sqrt(d2);
          var f = (4200 / d2) * alpha;
          var fx = (dx / d) * f, fy = (dy / d) * f;
          P[i].vx -= fx; P[i].vy -= fy;
          P[j].vx += fx; P[j].vy += fy;
        }
      }
      edges.forEach(function (e) {
        var a = P[e.s], b = P[e.t];
        var dx = b.x - a.x, dy = b.y - a.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var f = (d - L) * 0.012 * Math.min(e.w, 3) * alpha;
        var fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      });
      P.forEach(function (p) {
        var an = anchors[p.cat];
        p.vx += (an.x - p.x) * 0.012 * alpha;
        p.vy += (an.y - p.y) * 0.012 * alpha;
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.6; p.vy *= 0.6;
        p.x = Math.max(28, Math.min(W - 28, p.x));
        p.y = Math.max(24, Math.min(H - 24, p.y));
      });
    }

    // Estira la nube para que ocupe el lienzo
    if (n === 1) { P[0].x = W / 2; P[0].y = H / 2; return P; }
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    P.forEach(function (p) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
    var padX = W < 500 ? 40 : 80, padY = 36;
    P.forEach(function (p) {
      p.x = maxX - minX > 1 ? padX + ((p.x - minX) / (maxX - minX)) * (W - 2 * padX) : W / 2;
      p.y = maxY - minY > 1 ? padY + ((p.y - minY) / (maxY - minY)) * (H - 2 * padY) : H / 2;
    });

    // Separa puntos demasiado cercanos
    var MIN = W < 500 ? 44 : 58;
    for (var k = 0; k < 60; k++) {
      for (var a = 0; a < n; a++) {
        for (var b = a + 1; b < n; b++) {
          var ddx = P[b].x - P[a].x, ddy = P[b].y - P[a].y;
          var dd = Math.sqrt(ddx * ddx + ddy * ddy) || 0.1;
          if (dd < MIN) {
            var push = (MIN - dd) / 2;
            P[a].x -= (ddx / dd) * push; P[a].y -= (ddy / dd) * push;
            P[b].x += (ddx / dd) * push; P[b].y += (ddy / dd) * push;
          }
        }
      }
    }
    return P;
  }

  // Ubica cada rótulo donde no choque con otros rótulos ni puntos
  function placeLabels(P, texts, W, H) {
    var boxes = [];
    var CH = 6.2; // ancho aproximado de un carácter a 13px
    // Cuenta choques: salirse del lienzo pesa más que tocar otro rótulo
    function hits(bx) {
      var c = 0;
      if (bx.x1 < 2 || bx.x2 > W - 2 || bx.y1 < 2 || bx.y2 > H - 2) c += 10;
      for (var i = 0; i < boxes.length; i++) {
        var o = boxes[i];
        if (bx.x1 < o.x2 && bx.x2 > o.x1 && bx.y1 < o.y2 && bx.y2 > o.y1) c += 2;
      }
      for (var j = 0; j < P.length; j++) {
        var q = P[j];
        if (q.x + 10 > bx.x1 && q.x - 10 < bx.x2 && q.y + 10 > bx.y1 && q.y - 10 < bx.y2) c += 3;
      }
      return c;
    }
    return P.map(function (p, i) {
      var w = texts[i].length * CH;
      var right = { x: p.x + 14, y: p.y + 4, a: "start", box: { x1: p.x + 13, x2: p.x + 15 + w, y1: p.y - 9, y2: p.y + 7 } };
      var left = { x: p.x - 14, y: p.y + 4, a: "end", box: { x1: p.x - 15 - w, x2: p.x - 13, y1: p.y - 9, y2: p.y + 7 } };
      var above = { x: p.x, y: p.y - 15, a: "middle", box: { x1: p.x - w / 2, x2: p.x + w / 2, y1: p.y - 28, y2: p.y - 12 } };
      var below = { x: p.x, y: p.y + 26, a: "middle", box: { x1: p.x - w / 2, x2: p.x + w / 2, y1: p.y + 13, y2: p.y + 29 } };
      var aboveL = { x: p.x + 6, y: p.y - 15, a: "end", box: { x1: p.x + 6 - w, x2: p.x + 6, y1: p.y - 28, y2: p.y - 12 } };
      var belowL = { x: p.x + 6, y: p.y + 26, a: "end", box: { x1: p.x + 6 - w, x2: p.x + 6, y1: p.y + 13, y2: p.y + 29 } };
      var aboveR = { x: p.x - 6, y: p.y - 15, a: "start", box: { x1: p.x - 6, x2: p.x - 6 + w, y1: p.y - 28, y2: p.y - 12 } };
      var belowR = { x: p.x - 6, y: p.y + 26, a: "start", box: { x1: p.x - 6, x2: p.x - 6 + w, y1: p.y + 13, y2: p.y + 29 } };
      var order = p.x < W * 0.6
        ? [right, left, above, below, aboveR, belowR, aboveL, belowL]
        : [left, right, above, below, aboveL, belowL, aboveR, belowR];
      var pick = order[0], best = Infinity;
      for (var k = 0; k < order.length; k++) {
        var score = hits(order[k].box);
        if (score < best) { best = score; pick = order[k]; }
        if (score === 0) break;
      }
      boxes.push(pick.box);
      return pick;
    });
  }

  function drawMap(items) {
    if (!mapRoot) return;
    var holder = mapRoot.querySelector(".map-canvas");
    holder.textContent = "";
    nodeEls = {}; edgeEls = []; neighbors = {};
    // Con menos de tres artefactos el mapa no dice nada todavía: se oculta
    var hero = mapRoot.closest(".hero");
    if (items.length < 3) {
      mapRoot.hidden = true;
      if (hero) hero.classList.add("is-solo");
      return;
    }
    mapRoot.hidden = false;
    if (hero) hero.classList.remove("is-solo");

    var W = Math.round(Math.max(300, Math.min(holder.clientWidth || 640, 720)));
    var H = W < 500 ? 380 : 440;
    var maxLen = W < 500 ? 22 : 30;
    var edges = buildGraph(items);
    var P = layout(items, edges, W, H);

    var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, role: "group", "aria-label": "Mapa de artefactos y los temas que comparten" });
    var gE = sv("g", { "aria-hidden": "true" });
    var gN = sv("g");
    svg.appendChild(gE);
    svg.appendChild(gN);

    edges.forEach(function (e, k) {
      var a = P[e.s], b = P[e.t];
      var len = Math.hypot(b.x - a.x, b.y - a.y);
      var line = sv("line", {
        "class": "edge",
        x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1),
        "stroke-width": (0.9 + 0.8 * (e.w - 1)).toFixed(2)
      });
      line.style.setProperty("--len", len.toFixed(1));
      line.style.setProperty("--i", k);
      gE.appendChild(line);
      var sa = items[e.s].slug, sb = items[e.t].slug;
      edgeEls.push({ el: line, a: sa, b: sb });
      (neighbors[sa] = neighbors[sa] || []).push(sb);
      (neighbors[sb] = neighbors[sb] || []).push(sa);
    });

    var texts = items.map(function (it) {
      return it.titulo.length > maxLen ? it.titulo.slice(0, maxLen - 2).trim() + "…" : it.titulo;
    });
    var spots = placeLabels(P, texts, W, H);

    items.forEach(function (it, i) {
      var p = P[i];
      var a = sv("a", { "class": "node", href: hrefFor(it), "data-slug": it.slug });
      a.style.setProperty("--c", colorFor(it.categoria));
      a.style.setProperty("--i", i);
      var c = sv("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 8.5 });
      var t = sv("title");
      t.textContent = it.titulo;
      var spot = spots[i];
      var label = sv("text", {
        x: spot.x.toFixed(1),
        y: spot.y.toFixed(1),
        "text-anchor": spot.a
      });
      label.textContent = texts[i];
      a.appendChild(t);
      a.appendChild(c);
      a.appendChild(label);
      a.addEventListener("mouseenter", function () { trace(it.slug); });
      a.addEventListener("mouseleave", function () { trace(null); });
      a.addEventListener("focus", function () { trace(it.slug); });
      a.addEventListener("blur", function () { trace(null); });
      gN.appendChild(a);
      nodeEls[it.slug] = a;
    });

    holder.appendChild(svg);
    mapRoot.classList.add("is-drawing");
  }

  // Resalta un artefacto, sus vecinos y su fila en el índice
  function trace(slug) {
    if (!mapRoot) return;
    var near = slug ? (neighbors[slug] || []) : [];
    mapRoot.classList.toggle("is-tracing", !!slug);
    Object.keys(nodeEls).forEach(function (s) {
      nodeEls[s].classList.toggle("on", s === slug);
      nodeEls[s].classList.toggle("near", near.indexOf(s) !== -1);
    });
    edgeEls.forEach(function (e) {
      e.el.classList.toggle("on", !!slug && (e.a === slug || e.b === slug));
    });
    document.querySelectorAll(".row").forEach(function (r) {
      r.classList.toggle("is-lit", r.getAttribute("data-slug") === slug);
    });
  }

  /* ---------- Índice ---------- */

  var listEl = document.getElementById("lista");
  var filtersEl = document.getElementById("filtros");
  var searchEl = document.getElementById("buscar");
  var state = { cat: null, q: "" };

  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function matches(a) {
    if (state.cat && a.categoria !== state.cat) return false;
    if (!state.q) return true;
    var hay = norm([a.titulo, a.descripcion, (a.temas || []).join(" "), a.categoria].join(" "));
    return hay.indexOf(norm(state.q)) !== -1;
  }

  function renderFilters() {
    if (!filtersEl) return;
    var cats = {};
    DATA.forEach(function (a) { cats[a.categoria] = (cats[a.categoria] || 0) + 1; });
    var opts = [{ label: "Todos", cat: null, n: DATA.length }].concat(
      Object.keys(cats).sort().map(function (c) { return { label: c, cat: c, n: cats[c] }; })
    );
    filtersEl.textContent = "";
    opts.forEach(function (o) {
      var b = el("button", { type: "button", "aria-pressed": String(state.cat === o.cat) });
      if (o.cat) {
        var sw = el("span", { "class": "swatch", "aria-hidden": "true" });
        sw.style.setProperty("--c", colorFor(o.cat));
        b.appendChild(sw);
      }
      b.appendChild(document.createTextNode(o.label + " "));
      b.appendChild(el("span", { "class": "count" }, String(o.n)));
      b.addEventListener("click", function () {
        state.cat = o.cat;
        renderFilters();
        renderList();
      });
      filtersEl.appendChild(b);
    });
  }

  function renderList() {
    if (!listEl) return;
    listEl.textContent = "";
    var shown = DATA.filter(matches);

    if (!DATA.length) {
      listEl.appendChild(el("li", { "class": "empty" }, "Todavía no hay artefactos. Agrega el primero en assets/js/artefactos.js."));
      return;
    }
    if (!shown.length) {
      var msg = state.q
        ? "Ningún artefacto coincide con «" + state.q + "». Prueba con otro término o elige Todos."
        : "No hay artefactos en esta categoría todavía.";
      listEl.appendChild(el("li", { "class": "empty" }, msg));
      return;
    }

    shown.forEach(function (a) {
      var li = el("li", { "class": "row", "data-slug": a.slug });
      li.style.setProperty("--c", colorFor(a.categoria));
      li.appendChild(el("span", { "class": "dot", "aria-hidden": "true" }));

      var main = el("div");
      var h = el("h3");
      var link = el("a", { href: hrefFor(a) }, a.titulo);
      if (a.enlace) { link.setAttribute("rel", "noopener"); }
      h.appendChild(link);
      main.appendChild(h);
      if (a.descripcion) main.appendChild(el("p", null, a.descripcion));
      if (a.temas && a.temas.length) main.appendChild(el("p", { "class": "topics" }, a.temas.join(", ")));
      li.appendChild(main);

      var meta = el("div", { "class": "meta" });
      meta.appendChild(el("div", null, a.categoria || ""));
      if (a.fecha) meta.appendChild(el("time", { datetime: a.fecha }, fechaCorta(a.fecha)));
      li.appendChild(meta);

      li.addEventListener("mouseenter", function () { trace(a.slug); });
      li.addEventListener("mouseleave", function () { trace(null); });
      link.addEventListener("focus", function () { trace(a.slug); });
      link.addEventListener("blur", function () { trace(null); });

      listEl.appendChild(li);
    });
  }

  if (searchEl) {
    searchEl.addEventListener("input", function () {
      state.q = searchEl.value.trim();
      renderList();
    });
  }

  drawMap(DATA);
  if (mapRoot) {
    var lastW = mapRoot.clientWidth, timer;
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (Math.abs(mapRoot.clientWidth - lastW) > 80) {
          lastW = mapRoot.clientWidth;
          mapRoot.classList.remove("is-drawing");
          drawMap(DATA);
        }
      }, 200);
    });
  }
  renderFilters();
  renderList();
})();
