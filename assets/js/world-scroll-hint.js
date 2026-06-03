/**
 * Scroll hint (arrow): world hubs + main portal (index).
 */
(function () {
  var MQ = window.matchMedia("(max-width: 1100px)");
  var hint;
  var config;

  var HINT_HTML =
    '<button type="button" class="world-scroll-hint__btn">' +
    '<span class="world-scroll-hint__ring" aria-hidden="true"></span>' +
    '<span class="world-scroll-hint__icon" aria-hidden="true">' +
    '<svg class="world-scroll-hint__svg" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
    '<path class="world-scroll-hint__path world-scroll-hint__path--a" d="M7 12 L16 21 L25 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path class="world-scroll-hint__path world-scroll-hint__path--b" d="M7 18 L16 27 L25 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg></span></button>";

  function detectConfig() {
    var stage = document.querySelector(".world-page .world-stage");
    if (stage) {
      return {
        mode: "world",
        stage: stage,
        anchor: stage.querySelector(".world-hero"),
        ariaKey: document.body.classList.contains("world--weaver")
          ? "weaverWorld.scrollHint"
          : "dreamWorld.scrollHint"
      };
    }
    if (document.body.classList.contains("page-portal")) {
      return {
        mode: "portal",
        stage: document.querySelector(".portal"),
        anchor: document.querySelector(".portal .core"),
        ariaKey: "index.scrollHint"
      };
    }
    return null;
  }

  function ariaLabel() {
    var t = window.SunnyI18n && window.SunnyI18n.t;
    if (t && config) {
      var val = t(config.ariaKey);
      if (val) return val;
    }
    return "Scroll down";
  }

  function applyAriaLabel() {
    if (!hint) return;
    var btn = hint.querySelector(".world-scroll-hint__btn");
    if (btn) btn.setAttribute("aria-label", ariaLabel());
  }

  function isScrollable() {
    return document.documentElement.scrollHeight > window.innerHeight + 120;
  }

  function anchorBottomY() {
    if (!config || !config.anchor) return 0;
    var rect = config.anchor.getBoundingClientRect();
    return rect.bottom + (window.scrollY || window.pageYOffset);
  }

  /** iOS: привязка к visualViewport, чтобы низ экрана = низ стрелки */
  function syncHintBottom() {
    if (!hint || !MQ.matches) return;
    var gap = 12;
    var vv = window.visualViewport;
    if (vv) {
      var inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      hint.style.bottom = Math.round(inset + gap) + "px";
      return;
    }
    hint.style.bottom = "";
  }

  function updateVisibility() {
    syncHintBottom();
    if (!hint || !MQ.matches || !config) {
      if (hint) hint.classList.remove("is-visible");
      return;
    }
    if (!isScrollable()) {
      hint.classList.remove("is-visible");
      return;
    }
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var hideAfter = Math.min(anchorBottomY() - vh * 0.38, vh * 0.55);
    if (y > 48 || (hideAfter > 0 && y > hideAfter)) {
      hint.classList.remove("is-visible");
      return;
    }
    hint.classList.add("is-visible");
  }

  function scrollToNext() {
    if (!config) return;

    if (config.mode === "world") {
      var next = config.anchor && config.anchor.nextElementSibling;
      if (next) {
        next.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    if (config.mode === "portal") {
      var y = window.scrollY || window.pageYOffset;
      var dream = document.querySelector(".portal .panel--dream");
      var sound = document.querySelector(".sound-of-the-world");
      if (config.anchor && dream && y < anchorBottomY() - 80) {
        dream.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (sound) {
        sound.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    window.scrollBy({ top: Math.round(window.innerHeight * 0.82), behavior: "smooth" });
  }

  function bind() {
    if (!hint) return;
    var btn = hint.querySelector(".world-scroll-hint__btn");
    if (btn) {
      btn.addEventListener("click", scrollToNext);
    }
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility, { passive: true });
    window.addEventListener("load", updateVisibility);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateVisibility);
      window.visualViewport.addEventListener("scroll", updateVisibility);
    }
    if (typeof MQ.addEventListener === "function") {
      MQ.addEventListener("change", updateVisibility);
    } else {
      MQ.addListener(updateVisibility);
    }
    document.addEventListener("sunnychimera:i18n-ready", applyAriaLabel);
  }

  function mount() {
    config = detectConfig();
    if (!config || document.querySelector(".world-scroll-hint")) return;

    hint = document.createElement("div");
    hint.className = "world-scroll-hint";
    hint.innerHTML = HINT_HTML;
    document.body.appendChild(hint);
    applyAriaLabel();
    bind();
    updateVisibility();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
