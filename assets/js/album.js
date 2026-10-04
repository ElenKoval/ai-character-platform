/* Album ribbon: notebook pages with talk links. */
(() => {
  const root = document.querySelector("[data-album]");
  if (!root) return;

  const meta = window.storyMeta;
  if (!meta?.album?.length) return;

  const base = meta.base || "";
  const ribbon = root.querySelector("[data-album-ribbon]");
  if (!ribbon) return;

  function renderEntry(entry) {
    const section = document.createElement("article");
    section.className = "album__page";
    section.id = entry.id;

    const talkHref = entry.talkId
      ? `${base}pages/talk.html?c=${encodeURIComponent(entry.talkId)}`
      : "";

    section.innerHTML = `
      <div class="notebook-page">
        <div class="notebook-page__spiral" aria-hidden="true"></div>
        <img class="notebook-page__img" src="${entry.img}" alt="${entry.name}" loading="lazy">
      </div>
      <div class="album__meta">
        <h2 class="album__name">${entry.name}</h2>
        <p class="album__quote">${entry.quote || ""}</p>
        <div class="album__links"></div>
      </div>
    `;

    const links = section.querySelector(".album__links");
    if (talkHref) {
      const talk = document.createElement("a");
      talk.className = "album__link";
      talk.href = talkHref;
      talk.textContent = "Поговорить";
      links.appendChild(talk);
    }

    return section;
  }

  ribbon.replaceChildren(...meta.album.map(renderEntry));

  const hash = (location.hash || "").replace(/^#/, "");
  if (hash) {
    const target = document.getElementById(hash);
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }
})();
