/* One Thread from the left edge of the page to the right.
   Calm → Thirst → through Dream (calm) → short calm → Weaver → living waves. */
(() => {
  const scene = document.querySelector('.thread-crossing');
  const svg = scene?.querySelector('.living-thread');
  if (!svg) return;
  const strands = Object.fromEntries(
    [...svg.querySelectorAll('[data-strand]')].map((path) => [path.dataset.strand, path])
  );
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const smooth = (start, end, value) => {
    const n = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return n * n * (3 - 2 * n);
  };
  /* Character anchors along the full-bleed span (grid: side | Dream | Weaver | side). */
  const DREAM = 0.28;
  const WEAVER = 0.70;

  function pattern(seconds, echo = false) {
    const points = [];
    for (let i = 0; i <= 400; i++) {
      const u = i / 400;
      const phase = echo ? 1.5 : 0;

      /* 1) Left edge: even light. Thirst has not started yet. */
      const calmStart = 1 - smooth(0.04, 0.11, u);

      /* 2) Thirst rises, then dies as the Thread enters Dream. */
      const thirst =
        smooth(0.09, 0.16, u) * (1 - smooth(DREAM - 0.06, DREAM + 0.02, u));

      /* 3–5) Through Dream, the bridge, and into Weaver: no trembling. */
      /* 6) After Weaver: living weave to the right edge. */
      const life = smooth(WEAVER - 0.02, WEAVER + 0.08, u);

      const restless =
        30 * Math.sin(u * 95 - seconds * 2.4 + phase) +
        18 * Math.sin(u * 173 + seconds * 1.7 + phase) +
        11 * Math.sin(u * 251 - seconds + phase);

      const breath = 0.72 + 0.28 * Math.sin(seconds * 2.1 - u * 7);
      const alive =
        breath *
        (40 * Math.sin(u * 76 - seconds * 2.7 + phase) +
          16 * Math.sin(u * 151 - seconds * 5.4 + phase));

      /* Soft climb across the span — they grow. */
      const growth = -52 * smooth(DREAM - 0.04, WEAVER + 0.04, u);

      const wave =
        thirst * restless * (1 - calmStart) + life * alive;

      const y = 340 + growth + 2.5 * Math.sin(u * 8) + wave;
      points.push(`${i ? 'L' : 'M'}${(u * 1440).toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  }

  function draw(seconds) {
    const core = pattern(seconds);
    strands.core.setAttribute('d', core);
    strands.aura.setAttribute('d', core);
    strands.current.setAttribute('d', core);
    strands.echo.setAttribute('d', pattern(seconds, true));
    svg.style.setProperty('--thread-offset', String(-seconds * 28));
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
    { rootMargin: '60px' }
  );
  observer.observe(scene);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => {
    if (reduced.matches) draw(0);
    sync();
  });
})();
