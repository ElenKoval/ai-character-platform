/**
 * Hydrate character dossier: chapters + tracks from storyMeta / homepageStory.
 */
(() => {
  const root = document.querySelector("[data-dossier]");
  if (!root) return;

  const meta = window.storyMeta;
  const story = window.homepageStory;
  if (!meta?.characters || !story?.chapters) return;

  const charId = root.dataset.dossier;
  const character = meta.characters[charId];
  if (!character) return;

  const chaptersEl = root.querySelector("[data-dossier-chapters]");
  const tracksEl = root.querySelector("[data-dossier-tracks]");

  const appears = story.chapters.filter((ch) => {
    const cast = meta.chapters?.[ch.id]?.cast || [];
    return cast.includes(charId);
  });

  if (chaptersEl) {
    chaptersEl.replaceChildren();
    if (!appears.length) {
      const p = document.createElement("p");
      p.className = "dossier__empty";
      p.textContent = "Пока нет глав.";
      chaptersEl.appendChild(p);
    } else {
      const ul = document.createElement("ul");
      ul.className = "dossier__chapters";
      appears.forEach((ch) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        const info = meta.chapters?.[ch.id];
        const num = info && info.num > 0 ? `Глава ${info.num} · ` : "";
        btn.textContent = `${num}${ch.toc || ch.title}`;
        btn.addEventListener("click", () => {
          if (window.SunnyReader?.open) window.SunnyReader.open(ch.id);
          else window.location.href = `${meta.base}index.html?read=${encodeURIComponent(ch.id)}`;
        });
        li.appendChild(btn);
        ul.appendChild(li);
      });
      chaptersEl.appendChild(ul);
    }
  }

  if (tracksEl) {
    tracksEl.replaceChildren();
    const all = character.tracks || [];
    if (!all.length) {
      const p = document.createElement("p");
      p.className = "dossier__empty";
      p.textContent = "Треков пока нет.";
      tracksEl.appendChild(p);
    } else {
      const ul = document.createElement("ul");
      ul.className = "dossier__tracks";
      all.forEach((t) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = t.href || `sound.html#sound-${character.soundId}`;
        a.textContent = t.title || "Трек";
        if (t.href && t.href !== "#") {
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
  }
})();
