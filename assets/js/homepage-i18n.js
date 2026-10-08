/**
 * Apply homepage copy + TOC for the active language.
 */
(() => {
  const FLAT = {
    "home.siteTitle": "siteTitle",
    "home.siteDesc": "siteDesc",
    "home.skip": "skip",
    "home.intro": "intro",
    "home.readPrologue": "readPrologue",
    "home.keeperTouch": "keeperTouch",
    "home.keeperThought": "keeperThought",
    "home.history": "history",
    "home.itBegins": "itBegins",
    "home.mapTitle": "mapTitle",
    "home.mapHint": "mapHint",
    "home.fromAlbum": "fromAlbum",
    "home.openAlbum": "openAlbum",
    "footer.brand": "brand",
    "footer.partOne": "partOne",
    "footer.about": "about",
    "footer.legal": "legal",
  };

  function t(key) {
    if (window.SunnyI18n?.t) {
      const v = window.SunnyI18n.t(key);
      if (v) return v;
    }
    const flat = FLAT[key] || key.split(".").pop();
    return window.SunnyLocale?.t?.(flat) || window.SunnyLocale?.t?.(key) || "";
  }

  function applyHome() {
    const lang = window.SunnyLocale?.getLang?.() || "en";
    document.documentElement.lang = lang;

    const title = t("home.siteTitle") || t("siteTitle");
    if (title) document.title = title;
    const desc = document.querySelector('meta[name="description"]');
    const descText = t("home.siteDesc") || t("siteDesc");
    if (desc && descText) desc.setAttribute("content", descText);

    const skip = document.querySelector(".skip-link");
    if (skip) skip.textContent = t("home.skip") || t("skip");

    const hero = document.querySelector("#hero-title");
    const heroHtml = t("home.heroTitleHtml");
    if (hero && heroHtml) hero.innerHTML = heroHtml;

    const intro = document.querySelector(".hero-copy .intro");
    if (intro) intro.textContent = t("home.intro") || intro.textContent;

    const primary = document.querySelector(".hero-copy .primary");
    if (primary) primary.textContent = t("home.readPrologue") || primary.textContent;

    const dryadImg = document.querySelector(".hero-art img");
    const dryadAlt = t("home.dryadAlt");
    if (dryadImg && dryadAlt) dryadImg.alt = dryadAlt;

    const keeperBtn = document.querySelector("#keeper-murmur");
    if (keeperBtn) {
      const thought = t("home.keeperThought");
      if (thought) keeperBtn.setAttribute("aria-label", thought);
      const span = keeperBtn.querySelector("span");
      if (span) span.textContent = t("home.keeperTouch") || span.textContent;
      const img = keeperBtn.querySelector("img");
      const kAlt = t("home.keeperAlt");
      if (img && kAlt) img.alt = kAlt;
    }

    const epigraph = document.querySelector(".contents-epigraph");
    if (epigraph) epigraph.textContent = t("home.epigraph") || epigraph.textContent;

    const label = document.querySelector(".contents-label");
    if (label) label.textContent = t("home.history") || label.textContent;

    const partTitle = document.querySelector("#contents-title");
    const partHtml = t("home.partFirstHtml");
    if (partTitle && partHtml) partTitle.innerHTML = partHtml;

    const cont = document.querySelector(".contents-cont");
    if (cont) cont.textContent = t("home.itBegins") || cont.textContent;

    const worldTitle = document.querySelector("#world-title");
    const mapTitle = t("home.mapTitle") || t("mapTitle");
    if (worldTitle && mapTitle) worldTitle.textContent = mapTitle;

    const mapHint = document.querySelector("[data-wm-hint]");
    if (mapHint) mapHint.textContent = t("home.mapHint") || t("map.hint") || mapHint.textContent;

    const mapBase = document.querySelector(".world-map__base");
    const mapAlt = t("home.mapAlt");
    if (mapBase && mapAlt) mapBase.alt = mapAlt;

    ["garden", "tree", "wasteland", "forest"].forEach((id) => {
      const hit = document.querySelector(`[data-region="${id}"]`);
      const labelKey = `map.${id}`;
      const name = t(labelKey);
      if (hit && name) hit.setAttribute("aria-label", name);
    });

    const openAlbum = document.querySelector(".album-strip__head .text-link");
    if (openAlbum) openAlbum.textContent = t("home.openAlbum") || openAlbum.textContent;
    // Gallery title + cards are owned by world-map.js (region-linked).

    const brand = document.querySelector("footer .brand");
    if (brand) brand.textContent = t("footer.brand") || t("brand") || brand.textContent;
    const part = document.querySelector("footer .footer-part");
    if (part) part.textContent = t("footer.partOne") || t("partOne") || part.textContent;
    const about = document.querySelector("footer > a[href*='about']");
    if (about) about.textContent = t("footer.about") || t("about") || about.textContent;
    const legal = document.querySelector(".footer-legal");
    if (legal) legal.textContent = t("footer.legal") || t("legal") || legal.textContent;

    // TOC from story
    const story = window.homepageStory;
    if (story?.chapters) {
      story.chapters.forEach((ch) => {
        const btn = document.querySelector(`[data-read="${ch.id}"]`);
        if (!btn) return;
        const name = btn.querySelector(".contents-name");
        if (name) name.textContent = ch.toc || ch.title;
      });
      const prologueBtn = document.querySelector('[data-read="beginning"]');
      if (prologueBtn && story.chapters[0]) {
        prologueBtn.textContent = story.chapters[0].toc || story.chapters[0].title;
      }
    }
  }

  function run() {
    applyHome();
  }

  if (window.SunnyI18n?.ready) run();
  else document.addEventListener("sunnychimera:i18n-ready", run);
  // Also run soon with sync locale (before async dict) so EN browsers don't flash RU.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (!window.SunnyI18n?.ready) applyHome();
    });
  } else if (!window.SunnyI18n?.ready) {
    applyHome();
  }
})();
