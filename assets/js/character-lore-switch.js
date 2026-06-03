(function () {
  var LORE_STORY_PREFIX = "sunnychimera-lore-story:";

  function loreStoryKey() {
    return LORE_STORY_PREFIX + window.location.pathname.replace(/\\/g, "/");
  }

  function canonicalStorySrc(src) {
    if (!src) return "";
    return src.replace(/\.ru\.html$/i, ".html");
  }

  function saveActiveStory(src) {
    try {
      sessionStorage.setItem(loreStoryKey(), canonicalStorySrc(src));
    } catch (e) {}
  }

  function getLang() {
    if (window.SunnyI18n && typeof window.SunnyI18n.getLang === "function") {
      return window.SunnyI18n.getLang();
    }
    return document.documentElement.lang === "ru" ? "ru" : "en";
  }

  function localizePath(src, lang) {
    if (!src) return src;
    if (lang !== "ru") return src;
    return src.replace(/\.html$/i, ".ru.html");
  }

  function storyLabel(btn) {
    var key = btn.getAttribute("data-i18n-story");
    if (key && window.SunnyI18n && typeof window.SunnyI18n.t === "function") {
      var fromJson = window.SunnyI18n.t(key);
      if (fromJson) return fromJson;
    }
    var lang = getLang();
    var legacyKey = lang === "ru" ? "labelRu" : "labelEn";
    return btn.dataset[legacyKey] || btn.textContent;
  }

  function initNav(nav) {
    var lore = nav.closest(".character-lore");
    var box = lore && lore.querySelector("[data-character-lore-content]");
    if (!box) return;

    var buttons = Array.prototype.slice.call(nav.querySelectorAll(".character-lore__story-btn"));
    if (!buttons.length) return;

    function updateLabels() {
      buttons.forEach(function (btn) {
        btn.textContent = storyLabel(btn);
      });
    }

    function setActive(btn) {
      buttons.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
    }

    function loadStory(btn) {
      var src = btn.dataset.storySrc;
      if (!src) return;
      saveActiveStory(src);
      var lang = getLang();
      var localized = localizePath(src, lang);
      box.setAttribute("aria-busy", "true");
      fetch(localized)
        .then(function (r) {
          if (!r.ok && localized !== src) return fetch(src);
          return r;
        })
        .then(function (r) { return r.text(); })
        .then(function (html) {
          box.innerHTML = html.trim();
          box.removeAttribute("aria-busy");
        })
        .catch(function () {
          box.removeAttribute("aria-busy");
        });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setActive(btn);
        loadStory(btn);
      });
    });

    function initActive() {
      updateLabels();
      var active = null;
      try {
        var saved = sessionStorage.getItem(loreStoryKey());
        if (saved) {
          active = buttons.find(function (btn) {
            return canonicalStorySrc(btn.dataset.storySrc) === canonicalStorySrc(saved);
          });
        }
      } catch (e) {}
      if (!active) {
        active = nav.querySelector(".character-lore__story-btn.is-active") || buttons[0];
      }
      setActive(active);
      loadStory(active);
    }

    initActive();
    document.addEventListener("sunnychimera:i18n-ready", initActive);
  }

  function loadLoreHtml(box, src) {
    if (!box || !src) return;
    var lang = getLang();
    var localized = localizePath(src, lang);
    box.setAttribute("aria-busy", "true");
    fetch(localized)
      .then(function (r) {
        if (!r.ok && localized !== src) return fetch(src);
        return r;
      })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        box.innerHTML = html.trim();
        box.removeAttribute("aria-busy");
      })
      .catch(function () {
        box.removeAttribute("aria-busy");
      });
  }

  function initStandaloneLore(lore) {
    if (lore.querySelector("[data-character-lore-nav]")) return;
    var box = lore.querySelector("[data-character-lore-content]");
    if (!box) return;
    var src = box.getAttribute("data-lore-src");
    if (!src) return;
    function load() {
      loadLoreHtml(box, src);
    }
    load();
    document.addEventListener("sunnychimera:i18n-ready", load);
  }

  document.querySelectorAll("[data-character-lore-nav]").forEach(initNav);
  document.querySelectorAll(".character-lore").forEach(initStandaloneLore);
})();
