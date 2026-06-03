/**
 * world.html: вкладки История / Дриада и Кипер
 */
(function () {
  var VALID = ["history", "duo"];
  var HASH_ALIASES = { dryad: "duo", keeper: "duo" };

  function normalizeTab(name) {
    if (HASH_ALIASES[name]) return HASH_ALIASES[name];
    return VALID.indexOf(name) !== -1 ? name : "history";
  }

  function setTab(name) {
    name = normalizeTab(name);

    document.querySelectorAll("[data-world-tab]").forEach(function (btn) {
      var on = btn.getAttribute("data-world-tab") === name;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });

    var root = document.querySelector(".world-history--tabs");
    if (root) {
      root.setAttribute("data-world-view", name);
    }

    var historyPanel = document.querySelector(".world-history__panel--history");
    if (historyPanel) {
      var showHistory = name === "history";
      historyPanel.classList.toggle("is-active", showHistory);
      historyPanel.hidden = !showHistory;
    }

    if (name === "history" && typeof window.initWorldHistoryReveal === "function") {
      window.initWorldHistoryReveal();
    }

    try {
      var url = new URL(window.location.href);
      if (name === "history") {
        url.hash = "";
      } else {
        url.hash = name;
      }
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function tabFromHash() {
    var h = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    return normalizeTab(h);
  }

  function syncChromeHeight() {
    var chrome = document.querySelector(".world-history__chrome");
    if (!chrome || !window.matchMedia("(max-width: 1100px)").matches) {
      document.documentElement.style.removeProperty("--world-chrome-h");
      return;
    }
    document.documentElement.style.setProperty("--world-chrome-h", chrome.offsetHeight + "px");
  }

  function init() {
    if (!document.querySelector(".world-history--tabs")) return;

    document.documentElement.classList.add("page-world-history-root");
    syncChromeHeight();
    window.addEventListener("resize", syncChromeHeight);
    document.addEventListener("sunnychimera:i18n-ready", syncChromeHeight);

    document.querySelectorAll("[data-world-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTab(btn.getAttribute("data-world-tab"));
      });
    });

    window.addEventListener("hashchange", function () {
      setTab(tabFromHash());
    });

    document.addEventListener("sunnychimera:world-story-loaded", function () {
      if (document.querySelector(".world-history__panel--history.is-active")) {
        if (typeof window.initWorldHistoryReveal === "function") {
          window.initWorldHistoryReveal();
        }
      }
    });

    setTab(tabFromHash());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
