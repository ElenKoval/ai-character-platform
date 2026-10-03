/**
 * Legacy Scene overlay removed.
 * All talk entries navigate to pages/talk.html via SunnyTalk.
 */
(() => {
  function ensureNav(cb) {
    if (window.SunnyTalk?.go) {
      cb();
      return;
    }
    const path = (window.location.pathname || "").replace(/\\/g, "/");
    const base = /\/pages\//.test(path) || /\/pages$/.test(path) ? "../" : "";
    const existing = document.querySelector("script[data-talk-nav]");
    if (existing) {
      existing.addEventListener("load", cb, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = `${base}assets/js/talk-nav.js`;
    s.dataset.talkNav = "1";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function open(id, opts) {
    ensureNav(() => window.SunnyTalk.go(id, opts || {}));
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-scene-open]");
    if (!btn) return;
    e.preventDefault();
    open(btn.dataset.sceneOpen);
  });

  window.SunnyScene = {
    open,
    close() {},
    isOpen() {
      return false;
    },
    send() {},
  };
})();
