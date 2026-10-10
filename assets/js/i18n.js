/**
 * SunnyChimera i18n: EN / RU via localStorage + optional ?lang=ru
 */
(function () {
  var STORAGE_KEY = "sunnychimera-lang";
  var SUPPORTED = ["en", "ru"];

  function getQueryLang() {
    var m = /[?&]lang=(en|ru)/i.exec(window.location.search);
    return m ? m[1].toLowerCase() : null;
  }

  function getLang() {
    var q = getQueryLang();
    if (q && SUPPORTED.indexOf(q) !== -1) {
      try { localStorage.setItem(STORAGE_KEY, q); } catch (e) {}
      return q;
    }
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    } catch (e) {}
    var nav = (navigator.language || "").toLowerCase();
    if (nav.indexOf("ru") === 0) return "ru";
    return "en";
  }

  function assetBase() {
    var path = window.location.pathname.replace(/\\/g, "/");
    if (/\/pages\//.test(path) || /\/pages$/.test(path)) return "../assets/";
    return "assets/";
  }

  function get(dict, key) {
    if (!dict || !key) return "";
    var parts = key.split(".");
    var cur = dict;
    for (var i = 0; i < parts.length; i++) {
      cur = cur && cur[parts[i]];
      if (cur === undefined) return "";
    }
    return typeof cur === "string" ? cur : "";
  }

  function applyToEl(el, value, attr) {
    if (!el || value === "") return;
    if (attr === "placeholder") {
      el.placeholder = value;
    } else if (attr === "aria-label") {
      el.setAttribute("aria-label", value);
    } else if (attr === "title") {
      el.title = value;
    } else if (attr === "html") {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  }

  /** Map visible English UI text → translation key (for elements without data-i18n) */
  var TEXT_KEY_MAP = {
    "← The Gate": "nav.backGate",
    "The Gate": "common.gate",
    "Врата": "common.gate",
    "← Dream world": "nav.backDreamWorld",
    "← Weaver world": "nav.backWeaverWorld",
    "← World history": "nav.backWorldHistory",
    "← back to The Gate": "nav.backToGate",
    "Dream world": "common.dreamWorld",
    "Dream's world": "common.dreamWorld",
    "Dream's World": "common.dreamWorld",
    "Dream World": "common.dreamWorld",
    "Weaver world": "common.weaverWorld",
    "Weaver's world": "common.weaverWorld",
    "Weaver's World": "common.weaverWorld",
    "Weaver World": "common.weaverWorld",
    "The Gate": "common.gate",
    "Dream": "common.dream",
    "Weaver": "common.weaver",
    "Traces of Presence": "lore.tracesTitle",
    "Stories": "lore.tracesTitle",
    "Истории": "lore.tracesTitle",
    "Seek the truth...": "chat.seekPlaceholder",
    "Send": "chat.send",
    "DREAMS CIRCLE": "dreamWorld.title",
    "Weaver team": "weaverWorld.title",
    "observation · protection": "dreamWorld.heroTag",
    "The Wild Pulse": "tags.wildPulse",
    "Order Circle": "tags.orderCircle",
    "Message to character": "chat.messageAria",
    "Model": "chat.model",
    "Choose model": "chat.chooseModel",
    "Response via Gemini or Groq.": "chat.hintGeminiGroq",
    "The Sound of the World": "sound.title",
    "Music archive by character": "sound.lead",
    "The portal remembers.": "common.portalRemembers",
    "Dream World": "world.dreamWorldBtn",
    "Dream's World": "world.dreamWorldBtn",
    "Weaver World": "world.weaverWorldBtn",
    "Weaver's World": "world.weaverWorldBtn",
    "Dryad": "world.dryadPlaceholder",
    "Kiper": "world.keeperCaption",
    "Keeper": "world.keeperCaption",
    "Searching for self on the moonlit rooftops…": "dreamWorld.catPlaceholder",
    "Ищу себя на крышах под луной…": "dreamWorld.catPlaceholder",
    "threads · thirst · change": "index.weaverTag",
    "thirst · change": "index.weaverTag",
    "жажда · перемены": "index.weaverTag",
    "Track one": "sound.trackOne",
    "Track two": "sound.trackTwo",
    "Track three": "sound.trackThree",
    "Track four": "sound.trackFour",
    "Kiper": "sound.keeperName",
    "Keeper": "sound.keeperName",
    "Dryad": "sound.dryadName",
    "Order Circle": "tags.orderCircle"
  };

  /** English display names → names.* keys (RU: Cyrillic transliteration) */
  var CHARACTER_NAME_MAP = {
    "Mr. Dream": "names.mrDream",
    "The Weaver": "names.theWeaver",
    "The weaver": "names.theWeaver",
    "Weaver": "names.weaver",
    "Dr. Pak": "names.drPak",
    "Dream": "names.dream",
    "Crystal": "names.crystal",
    "CAT": "names.cat",
    "Liora": "names.liora",
    "Shiny": "names.shiny",
    "Shiny Brother": "names.shinyBro",
    "Shiny's Brother": "names.shinyBro",
    "Talking Mushroom": "names.talkMushroom",
    "Angry Forest": "names.angryForest",
    "Dryad": "names.dryad",
    "Kiper": "names.keeper",
    "Кипер": "names.keeper",
    "Keeper": "names.keeper",
    "Хранитель": "names.keeper"
  };

  function applyCharacterNames(dict) {
    var sel = ".character-caption__name, .world-team__card-name, .world-hero__name, .sound-character__name";
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.hasAttribute("data-i18n")) return;
      var key = el.getAttribute("data-name-key");
      if (!key) {
        key = CHARACTER_NAME_MAP[el.textContent.trim()];
        if (!key) return;
        el.setAttribute("data-name-key", key);
      }
      var val = get(dict, key);
      if (val) el.textContent = val;
    });
  }

  function applyTextMap(dict) {
    var nodes = document.querySelectorAll(
      "a, button, h1, h2, h3, p, span, label, .footer__whisper, .world-team__title, .character-caption__tag, .world-team__card-placeholder-text, .character-figure__placeholder-text, .art-placeholder"
    );
    nodes.forEach(function (el) {
      if (el.closest(".lang-switch")) return;
      if (el.closest(".character-page")) return;
      if (el.closest(".page-world-history")) return;
      if (el.closest(".world-history__text")) return;
      if (el.hasAttribute("data-i18n") || el.hasAttribute("data-i18n-html")) return;
      var raw = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? el.textContent.trim()
        : null;
      if (!raw) return;
      var key = TEXT_KEY_MAP[raw];
      if (!key) return;
      var val = get(dict, key);
      if (val) applyToEl(el, val);
    });
  }

  function applyDataI18n(dict) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = get(dict, key);
      if (!val) return;
      var attr = el.getAttribute("data-i18n-attr");
      applyToEl(el, val, attr || null);
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      var val = get(dict, key);
      if (val) applyToEl(el, val, "html");
    });
  }

  function bindSoundEntryFromPortal() {
    document.querySelectorAll(".sound-entry").forEach(function (a) {
      if (a.dataset.soundPortalBound) return;
      a.dataset.soundPortalBound = "1";
      a.addEventListener("click", function () {
        try { sessionStorage.removeItem("sunnychimera-sound-return"); } catch (e) {}
      });
    });
  }

  function applyInnerSoundLinks(dict) {
    var label = get(dict, "chat.innerSound");
    if (!label) return;
    document.querySelectorAll(".sound-playlist-link").forEach(function (a) {
      a.removeAttribute("target");
      if (!a.dataset.soundReturnBound) {
        a.dataset.soundReturnBound = "1";
        a.addEventListener("click", function () {
          try {
            var file = window.location.pathname.replace(/\\/g, "/").split("/").pop();
            if (file && /\.html$/i.test(file)) {
              sessionStorage.setItem("sunnychimera-sound-return", file);
            }
          } catch (e) {}
        });
      }
      if (a.hasAttribute("data-i18n")) return;
      a.textContent = label;
    });
  }

  function localizeLorePath(src, lang) {
    if (lang !== "ru" || !src) return src;
    return src.replace(/\.html$/i, ".ru.html");
  }

  function loadLore(dict) {
    var lang = getLang();
    document.querySelectorAll("[data-lore-src]").forEach(function (el) {
      var src = el.getAttribute("data-lore-src");
      if (!src) return;
      var localized = localizeLorePath(src, lang);
      el.setAttribute("aria-busy", "true");
      fetch(localized)
        .then(function (r) {
          if (!r.ok && localized !== src) return fetch(src);
          return r;
        })
        .then(function (r) { return r.text(); })
        .then(function (html) {
          el.innerHTML = html.trim();
          el.removeAttribute("aria-busy");
        })
        .catch(function () {
          el.removeAttribute("aria-busy");
        });
    });
  }

  function injectLangSwitch(lang) {
    if (document.querySelector(".lang-switch")) return;
    var wrap = document.createElement("div");
    wrap.className = "lang-switch";
    wrap.setAttribute("role", "navigation");
    wrap.setAttribute("aria-label", lang === "ru" ? "Язык" : "Language");
    SUPPORTED.forEach(function (code, index) {
      if (index > 0) {
        var sep = document.createElement("span");
        sep.className = "lang-switch__sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "/";
        wrap.appendChild(sep);
      }
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-switch__btn" + (code === lang ? " is-active" : "");
      btn.textContent = code.toUpperCase();
      btn.setAttribute("aria-pressed", code === lang ? "true" : "false");
      btn.addEventListener("click", function () {
        if (code === getLang()) return;
        if (window.SunnyCharacterMobileTabs && typeof window.SunnyCharacterMobileTabs.prepareLangReload === "function") {
          window.SunnyCharacterMobileTabs.prepareLangReload();
        }
        try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
        window.location.reload();
      });
      wrap.appendChild(btn);
    });
    var portalLangHost = document.querySelector("[data-lang-switch-host]");
    var topbarRight = document.querySelector(".topbar__right");
    var worldTopbar = document.querySelector(".world-page__topbar");
    var historyTopbar = document.querySelector(".world-history__topbar");
    if (portalLangHost) {
      wrap.classList.add("lang-switch--portal");
      portalLangHost.appendChild(wrap);
    } else if (topbarRight) {
      wrap.classList.add("lang-switch--inline");
      topbarRight.appendChild(wrap);
    } else if (worldTopbar) {
      wrap.classList.add("lang-switch--inline");
      worldTopbar.appendChild(wrap);
    } else if (historyTopbar) {
      wrap.classList.add("lang-switch--inline");
      historyTopbar.appendChild(wrap);
    } else {
      wrap.classList.add("lang-switch--footer");
      var footer = document.querySelector(".site-footer .footer__nav");
      if (footer) footer.appendChild(wrap);
      else document.body.appendChild(wrap);
    }
  }

  function applyIndex(dict) {
    if (!document.querySelector(".page-portal")) return;
    document.title = get(dict, "meta.siteTitle");
    applyDataI18n(dict);
  }

  function applyWorldPage(dict) {
    if (!document.querySelector(".page-world-history")) return;
    var lang = getLang();
    document.title = get(dict, "world.pageTitle");
    var box = document.querySelector(".world-history__text");
    if (!box) return;
    var keepBreak = box.querySelector(".world-history__break-line");
    var keepLinks = box.querySelector(".world-history__links");
    fetch(assetBase() + "i18n/world-story." + lang + ".html")
      .then(function (r) {
        if (!r.ok) return fetch(assetBase() + "i18n/world-story.en.html");
        return r;
      })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        Array.from(box.children).forEach(function (ch) {
          if (ch !== keepBreak && ch !== keepLinks && ch.classList && ch.classList.contains("world-history__reveal")) {
            ch.remove();
          }
        });
        var frag = document.createElement("div");
        frag.innerHTML = html.trim();
        var insertBefore = keepBreak || keepLinks;
        while (frag.firstChild) {
          box.insertBefore(frag.firstChild, insertBefore);
        }
        box.removeAttribute("aria-busy");
        document.dispatchEvent(new CustomEvent("sunnychimera:world-story-loaded"));
        if (typeof window.initWorldHistoryReveal === "function") {
          window.initWorldHistoryReveal();
        }
      })
      .catch(function () {
        box.removeAttribute("aria-busy");
      });
  }

  function setLangOnHtml(lang) {
    document.documentElement.lang = lang;
  }

  var ready = false;
  var dictCache = {};

  function init() {
    var lang = getLang();
    setLangOnHtml(lang);
    injectLangSwitch(lang);

    var url = assetBase() + "i18n/" + lang + ".json";
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (dict) {
        dictCache[lang] = dict;
        applyDataI18n(dict);
        applyCharacterNames(dict);
        applyTextMap(dict);
        applyInnerSoundLinks(dict);
        bindSoundEntryFromPortal();
        applyIndex(dict);
        applyWorldPage(dict);
        loadLore(dict);
        ready = true;
        window.SunnyI18n = {
          ready: true,
          lang: lang,
          t: function (key) { return get(dict, key); },
          getLang: getLang
        };
        document.dispatchEvent(new CustomEvent("sunnychimera:i18n-ready", { detail: { lang: lang } }));
      })
      .catch(function () {
        window.SunnyI18n = { ready: false, lang: lang, t: function () { return ""; }, getLang: getLang };
        document.dispatchEvent(new CustomEvent("sunnychimera:i18n-ready", { detail: { lang: lang } }));
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

(function initPortraitImgReveal() {
  var SEL = ".panel__art img, .character-figure__img-wrap img, .world-history__frame-media img, .world-hero__frame img, .world-team__card-img-link img";

  function reveal(img) {
    img.classList.add("is-ready");
  }

  function wire(img) {
    if (img.complete && img.naturalWidth > 0) return;
    img.classList.add("portrait-img-reveal");
    img.style.opacity = "0";
    function onDone() {
      img.style.opacity = "";
      reveal(img);
    }
    img.addEventListener("load", onDone, { once: true });
    img.addEventListener("error", onDone, { once: true });
  }

  function scan() {
    document.querySelectorAll(SEL).forEach(wire);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }
})();
