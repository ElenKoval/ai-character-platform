/* Album: sectioned pages, alternating layout, lightbox. */
(() => {
  const root = document.querySelector("[data-album]");
  if (!root) return;

  const meta = window.storyMeta;
  if (!meta?.album?.length) return;

  const base = meta.base || "";
  const ribbon = root.querySelector("[data-album-ribbon]");
  if (!ribbon) return;

  const isRu = () =>
    window.SunnyLocale?.getLang?.() === "ru" || document.documentElement.lang === "ru";

  function t(key, en, ru) {
    return (
      window.SunnyI18n?.t?.(key) ||
      window.SunnyLocale?.t?.(key) ||
      (isRu() ? ru : en)
    );
  }

  let flatEntries = [];
  let lightboxIndex = 0;

  function ensureLightbox() {
    let box = document.querySelector("[data-album-lightbox]");
    if (box) return box;
    box = document.createElement("div");
    box.className = "album-lightbox";
    box.setAttribute("data-album-lightbox", "");
    box.hidden = true;
    box.innerHTML = `
      <button type="button" class="album-lightbox__close" data-album-lightbox-close aria-label="${t(
        "nav.close",
        "Close",
        "Закрыть"
      )}">×</button>
      <button type="button" class="album-lightbox__nav album-lightbox__nav--prev" data-album-lightbox-prev aria-label="${t(
        "album.prev",
        "Previous",
        "Назад"
      )}">‹</button>
      <figure class="album-lightbox__figure">
        <img class="album-lightbox__img" data-album-lightbox-img alt="">
        <figcaption class="album-lightbox__caption" data-album-lightbox-caption></figcaption>
      </figure>
      <button type="button" class="album-lightbox__nav album-lightbox__nav--next" data-album-lightbox-next aria-label="${t(
        "album.next",
        "Next",
        "Вперёд"
      )}">›</button>
    `;
    document.body.appendChild(box);

    const close = () => closeLightbox();
    box.addEventListener("click", (e) => {
      if (e.target === box || e.target.closest("[data-album-lightbox-close]")) close();
    });
    box.querySelector("[data-album-lightbox-prev]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      showLightbox(lightboxIndex - 1);
    });
    box.querySelector("[data-album-lightbox-next]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      showLightbox(lightboxIndex + 1);
    });
    box.querySelector("[data-album-lightbox-img]")?.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    let touchX = null;
    box.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.changedTouches?.[0]?.clientX ?? null;
      },
      { passive: true }
    );
    box.addEventListener(
      "touchend",
      (e) => {
        if (touchX == null) return;
        const x = e.changedTouches?.[0]?.clientX;
        if (x == null) return;
        const dx = x - touchX;
        touchX = null;
        if (Math.abs(dx) < 48) return;
        if (dx < 0) showLightbox(lightboxIndex + 1);
        else showLightbox(lightboxIndex - 1);
      },
      { passive: true }
    );

    document.addEventListener("keydown", (e) => {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") showLightbox(lightboxIndex + 1);
      else if (e.key === "ArrowLeft") showLightbox(lightboxIndex - 1);
    });

    return box;
  }

  function showLightbox(index) {
    if (!flatEntries.length) return;
    const n = flatEntries.length;
    lightboxIndex = ((index % n) + n) % n;
    const entry = flatEntries[lightboxIndex];
    const box = ensureLightbox();
    const img = box.querySelector("[data-album-lightbox-img]");
    const caption = box.querySelector("[data-album-lightbox-caption]");
    img.src = entry.img;
    img.alt = entry.name;
    img.classList.toggle("album-lightbox__img--mono", entry.id === "fallow");
    caption.textContent = entry.name;
    box.hidden = false;
    document.body.classList.add("album-lightbox-open");
  }

  function closeLightbox() {
    const box = document.querySelector("[data-album-lightbox]");
    if (!box) return;
    box.hidden = true;
    document.body.classList.remove("album-lightbox-open");
  }

  function renderEntry(entry, indexInSection, flatIndex) {
    const article = document.createElement("article");
    article.className =
      "album__page" + (indexInSection % 2 === 1 ? " album__page--flip" : "");
    article.id = entry.id;

    const talkHref = entry.talkId
      ? `${base}pages/talk.html?c=${encodeURIComponent(entry.talkId)}`
      : "";
    const monoClass = entry.id === "fallow" ? " album__img--mono" : "";

    article.innerHTML = `
      <button type="button" class="album__art" data-album-open="${flatIndex}" aria-label="${entry.name}">
        <img class="album__img${monoClass}" src="${entry.img}" alt="${entry.name}" loading="lazy">
      </button>
      <div class="album__meta">
        <h3 class="album__name">${entry.name}</h3>
        <p class="album__quote">${entry.quote || ""}</p>
        <div class="album__links"></div>
      </div>
    `;

    const links = article.querySelector(".album__links");
    if (talkHref) {
      const talk = document.createElement("a");
      talk.className = "album__link";
      talk.href = talkHref;
      talk.textContent = t("album.talk", "Talk", "Поговорить");
      links.appendChild(talk);
    }

    article.querySelector("[data-album-open]")?.addEventListener("click", () => {
      showLightbox(flatIndex);
    });

    return article;
  }

  function paint() {
    if (window.storyMeta?.applyLang) {
      window.storyMeta.applyLang(window.SunnyLocale?.getLang?.() || "en");
    }

    const heading = root.querySelector(".album__title");
    if (heading) {
      heading.textContent = t("album.heading", "Album", "Альбом");
    }
    document.title = t(
      "album.title",
      "Album — SunnyChimera",
      "Альбом — SunnyChimera"
    );

    const brand = document.querySelector("footer .brand");
    if (brand) {
      brand.textContent =
        window.SunnyLocale?.t?.("brand") ||
        window.SunnyI18n?.t?.("footer.brand") ||
        brand.textContent;
    }
    const part = document.querySelector("footer .footer-part");
    if (part) {
      part.textContent =
        window.SunnyLocale?.t?.("partOne") ||
        window.SunnyI18n?.t?.("footer.partOne") ||
        part.textContent;
    }
    const about = document.querySelector("footer > a[href*='about']");
    if (about) {
      about.textContent =
        window.SunnyLocale?.t?.("about") ||
        window.SunnyI18n?.t?.("footer.about") ||
        about.textContent;
    }
    const legal = document.querySelector(".footer-legal");
    if (legal) {
      legal.textContent =
        window.SunnyLocale?.t?.("legal") ||
        window.SunnyI18n?.t?.("footer.legal") ||
        legal.textContent;
    }

    const album = window.storyMeta?.album || meta.album;
    const byId = Object.fromEntries(album.map((e) => [e.id, e]));
    const sections =
      window.storyMeta?.albumSections ||
      meta.albumSections || [
        { id: "all", title: "", entryIds: album.map((e) => e.id) },
      ];

    flatEntries = [];
    const frag = document.createDocumentFragment();

    sections.forEach((section) => {
      const wrap = document.createElement("section");
      wrap.className = "album__section";
      wrap.setAttribute("data-album-section", section.id);

      if (section.title) {
        const h = document.createElement("h2");
        h.className = "album__section-title";
        h.textContent = section.title;
        wrap.appendChild(h);
      }

      (section.entryIds || []).forEach((id, i) => {
        const entry = byId[id];
        if (!entry) return;
        const flatIndex = flatEntries.length;
        flatEntries.push(entry);
        wrap.appendChild(renderEntry(entry, i, flatIndex));
      });

      frag.appendChild(wrap);
    });

    ribbon.replaceChildren(frag);
  }

  paint();
  document.addEventListener("sunnychimera:i18n-ready", paint);

  const hash = (location.hash || "").replace(/^#/, "");
  if (hash) {
    requestAnimationFrame(() => {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();
