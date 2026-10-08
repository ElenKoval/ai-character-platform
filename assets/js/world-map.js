/* Interactive world map + region-linked album gallery. */
(() => {
  const root = document.querySelector("[data-world-map]");
  if (!root) return;

  const base = window.storyMeta?.base || "";
  const stage = root.querySelector("[data-world-map-stage]");
  const panel = root.querySelector("[data-world-map-panel]");
  const captionName = root.querySelector("[data-wm-name]");
  const captionLine = root.querySelector("[data-wm-line]");
  const captionHint = root.querySelector("[data-wm-hint]");
  const galleryRoot = document.querySelector("[data-album-strip]");
  const galleryTitle = document.querySelector("#album-strip-title");
  const hits = [...root.querySelectorAll("[data-region]")];
  let locked = "";
  let hover = "";
  let galleryRegion = "";
  let galleryTimer = 0;

  function lang() {
    return window.SunnyLocale?.getLang?.() || "en";
  }

  function tt(key, vars) {
    let v = window.SunnyI18n?.t?.(key) || "";
    if (!v && window.SunnyLocale?.t) v = window.SunnyLocale.t(key, vars) || "";
    if (v && vars) {
      Object.keys(vars).forEach((k) => {
        v = v.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
      });
    }
    return v;
  }

  /** Characters associated with a map region (not “inhabitants”). */
  const REGION_CHARACTERS = {
    tree: ["dryad", "keeper"],
    garden: ["dream", "pak", "liora", "crystal", "cat"],
    forest: ["weaver", "shiny", "shinyBro", "mushroom", "forest"],
    wasteland: ["fallow"],
  };

  const DEFAULT_GALLERY = ["dream", "weaver", "keeper", "forest"];

  function buildRegions() {
    const isRu = lang() === "ru";
    return {
      tree: {
        name: tt("map.tree") || (isRu ? "Дерево Дриады" : "Dryad's Tree"),
        line: tt("map.treeCaption") || (isRu ? "Дриада была первой." : "The Dryad was first."),
      },
      garden: {
        name: tt("map.garden") || (isRu ? "Сад" : "Garden"),
        line:
          tt("map.gardenCaption") ||
          (isRu
            ? "Нить не была судьбой, она просто росла."
            : "A Thread was not fate; it simply grew."),
      },
      forest: {
        name: tt("map.forest") || (isRu ? "Злой Лес" : "Angry Forest"),
        line:
          tt("map.forestCaption") ||
          (isRu
            ? "Всё, от чего тебя спасли, до сих пор живёт во мне."
            : "Everything they saved you from still lives in me."),
      },
      wasteland: {
        name: tt("map.wasteland") || (isRu ? "Пустошь" : "Wasteland"),
        line:
          tt("map.wastelandCaption") ||
          (isRu ? "Там не было ничего." : "There was nothing there."),
      },
    };
  }

  let regions = buildRegions();

  function albumHref(id) {
    return `${base}pages/album.html#${encodeURIComponent(id)}`;
  }

  function talkHref(id) {
    const entry = (window.storyMeta?.album || []).find((a) => a.id === id);
    const talkId = entry?.talkId || id;
    return `${base}pages/talk.html?c=${encodeURIComponent(talkId)}`;
  }

  function albumEntry(id) {
    const album = window.storyMeta?.album || [];
    const entry = album.find((a) => a.id === id);
    const ch = window.storyMeta?.characters?.[id];
    return {
      id,
      name: entry?.name || ch?.name || id,
      img: entry?.img || ch?.img || "",
      talkId: entry?.talkId || null,
    };
  }

  function updateCaption(key) {
    const data = key ? regions[key] : null;
    if (captionName) captionName.textContent = data?.name || "";
    // Hover caption shows only the region name — phrase stays in the panel.
    if (captionLine) captionLine.textContent = "";
    if (captionHint) {
      captionHint.textContent =
        tt("map.hint") ||
        tt("home.mapHint") ||
        (lang() === "ru" ? "Проведи по миру" : "Trace the world");
    }
  }

  function renderPanel(key) {
    if (!panel) return;
    const data = regions[key];
    if (!data) {
      panel.hidden = true;
      panel.replaceChildren();
      return;
    }
    panel.hidden = false;
    const inner = document.createElement("div");
    inner.className = "world-map__panel-inner";

    const line = document.createElement("p");
    line.className = "world-map__line";
    line.textContent = data.line;
    inner.appendChild(line);

    panel.replaceChildren(inner);
  }

  function setGalleryTitle(regionKey) {
    if (!galleryTitle) return;
    const fromAlbum = tt("home.fromAlbum") || (lang() === "ru" ? "Из альбома" : "From the album");
    if (!regionKey || !regions[regionKey]) {
      galleryTitle.textContent = fromAlbum;
      return;
    }
    const name = regions[regionKey].name;
    const templ =
      tt("home.fromAlbumRegion", { name }) ||
      (lang() === "ru" ? `Из альбома · ${name}` : `From the album · ${name}`);
    galleryTitle.textContent = templ.includes("{name}")
      ? templ.replace("{name}", name)
      : templ;
  }

  function buildGalleryCard(id) {
    const entry = albumEntry(id);
    const card = document.createElement("article");
    card.className = "album-strip__card";

    const art = document.createElement("a");
    art.className = "album-strip__art";
    art.href = albumHref(id);
    art.setAttribute("aria-label", entry.name);
    const monoClass = id === "fallow" ? " album-strip__img--mono" : "";
    art.innerHTML = `<img class="album-strip__img${monoClass}" src="${entry.img}" alt="${entry.name}" loading="lazy">`;
    card.appendChild(art);

    const meta = document.createElement("div");
    meta.className = "album-strip__meta";

    const name = document.createElement("p");
    name.className = "album-strip__name";
    name.textContent = entry.name;
    meta.appendChild(name);

    if (entry.talkId) {
      const talk = document.createElement("a");
      talk.className = "album-strip__talk";
      talk.href = talkHref(id);
      talk.textContent =
        tt("album.talk") || (lang() === "ru" ? "Поговорить" : "Talk");
      meta.appendChild(talk);
    }

    card.appendChild(meta);
    return card;
  }

  function renderGallery(regionKey, { animate = true } = {}) {
    if (!galleryRoot) return;
    const ids = regionKey
      ? REGION_CHARACTERS[regionKey] || DEFAULT_GALLERY
      : DEFAULT_GALLERY;
    galleryRegion = regionKey || "";

    const paint = () => {
      setGalleryTitle(regionKey || "");
      galleryRoot.replaceChildren(...ids.map(buildGalleryCard));
      galleryRoot.dataset.region = regionKey || "default";
      galleryRoot.classList.remove("is-fading");
    };

    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint();
      return;
    }

    galleryRoot.classList.add("is-fading");
    clearTimeout(galleryTimer);
    galleryTimer = window.setTimeout(paint, 180);
  }

  function setFocus(key) {
    root.classList.toggle("is-focusing", Boolean(key));
    root.classList.toggle("is-focus-garden", key === "garden");
    root.classList.toggle("is-focus-tree", key === "tree");
    root.classList.toggle("is-focus-wasteland", key === "wasteland");
    root.classList.toggle("is-focus-forest", key === "forest");
    updateCaption(key);
  }

  function sync() {
    const key = locked || hover;
    setFocus(key);
    if (locked) renderPanel(locked);
    else {
      panel.hidden = true;
      panel.replaceChildren();
    }
    hits.forEach((btn) => {
      const on = btn.dataset.region === locked;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      const r = regions[btn.dataset.region];
      if (r?.name) btn.setAttribute("aria-label", r.name);
    });
  }

  hits.forEach((btn) => {
    const key = btn.dataset.region;
    btn.addEventListener("mouseenter", () => {
      hover = key;
      setFocus(key);
    });
    btn.addEventListener("mouseleave", () => {
      hover = "";
      setFocus(locked || "");
    });
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Re-clicking the selected region does nothing.
      if (locked === key) return;
      locked = key;
      sync();
      renderGallery(key);
    });
  });

  stage?.addEventListener("click", (e) => {
    if (e.target.closest("[data-region]")) return;
    if (!locked) return;
    locked = "";
    sync();
    renderGallery("");
  });

  stage?.addEventListener("mouseleave", () => {
    hover = "";
    if (!locked) setFocus("");
  });

  function refreshLocale() {
    regions = buildRegions();
    sync();
    renderGallery(galleryRegion, { animate: false });
  }

  document.addEventListener("sunnychimera:i18n-ready", refreshLocale);
  sync();
  renderGallery("", { animate: false });
})();
