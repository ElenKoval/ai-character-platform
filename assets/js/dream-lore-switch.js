(function () {
  var nav = document.querySelector("[data-dream-lore-nav]");
  var box = document.querySelector("[data-dream-lore-content]");
  if (!nav || !box) return;

  var buttons = Array.prototype.slice.call(nav.querySelectorAll(".character-lore__story-btn"));
  if (!buttons.length) return;

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

  function updateLabels() {
    var lang = getLang();
    buttons.forEach(function (btn) {
      var key = lang === "ru" ? "labelRu" : "labelEn";
      var label = btn.dataset[key];
      if (label) btn.textContent = label;
    });
  }

  function setActive(btn) {
    buttons.forEach(function (b) { b.classList.remove("is-active"); });
    btn.classList.add("is-active");
  }

  function loadStory(btn) {
    var src = btn.dataset.storySrc;
    if (!src) return;
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
    var active = nav.querySelector(".character-lore__story-btn.is-active") || buttons[0];
    setActive(active);
    loadStory(active);
  }

  initActive();
  document.addEventListener("sunnychimera:i18n-ready", initActive);
})();
