/**
 * Hydrate character dossier: copy and tracks from storyMeta / homepageStory.
 */
(() => {
  const root = document.querySelector("[data-dossier]");
  if (!root) return;

  const meta = window.storyMeta;
  if (!meta?.characters) return;

  const charId = root.dataset.dossier;
  const character = meta.characters[charId];
  if (!character) return;

  function lang() {
    return window.SunnyLocale?.getLang?.() || (document.documentElement.lang === "ru" ? "ru" : "en");
  }

  function t(key, fallbackEn, fallbackRu) {
    const v = window.SunnyI18n?.t?.(key) || window.SunnyLocale?.t?.(key) || "";
    if (v && v !== key) return v;
    return lang() === "ru" ? fallbackRu : fallbackEn;
  }

  function wrapQuote(q) {
    const s = (q || "").trim();
    if (!s) return "";
    if (/^[«"“]/.test(s) || /^—/.test(s)) return s;
    return lang() === "ru" ? `«${s.replace(/^[«»"„“”]+|[«»"„“”]+$/g, "")}».` : s;
  }

  function hydrateCopy() {
    window.storyMeta?.applyLang?.(lang());
    const c = meta.characters[charId];
    if (!c) return;

    const nameEl = root.querySelector(".dossier__name");
    const essenceEl = root.querySelector(".dossier__essence");
    const blurbEl = root.querySelector(".dossier__blurb");
    const quoteEl = root.querySelector(".dossier__quote");
    const imgEl = root.querySelector(".notebook-page__img, .dossier__art img");
    const placeholderEl = root.querySelector("[data-art-placeholder], .art-placeholder");

    if (nameEl && c.name) nameEl.textContent = c.name;
    if (essenceEl && c.essence) essenceEl.textContent = c.essence;
    if (blurbEl && c.blurb) blurbEl.textContent = c.blurb;
    const readN = (() => {
      const n = window.SunnyChatContext?.getReadChapter?.();
      return Number.isFinite(Number(n)) ? Math.min(13, Math.max(0, Math.trunc(Number(n)))) : 0;
    })();
    const opening =
      typeof c.getOpening === "function"
        ? c.getOpening(readN, { lang: lang() })
        : c.quote;
    if (quoteEl && opening) quoteEl.textContent = wrapQuote(opening);
    if (imgEl && c.name) imgEl.alt = c.name;
    if (placeholderEl && c.artPlaceholder) {
      placeholderEl.textContent = c.artPlaceholder;
    }

    document.title = `${c.name} — SunnyChimera`;

    root.querySelectorAll(".dossier__meta h2").forEach((h2) => {
      h2.textContent = t("dossier.sound", "Sound of the world", "Звук мира");
    });

    const input = root.querySelector(".chat__input");
    if (input) {
      input.placeholder =
        c.askHint ||
        t("chat.askPlaceholder", "Ask…", "Спроси…");
    }
    const send = root.querySelector(".chat__send");
    if (send) send.textContent = t("chat.send", "Send", "Отправить");

    const bubble = root.querySelector(".chat__bubble[data-i18n]");
    if (bubble && opening) {
      // Prefer live opening (chapter-aware for Weaver) so EN/RU match story-meta
      bubble.textContent = String(opening || "")
        .replace(/^[«»"„“”]+|[«»"„“”]+$/g, "")
        .trim();
    }
  }

  function renderTracks() {
    const tracksEl = root.querySelector("[data-dossier-tracks]");
    if (!tracksEl) return;

    tracksEl.replaceChildren();
    const all = character.tracks || [];
    if (!all.length) {
      const p = document.createElement("p");
      p.className = "dossier__empty";
      p.textContent = t("dossier.noTracks", "No tracks yet.", "Треков пока нет.");
      tracksEl.appendChild(p);
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "dossier__tracks";
    all.forEach((tr) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = tr.href || `sound.html#sound-${character.soundId}`;
      a.textContent = tr.title || t("dossier.track", "Track", "Трек");
      if (tr.href && tr.href !== "#") {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      } else {
        a.href = `sound.html#sound-${character.soundId}`;
      }
      li.appendChild(a);
      ul.appendChild(li);
    });
    tracksEl.appendChild(ul);
  }

  function refresh() {
    hydrateCopy();
    renderTracks();
  }

  refresh();
  document.addEventListener("sunnychimera:i18n-ready", refresh);
})();
