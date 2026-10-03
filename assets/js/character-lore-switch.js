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

  function fileName(src) {
    if (!src) return "";
    var clean = canonicalStorySrc(src).split("?")[0];
    var parts = clean.replace(/\\/g, "/").split("/");
    return parts[parts.length - 1] || "";
  }

  function chapterIdFrom(btnOrSrc) {
    if (btnOrSrc && btnOrSrc.dataset && btnOrSrc.dataset.chapter) {
      return btnOrSrc.dataset.chapter;
    }
    var src = typeof btnOrSrc === "string" ? btnOrSrc : (btnOrSrc && btnOrSrc.dataset && btnOrSrc.dataset.storySrc) || "";
    var map = (window.storyMeta && window.storyMeta.loreToChapter) || {};
    return map[fileName(src)] || "";
  }

  function chapterById(id) {
    var chapters = window.homepageStory && window.homepageStory.chapters;
    if (!id || !chapters) return null;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].id === id) return chapters[i];
    }
    return null;
  }

  function isSceneBreak(text) {
    var t = (text || "").trim();
    return t === "***" || t === "* * *" || t === "•••" || t === "· · ·";
  }

  function renderExcerpt(box, chapterId) {
    var ch = chapterById(chapterId);
    if (!ch || !ch.text || !ch.text.length) return false;

    var paras = [];
    for (var i = 0; i < ch.text.length && paras.length < 3; i++) {
      if (isSceneBreak(ch.text[i])) continue;
      if (!String(ch.text[i]).trim()) continue;
      paras.push(ch.text[i]);
    }

    box.replaceChildren();
    paras.forEach(function (t) {
      var p = document.createElement("p");
      p.textContent = t;
      box.appendChild(p);
    });

    var more = document.createElement("button");
    more.type = "button";
    more.className = "lore-excerpt__more";
    more.textContent = "Читать главу целиком";
    more.addEventListener("click", function () {
      if (window.SunnyReader && typeof window.SunnyReader.open === "function") {
        window.SunnyReader.open(chapterId);
      } else {
        var base = (window.storyMeta && window.storyMeta.base) || "../";
        window.location.href = base + "index.html?read=" + encodeURIComponent(chapterId);
      }
    });
    box.appendChild(more);
    box.removeAttribute("aria-busy");
    return true;
  }

  function initNav(nav) {
    var lore = nav.closest(".character-lore");
    var box = lore && lore.querySelector("[data-character-lore-content], .character-lore__text");
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
      if (src) saveActiveStory(src);
      var chapterId = chapterIdFrom(btn);
      box.setAttribute("aria-busy", "true");
      if (chapterId && renderExcerpt(box, chapterId)) return;
      box.textContent = "";
      box.removeAttribute("aria-busy");
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

  function initStandaloneLore(lore) {
    if (lore.querySelector("[data-character-lore-nav]")) return;
    var box = lore.querySelector("[data-character-lore-content], .character-lore__text");
    if (!box) return;
    var src = box.getAttribute("data-lore-src");
    if (!src) return;

    function load() {
      var chapterId = chapterIdFrom(src);
      box.setAttribute("aria-busy", "true");
      if (chapterId && renderExcerpt(box, chapterId)) return;
      box.textContent = "";
      box.removeAttribute("aria-busy");
    }

    load();
    document.addEventListener("sunnychimera:i18n-ready", load);
  }

  document.querySelectorAll("[data-character-lore-nav]").forEach(initNav);
  document.querySelectorAll(".character-lore").forEach(initStandaloneLore);
})();
