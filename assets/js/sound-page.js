/**
 * Sound archive: back link, return URL from character, scroll to #sound-*.
 */
(function () {
  var RETURN_KEY = "sunnychimera-sound-return";

  function t(key, fallback) {
    var fn = window.SunnyI18n && window.SunnyI18n.t;
    return fn ? fn(key) || fallback : fallback;
  }

  function pageFromHash() {
    var m = /^#sound-(.+)$/.exec(window.location.hash);
    if (!m) return null;
    return m[1] + ".html";
  }

  function resolveBackHref() {
    var ref = document.referrer;
    if (ref) {
      try {
        var refUrl = new URL(ref);
        if (refUrl.origin === window.location.origin) {
          var name = refUrl.pathname.replace(/\\/g, "/").split("/").pop() || "";
          if (!name || name === "index.html") {
            try { sessionStorage.removeItem(RETURN_KEY); } catch (e) {}
            return "../index.html";
          }
          if (/\.html$/i.test(name) && name !== "sound.html") return name;
        }
      } catch (e) {}
    }

    try {
      var stored = sessionStorage.getItem(RETURN_KEY);
      if (stored && /\.html$/i.test(stored) && stored !== "sound.html") return stored;
    } catch (e) {}

    var fromHash = pageFromHash();
    if (fromHash && fromHash !== "sound.html") return fromHash;

    return "../index.html";
  }

  function isGateBack(href) {
    return !href || href.indexOf("index.html") !== -1;
  }

  function updateBackLink() {
    var back = document.querySelector(".sound-hub__back");
    if (!back) return;

    var href = resolveBackHref();
    back.setAttribute("href", href);

    if (isGateBack(href)) {
      back.setAttribute("data-i18n", "sound.back");
      back.textContent = t("sound.back", "← The Gate");
    } else {
      back.setAttribute("data-i18n", "mobileLanding.back");
      back.textContent = t("mobileLanding.back", "← Back");
    }
  }

  function scrollToHash() {
    var id = window.location.hash;
    if (!id || id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    requestAnimationFrame(function () {
      var topbar = document.querySelector(".site-header") || document.querySelector(".sound-hub__topbar");
      var offset = topbar ? topbar.getBoundingClientRect().height + 12 : 64;
      var y = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      el.classList.add("sound-character--highlight");
      window.setTimeout(function () {
        el.classList.remove("sound-character--highlight");
      }, 2200);
    });
  }

  function init() {
    updateBackLink();
    scrollToHash();
    document.addEventListener("sunnychimera:i18n-ready", updateBackLink);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("hashchange", scrollToHash);

  window.SunnySoundPage = {
    rememberReturnFrom: function (pageFile) {
      try {
        if (pageFile) sessionStorage.setItem(RETURN_KEY, pageFile);
      } catch (e) {}
    }
  };
})();
