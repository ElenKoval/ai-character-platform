/* Album ribbon: notebook pages with talk + chapter links. */
(() => {
  const root = document.querySelector("[data-album]");
  if (!root) return;

  const meta = window.storyMeta;
  const story = window.homepageStory;
  if (!meta?.album?.length) return;

  const base = meta.base || "";
  const ribbon = root.querySelector("[data-album-ribbon]");
  if (!ribbon) return;

  function chaptersFor(entry) {
    if (Array.isArray(entry.chapterIds)) return entry.chapterIds;
    const id = entry.id;
    return Object.entries(meta.chapters || {})
      .filter(([, ch]) => Array.isArray(ch.cast) && ch.cast.includes(id))
      .map(([key]) => key);
  }

  function chapterLabel(id) {
    const storyCh = story?.chapters?.find((c) => c.id === id);
    const info = meta.chapters?.[id];
    const toc = storyCh?.toc || storyCh?.title || id;
    if (info && info.num > 0) return `Глава ${info.num} · ${toc}`;
    if (info && info.num === 0) return toc;
    return toc;
  }

  function openChapter(id) {
    if (window.SunnyReader?.open) {
      window.SunnyReader.open(id);
      return;
    }
    window.location.href = `${base}index.html?read=${encodeURIComponent(id)}`;
  }

  function renderEntry(entry) {
    const section = document.createElement("article");
    section.className = "album__page";
    section.id = entry.id;

    const chapters = chaptersFor(entry);
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
        <ul class="album__chapters" hidden></ul>
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

    const where = document.createElement("button");
    where.type = "button";
    where.className = "album__link";
    where.textContent = "Где появляется";
    const list = section.querySelector(".album__chapters");
    where.addEventListener("click", () => {
      const open = list.hasAttribute("hidden");
      if (open) {
        list.removeAttribute("hidden");
        where.setAttribute("aria-expanded", "true");
      } else {
        list.setAttribute("hidden", "");
        where.setAttribute("aria-expanded", "false");
      }
    });
    where.setAttribute("aria-expanded", "false");
    links.appendChild(where);

    if (!chapters.length) {
      const empty = document.createElement("li");
      empty.className = "album__empty";
      empty.textContent = "Пока нет глав.";
      list.appendChild(empty);
    } else {
      chapters.forEach((id) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = chapterLabel(id);
        btn.addEventListener("click", () => openChapter(id));
        li.appendChild(btn);
        list.appendChild(li);
      });
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
