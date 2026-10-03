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
  const c =
    meta[character] ||
    Object.values(meta).find((x) => x.apiId === character || x.id === character);

  function goTalk(seed) {
    if (window.SunnyTalk?.go) {
      window.SunnyTalk.go(character, { seed: seed || "" });
      return;
    }
    const base = /\/pages\//.test(location.pathname) ? "../" : "";
    window.location.href = `${base}pages/talk.html?c=${encodeURIComponent(character)}`;
  }

  function talkLabel() {
    if (!c) return "Поговорить";
    const form = c.nameWith || c.name;
    const prep = /^[сзшжСЗШЖ][^аеёиоуыэюяАЕЁИОУЫЭЮЯ]/.test(form) ? "со" : "с";
    return `Поговорить ${prep} ${form}`;
  }

  if (panel) {
    panel.classList.add("character-chat--scene-entry");
    panel.innerHTML = "";
    const link = document.createElement("a");
    link.className = "dossier__scene-talk";
    link.href = window.SunnyTalk?.talkUrl?.(character) || `talk.html?c=${encodeURIComponent(character)}`;
    link.textContent = talkLabel();
    link.addEventListener("click", (e) => {
      e.preventDefault();
      goTalk();
    });
    panel.appendChild(link);
    if (c?.askHint) {
      const hint = document.createElement("p");
      hint.className = "dossier__scene-hint";
      hint.textContent = c.askHint;
      panel.appendChild(hint);
    }
  }

  document.addEventListener("click", (e) => {
    const talk = e.target.closest("[data-talk]");
    if (!talk || !document.contains(talk)) return;
    e.preventDefault();
    goTalk();
  });
})();
