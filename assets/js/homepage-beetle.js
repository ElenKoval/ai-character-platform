/* Kiper's beetle: a small visitor, independent of the page controls. */
(() => {
  const bug = document.querySelector('#wandering-beetle');
  const sprite = bug?.querySelector('.beetle-sprite');
  const toggle = document.querySelector('#beetle-toggle');
  if (!bug || !sprite || !toggle) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const reader = document.querySelector('#reader');
  let sleeping = false;
  try { sleeping = localStorage.getItem('sunnychimera-beetle-sleeping') === 'true'; } catch {}
  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  let width = innerWidth, height = innerHeight;
  let x = width + 55, y = Math.min(190, height * .3), angle = -Math.PI / 2;
  let state = 'hidden', timer = 0, raf = 0, lastTime = 0, route = null;
  let visits = 0, lastFright = -10000, assetReady = false, suspended = false;
  const busy = () => sleeping || motion.matches || document.hidden || reader?.open;
  function syncToggle() {
    toggle.textContent = sleeping ? 'Разбудить жука' : 'Усыпить жука';
    toggle.setAttribute('aria-pressed', String(sleeping));
  }
  function cancel() { clearTimeout(timer); cancelAnimationFrame(raf); timer = 0; raf = 0; lastTime = 0; }
  function paint() {
    bug.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) rotate(${angle}rad)`;
  }
  // Stop on empty space or artwork, never on text or an interactive control.
  function safeAt(px, py) {
    const el = document.elementFromPoint(px, py);
    return !el || !el.closest('a,button,input,textarea,select,dialog,h1,h2,h3,p,blockquote,nav,.person-words,.apparition-name,.scribble');
  }
  function destination() {
    for (let i = 0; i < 24; i++) {
      const nx = clamp(x + rand(-250, 250), 25, width - 25);
      const ny = clamp(y + rand(-200, 200), 105, Math.max(106, height - 35));
      if (Math.hypot(nx - x, ny - y) > 60 && safeAt(nx, ny)) return { x: nx, y: ny };
    }
    return { x: x < width / 2 ? 21 : width - 21, y: clamp(y + rand(-140, 140), 110, height - 30) };
  }
  function hidden(delay) {
    cancel(); state = 'hidden'; bug.hidden = true; bug.classList.remove('resting');
    if (!busy() && assetReady) timer = setTimeout(appear, delay);
  }
  function rest() {
    if (busy()) return;
    state = 'resting'; bug.classList.add('resting'); sprite.style.backgroundPosition = '0% 50%';
    timer = setTimeout(() => {
      if (visits >= 3 && Math.random() < .32) leave();
      else { visits++; travel(destination(), Math.random() < .28 ? rand(75, 115) : rand(20, 43)); }
    }, Math.random() < .2 ? rand(14000, 24000) : rand(1800, 6500));
  }
  function travel(to, speed, exiting = false) {
    cancel(); if (busy()) return;
    bug.hidden = false; bug.classList.remove('resting'); state = exiting ? 'leaving' : 'walking';
    const dx = to.x - x, dy = to.y - y, length = Math.max(1, Math.hypot(dx, dy));
    const bend = exiting ? 0 : rand(-45, 45);
    route = { fromX: x, fromY: y, toX: to.x, toY: to.y,
      cx: (x + to.x) / 2 - dy / length * bend,
      cy: (y + to.y) / 2 + dx / length * bend,
      duration: Math.max(.35, (length + Math.abs(bend)) / speed), progress: 0, speed, exiting };
    raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    if (busy()) { suspend(); return; }
    if (!route) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 0; lastTime = now;
    route.progress = Math.min(1, route.progress + dt / route.duration);
    const t = route.progress, a = 1 - t;
    const nx = a*a*route.fromX + 2*a*t*route.cx + t*t*route.toX;
    const ny = a*a*route.fromY + 2*a*t*route.cy + t*t*route.toY;
    if (Math.hypot(nx-x, ny-y) > .001) {
      const desired = Math.atan2(ny-y, nx-x) + Math.PI/2;
      const delta = Math.atan2(Math.sin(desired-angle), Math.cos(desired-angle));
      angle += delta * Math.min(1, dt * 10);
    }
    x = nx; y = ny; paint();
    const frame = Math.floor(now / (route.speed > 60 ? 75 : 135)) % 4;
    sprite.style.backgroundPosition = `${frame * 100 / 3}% 50%`;
    if (t < 1) raf = requestAnimationFrame(tick);
    else { lastTime = 0; route = null; if (state === 'leaving') hidden(rand(15000, 50000)); else rest(); }
  }
  function appear() {
    if (busy() || !assetReady) return;
    visits = 0; const right = Math.random() > .35;
    x = right ? width + 48 : -48; y = rand(140, Math.max(141, height * .65));
    angle = right ? -Math.PI/2 : Math.PI/2; paint();
    travel({ x: right ? width - rand(55, 110) : rand(55, 110), y: clamp(y + rand(-35,35),110,height-40) }, 38);
  }
  function leave() {
    travel({ x: x < width/2 ? -65 : width+65, y: clamp(y+rand(-90,90),60,height-25) }, rand(75,110), true);
  }
  function fright(e) {
    if (busy() || bug.hidden || performance.now()-lastFright < 2500) return;
    if (Math.hypot(e.clientX-x,e.clientY-y) > (e.type === 'pointerdown' ? 70 : 57)) return;
    lastFright = performance.now();
    if (e.type === 'pointerdown' || Math.random() < .7) {
      const dx = x-e.clientX || 1, dy = y-e.clientY, length = Math.hypot(dx,dy);
      travel({ x: clamp(x+dx/length*rand(130,240),-60,width+60), y: clamp(y+dy/length*rand(100,170),80,height-25) },130);
    } else { cancel(); rest(); }
  }
  function suspend() { cancel(); suspended = true; bug.hidden = true; }
  function resume() {
    syncToggle();
    if (!assetReady) return;
    if (sleeping || document.hidden || reader?.open) { suspend(); return; }
    suspended = false;
    if (motion.matches) {
      cancel(); state = 'resting'; x = width-32; y = clamp(height*.4,115,height-50); angle = 0;
      bug.hidden = false; sprite.style.backgroundPosition = '0% 50%'; bug.classList.remove('resting'); paint();
    } else hidden(1800);
  }
  toggle.addEventListener('click', () => {
    sleeping = !sleeping;
    try { localStorage.setItem('sunnychimera-beetle-sleeping', String(sleeping)); } catch {}
    resume();
  });
  document.addEventListener('pointermove', fright, { passive: true });
  document.addEventListener('pointerdown', fright, { passive: true });
  document.addEventListener('visibilitychange', resume);
  motion.addEventListener('change', resume);
  if (reader) new MutationObserver(resume).observe(reader, { attributes: true, attributeFilter: ['open'] });
  window.addEventListener('resize', () => {
    width = innerWidth; height = innerHeight;
    if (!bug.hidden) { cancel(); x = clamp(x,22,width-22); y = clamp(y,100,height-25); paint(); if (!busy()) rest(); }
  }, { passive: true });
  window.addEventListener('pagehide', suspend);
  window.addEventListener('pageshow', e => { if (e.persisted) resume(); });
  const sheet = new Image();
  sheet.onload = () => {
    assetReady = true; toggle.hidden = false;
    bug.style.setProperty('--beetle-ratio', `${sheet.naturalWidth / 4} / ${sheet.naturalHeight}`);
    resume();
  };
  sheet.onerror = () => { suspend(); toggle.hidden = true; };
  sheet.src = 'assets/img/green-beetle-sprite.png'; syncToggle();
})();
