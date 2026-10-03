/**
 * World-page gold Threads — intentionally asymmetric.
 * No mirrored pairs, no even spacing, no shared endpoints.
 */
(() => {
  const svg = document.querySelector(".world-threads");
  if (!svg) return;

  const mode = svg.getAttribute("data-thread-mode") || "calm";
  const isThirst = mode === "thirst";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const W = 1440;
  const H = 900;

  /*
   * Hand-placed, uneven on purpose.
   * f = wave frequency scale (so they don't pulse together)
   * storm = Thirst only on a slice of THAT thread
   */
  /* Same directions/curves — only length stretched to site edges. */
  const rawStrands = isThirst
    ? [
        { x0: 12, x1: 870, y0: 905, y1: 40, amp: 0.39, phase: 0.37, steps: 163, storm: [0.06, 0.27], curve: 0.21, f: 0.82 },
        { x0: 1410, x1: 505, y0: 820, y1: 155, amp: 0.51, phase: 2.11, steps: 147, storm: [0.44, 0.79], curve: -0.06, f: 1.18 },
        { x0: 190, x1: 1438, y0: 670, y1: 290, amp: 0.27, phase: 4.82, steps: 191, storm: [0.58, 0.95], curve: 0.33, f: 0.71 },
        { x0: 930, x1: 70, y0: 898, y1: 380, amp: 0.46, phase: 1.03, steps: 138, storm: [0.11, 0.49], curve: -0.29, f: 1.34 },
        { x0: 610, x1: 1260, y0: 790, y1: -35, amp: 0.33, phase: 3.66, steps: 172, storm: [0.31, 0.54], curve: 0.03, f: 0.95 },
        { x0: 1185, x1: 690, y0: 930, y1: 95, amp: 0.43, phase: 5.4, steps: 155, storm: [0.66, 0.89], curve: -0.18, f: 1.09 },
        { x0: 355, x1: 760, y0: 560, y1: 15, amp: 0.37, phase: 0.71, steps: 129, storm: [0.19, 0.37], curve: 0.24, f: 1.42 },
      ]
    : [
        /* Dream: edge-to-edge lianas — curved like vines, no wave motion. */
        { x0: 70, x1: 520, y0: 900, y1: 0, amp: 0, phase: 0.44, steps: 96, curve: 0.28, vine: 0.11, f: 0.9 },
        { x0: 1440, x1: 880, y0: 640, y1: 0, amp: 0, phase: 2.15, steps: 88, curve: -0.19, vine: -0.07, f: 1.22 },
        { x0: 0, x1: 1440, y0: 210, y1: 355, amp: 0, phase: 4.6, steps: 110, curve: 0.14, vine: 0.16, f: 0.74 },
        { x0: 1180, x1: 0, y0: 900, y1: 480, amp: 0, phase: 1.05, steps: 102, curve: -0.31, vine: 0.09, f: 1.31 },
        { x0: 340, x1: 1440, y0: 900, y1: 520, amp: 0, phase: 3.4, steps: 94, curve: 0.22, vine: -0.13, f: 0.98 },
        { x0: 0, x1: 710, y0: 720, y1: 0, amp: 0, phase: 5.7, steps: 100, curve: 0.17, vine: 0.05, f: 1.08 },
        { x0: 990, x1: 1440, y0: 900, y1: 180, amp: 0, phase: 0.82, steps: 84, curve: -0.24, vine: -0.1, f: 1.41 },
      ];

  /** Stretch a segment along its direction until both ends sit on the viewBox edge. */
  function extendToEdges(cfg) {
    const dx = cfg.x1 - cfg.x0;
    const dy = cfg.y1 - cfg.y0;
    let t0 = -Infinity;
    let t1 = Infinity;

    const clip = (p, q) => {
      if (p === 0) return q >= 0;
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
      return true;
    };

    if (
      !clip(-dx, cfg.x0) ||
      !clip(dx, W - cfg.x0) ||
      !clip(-dy, cfg.y0) ||
      !clip(dy, H - cfg.y0) ||
      t0 === -Infinity ||
      t1 === Infinity
    ) {
      return cfg;
    }

    return {
      ...cfg,
      x0: cfg.x0 + t0 * dx,
      y0: cfg.y0 + t0 * dy,
      x1: cfg.x0 + t1 * dx,
      y1: cfg.y0 + t1 * dy,
    };
  }

  const strands = rawStrands.map(extendToEdges);

  function smooth(a, b, t) {
    const n = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return n * n * (3 - 2 * n);
  }

  function stormMask(u, a, b) {
    if (b <= a) return 0;
    const rise = smooth(a, a + (b - a) * 0.28, u);
    const fall = 1 - smooth(a + (b - a) * 0.72, b, u);
    return rise * fall;
  }

  function buildStrand(cfg, seconds, echo) {
    const points = [];
    const steps = cfg.steps;
    const ph = cfg.phase + (echo ? 1.35 : 0);
    const curve = cfg.curve || 0;
    const f = cfg.f || 1;
    const dx = cfg.x1 - cfg.x0;
    const dy = cfg.y1 - cfg.y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const bx = cfg.x0 + dx * u;
      const by = cfg.y0 + dy * u;
      const vine = cfg.vine || 0;
      const bow =
        (Math.sin(u * Math.PI * (0.85 + f * 0.2)) * curve +
          Math.sin(u * Math.PI * 1.65 + ph * 0.2) * vine) *
        len *
        0.13;
      const edgeFade = smooth(0, 0.03, u) * (1 - smooth(0.97, 1, u));

      let wave = 0;
      if (isThirst) {
        const [a, b] = cfg.storm || [0.2, 0.55];
        const mask = stormMask(u, a, b);
        const restless =
          28 * Math.sin(u * (78 + f * 22) - seconds * (1.9 + f * 0.5) + ph) +
          16 * Math.sin(u * (140 + f * 40) + seconds * (1.2 + f * 0.4) + ph) +
          9 * Math.sin(u * (210 + f * 50) - seconds * f + ph);
        wave = cfg.amp * mask * restless;
      }
      /* Dream: no waves — only the static vine bend. */

      const x = bx + nx * (bow + wave) * edgeFade;
      const y = by + ny * (bow + wave) * edgeFade;
      points.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(" ");
  }

  function ensurePaths() {
    const existing = svg.querySelectorAll("[data-strand]").length;
    if (existing === strands.length) return;
    const frag = document.createDocumentFragment();
    strands.forEach((_, idx) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("data-strand", String(idx));
      ["glow", "core", "flow"].forEach((role) => {
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("class", `world-threads__${role}`);
        p.setAttribute("data-role", role);
        if (role === "flow") {
          p.setAttribute("pathLength", "1000");
          if (idx === 1 || idx === 5) p.classList.add("world-threads__flow--slow");
          if (idx === 2 || idx === 6) p.classList.add("world-threads__flow--soft");
        }
        g.appendChild(p);
      });
      frag.appendChild(g);
    });
    svg.replaceChildren(frag);
  }

  function draw(seconds) {
    ensurePaths();
    svg.querySelectorAll("[data-strand]").forEach((g, idx) => {
      const cfg = strands[idx];
      if (!cfg) return;
      const core = buildStrand(cfg, seconds, false);
      g.querySelector('[data-role="glow"]').setAttribute("d", core);
      g.querySelector('[data-role="core"]').setAttribute("d", core);
      g.querySelector('[data-role="flow"]').setAttribute("d", buildStrand(cfg, seconds, true));
    });
    svg.style.setProperty("--thread-offset", String(-(seconds * (isThirst ? 26 : 11))));
  }

  let frame = 0;
  let visible = false;
  let elapsed = 0;
  let last = 0;

  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) {
      last = 0;
      return;
    }
    if (!last) last = now;
    if (now - last >= 32) {
      elapsed += Math.min(now - last, 80) / 1000;
      last = now;
      draw(elapsed);
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (visible && !document.hidden && !reduced.matches) {
      frame = requestAnimationFrame(tick);
    }
  }

  draw(0);
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      sync();
    },
    { rootMargin: "80px" }
  );
  observer.observe(svg.closest(".world-stage") || svg);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", () => {
    if (reduced.matches) draw(0);
    sync();
  });
})();
