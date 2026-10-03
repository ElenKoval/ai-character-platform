/**
 * Navigate to the dedicated talk page (no overlays).
 * window.SunnyTalk.go(characterId, { seed? })
 */
(() => {
  const RETURN_KEY = "sunnychimera-talk-return";
  const SEED_KEY = "sunnychimera-talk-seed";

  function assetBase() {
    const path = (window.location.pathname || "").replace(/\\/g, "/");
    return /\/pages\//.test(path) || /\/pages$/.test(path) ? "../" : "";
  }

  function talkUrl(id) {
    return `${assetBase()}pages/talk.html?c=${encodeURIComponent(id)}`;
  }

  function captureReturn() {
    try {
      const reader = document.getElementById("reader");
      const payload = {
        href: window.location.href,
        at: Date.now(),
      };
      if (reader?.open) {
        const max = reader.scrollHeight - reader.clientHeight;
        payload.reader = true;
        payload.scrollRatio = max > 0 ? reader.scrollTop / max : 0;
        payload.chapterId =
          window.history.state?.chapterId ||
          new URLSearchParams(window.location.search).get("read") ||
          "";
        // Persist so Continue / ?read= restore the same place
        if (typeof window.SunnyReader?.persist === "function") {
          window.SunnyReader.persist();
        }
      } else {
        payload.scrollY = window.scrollY || window.pageYOffset || 0;
      }
      sessionStorage.setItem(RETURN_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function go(id, opts = {}) {
    if (!id) return;
    captureReturn();
    const seed = (opts.seed || "").trim();
    try {
      if (seed) sessionStorage.setItem(SEED_KEY, seed);
      else sessionStorage.removeItem(SEED_KEY);
    } catch (e) {}
    window.location.href = talkUrl(id);
  }

  function takeSeed() {
    try {
      const s = sessionStorage.getItem(SEED_KEY) || "";
      sessionStorage.removeItem(SEED_KEY);
      return s;
    } catch (e) {
      return "";
    }
  }

  function takeReturn() {
    try {
      const raw = sessionStorage.getItem(RETURN_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(RETURN_KEY);
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function back() {
    const ret = takeReturn();
    if (ret?.href) {
      // Keep scroll hint for the landing page
      try {
        sessionStorage.setItem(
          "sunnychimera-talk-restore",
          JSON.stringify({
            href: ret.href,
            scrollY: ret.scrollY || 0,
            scrollRatio: ret.scrollRatio || 0,
            reader: !!ret.reader,
            chapterId: ret.chapterId || "",
            at: Date.now(),
          })
        );
      } catch (e) {}
      window.location.href = ret.href;
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = `${assetBase()}index.html`;
  }

  window.SunnyTalk = { go, back, takeSeed, talkUrl, captureReturn };
})();
