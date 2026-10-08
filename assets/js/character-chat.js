/**
 * Character page → dedicated talk page.
 */
(function () {
  const chatContainer = document.querySelector(".chat[data-character]");
  if (!chatContainer) return;

  const character =
    chatContainer.getAttribute("data-character") ||
    document.querySelector("[data-dossier]")?.getAttribute("data-dossier") ||
    "weaver";

  const panel = chatContainer.closest(".character-chat") || chatContainer.closest(".dossier__chat");
  const meta = window.storyMeta?.characters || {};

  function lang() {
    return window.SunnyLocale?.getLang?.() || (document.documentElement.lang === "ru" ? "ru" : "en");
  }

  function resolve() {
    window.storyMeta?.applyLang?.(lang());
    const chars = window.storyMeta?.characters || meta;
    return (
      chars[character] ||
      Object.values(chars).find(
        (x) => x.apiId === character || x.id === character || x.soundId === character
      ) ||
      null
    );
  }

  function talkLabel(c) {
    if (!c) return lang() === "ru" ? "Поговорить" : "Talk";
    const form = c.nameWith || c.name;
    if (lang() !== "ru") {
      return window.SunnyLocale?.t?.("talkWith", { name: c.name || form }) || `Talk with ${c.name || form}`;
    }
    const prep = /^[сзшжСЗШЖ][^аеёиоуыэюяАЕЁИОУЫЭЮЯ]/.test(form) ? "со" : "с";
    return `Поговорить ${prep} ${form}`;
  }

  function goTalk(seed) {
    if (window.SunnyTalk?.go) {
      window.SunnyTalk.go(character, { seed: seed || "" });
      return;
    }
    const base = /\/pages\//.test(location.pathname) ? "../" : "";
    window.location.href = `${base}pages/talk.html?c=${encodeURIComponent(character)}`;
  }

  function renderEntry() {
    if (!panel) return;
    const c = resolve();
    panel.classList.add("character-chat--scene-entry");
    panel.innerHTML = "";
    const link = document.createElement("a");
    link.className = "dossier__scene-talk";
    link.href = window.SunnyTalk?.talkUrl?.(character) || `talk.html?c=${encodeURIComponent(character)}`;
    link.textContent = talkLabel(c);
    link.addEventListener("click", (e) => {
      e.preventDefault();
      goTalk();
    });
    panel.appendChild(link);
  }

  renderEntry();
  document.addEventListener("sunnychimera:i18n-ready", renderEntry);

  document.addEventListener("click", (e) => {
    const talk = e.target.closest("[data-talk]");
    if (!talk || !document.contains(talk)) return;
    e.preventDefault();
    goTalk();
  });
})();
