/**
 * Quiet AI / privacy note under chat inputs.
 * Link: Gemini API Terms of Service.
 */
(() => {
  const TERMS = "https://ai.google.dev/gemini-api/terms";

  function lang() {
    return window.SunnyLocale?.getLang?.() || (document.documentElement.lang === "ru" ? "ru" : "en");
  }

  function htmlFor(langCode) {
    if (langCode === "en") {
      return `Characters are answered by AI. Don’t write what you’re not ready to share with the <a href="${TERMS}" target="_blank" rel="noopener noreferrer">service</a>.`;
    }
    return `Персонажам отвечает ИИ. Не пиши то, чем не готов делиться с <a href="${TERMS}" target="_blank" rel="noopener noreferrer">сервисом</a>.`;
  }

  function mount(el) {
    if (!el) return;
    el.classList.add("ai-share-note");
    el.innerHTML = htmlFor(lang());
  }

  function paintAll() {
    document.querySelectorAll("[data-ai-share-note]").forEach(mount);
  }

  window.SunnyAiDisclaimer = { paint: paintAll, htmlFor, TERMS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", paintAll);
  } else {
    paintAll();
  }
  document.addEventListener("sunnychimera:i18n-ready", paintAll);
})();
