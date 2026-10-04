/* One Thread across Dream → Weaver.
   Thirst enters Dream → he cuts it out (straight) → Weaver returns Thirst.
   Front/back layers weave under each drawing, then out again. */
(() => {
  const scene = document.querySelector('.thread-crossing');
  const svgs = [...(scene?.querySelectorAll('.living-thread') || [])];
  if (!scene || !svgs.length) return;

  const layers = svgs.map((svg) =>
    Object.fromEntries(
      [...svg.querySelectorAll('[data-strand]')].map((path) => [path.dataset.strand, path])
    )
  );

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const smooth = (start, end, value) => {
    const n = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return n * n * (3 - 2 * n);
  };

  /* Cut a little left of Dream's visual center — longer clean run to Weaver. */
  const DREAM_MID = 0.24;
  const WEAVER = 0.70;
  const WEAVER_MID = 0.78;
  const CUT_Y = 300;

  function pattern(seconds, echo = false, dy = 0) {
    const points = [];
    for (let i = 0; i <= 400; i++) {
      const u = i / 400;
      const phase = echo ? 1.2 : 0;
      const t = seconds;

      /* Until Dream's middle: thirsty cord. From mid onward: locked straight to Weaver. */
      const cut = smooth(DREAM_MID - 0.01, DREAM_MID + 0.03, u);
      const approachY = 338 + 5 * Math.sin(u * Math.PI * 0.9);
      const spine = approachY * (1 - cut) + CUT_Y * cut;

      /* Soft dive only while weaving under art (doesn't break the cut line). */
      const underDream =
        smooth(0.15, 0.2, u) * (1 - smooth(DREAM_MID - 0.02, DREAM_MID + 0.02, u));
      const underWeaver =
        smooth(0.58, 0.64, u) * (1 - smooth(0.8, 0.87, u));
      const dive = underDream * 10 + underWeaver * 14;

      /* Waves only up to the middle of Dream's drawing. */
      const thirstIn = (1 - cut) * smooth(0.04, 0.11, u);
      const thirstWave =
        16 * Math.sin(u * 68 - t * 1.25 + phase) +
        10 * Math.sin(u * 112 + t * 0.9 + phase) +
        5 * Math.sin(u * 170 - t * 0.55 + phase);

      /* Weaver gives Thirst back — freer, more active after she releases the cord. */
      const thirstBack = smooth(WEAVER - 0.02, WEAVER_MID + 0.04, u);
      const afterWeaver = smooth(0.84, 0.91, u);
      const local = Math.max(0, u - WEAVER);
      const weaverForm =
        thirstBack *
          (24 * Math.sin(local * 16 + 0.35) +
            16 * Math.sin(local * 8 - 0.9) -
            10 * Math.sin(local * 24 + 1.2) * Math.sin(local * 5)) +
        afterWeaver *
          (28 * Math.sin(local * 22 + 0.2) +
            18 * Math.sin(local * 38 - 0.7) +
            11 * Math.sin(local * 55 + 1.1));
      const weaverLife =
        thirstBack *
          (0.85 + 0.15 * Math.sin(t * 1.1 - u * 4)) *
          (10 * Math.sin(u * 32 - t * 1.15 + phase) +
            6 * Math.cos(u * 48 + t * 0.75 + phase)) +
        afterWeaver *
          (14 * Math.sin(u * 42 - t * 1.55 + phase) +
            9 * Math.cos(u * 62 + t * 1.05 + phase) +
            6 * Math.sin(u * 95 - t * 1.9 + phase));

      const y =
        spine + dive + thirstIn * thirstWave + weaverForm + weaverLife + dy;
      points.push(`${i ? 'L' : 'M'}${(u * 1440).toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  }

  function draw(seconds) {
    const core = pattern(seconds);
    const shadow = pattern(seconds, false, 1.6);
    const shine = pattern(seconds, false, -1.2);
    const gleam = pattern(seconds, false, -0.7);
    const echo = pattern(seconds, true, 0.6);

    for (const strands of layers) {
      strands.aura?.setAttribute('d', core);
      strands.body?.setAttribute('d', core);
      strands.core?.setAttribute('d', core);
      strands.current?.setAttribute('d', core);
      strands.shadow?.setAttribute('d', shadow);
      strands.shine?.setAttribute('d', shine);
      strands.gleam?.setAttribute('d', gleam);
      strands.echo?.setAttribute('d', echo);
    }
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
