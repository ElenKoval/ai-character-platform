/**
 * world.html: Keeper talk → dedicated talk page.
 */
(function () {
  const keeperChat = document.querySelector(".world-history__chat--keeper .chat");
  if (!keeperChat) return;

  const panel = keeperChat.closest(".world-history__chat") || keeperChat;
  const form = keeperChat.querySelector(".chat__form");
  const input = keeperChat.querySelector(".chat__input");

  function goTalk(seed) {
    if (window.SunnyTalk?.go) {
      window.SunnyTalk.go("keeper", { seed: seed || "" });
      return;
    }
    const base = /\/pages\//.test(location.pathname) ? "../" : "";
    window.location.href = `${base}pages/talk.html?c=keeper`;
  }

  if (form) {
    form.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const text = (input && input.value.trim()) || "";
        if (input) input.value = "";
        goTalk(text);
      },
      true
    );
  }

  const entry = document.createElement("a");
  entry.className = "dossier__scene-talk";
  entry.href = window.SunnyTalk?.talkUrl?.("keeper") || "talk.html?c=keeper";
  entry.textContent = "Поговорить с Кипером";
  entry.addEventListener("click", function (e) {
    e.preventDefault();
    goTalk();
  });
  panel.insertBefore(entry, keeperChat);
})();
