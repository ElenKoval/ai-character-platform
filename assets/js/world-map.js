/* Interactive world map: hover / lock regions, steel Threads in the Garden. */
(() => {
  const root = document.querySelector("[data-world-map]");
  if (!root) return;

  const base = window.storyMeta?.base || "";
  const stage = root.querySelector("[data-world-map-stage]");
  const panel = root.querySelector("[data-world-map-panel]");
  const hits = [...root.querySelectorAll("[data-region]")];
  let locked = "";
  let hover = "";

  /* Hanging Threads: left 10–36%; height 20–64% of map. */
  function threadPath(x0, x1, seed) {
    const top = 0.2;
    const bot = 0.64;
    const pts = [];
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const y = top + (bot - top) * t;
      const sway =
        Math.sin(t * 9 + seed) * 0.012 +
        Math.sin(t * 17 + seed * 1.7) * 0.006;
      const x = x0 + (x1 - x0) * (0.15 + 0.7 * t) + sway;
      pts.push(`${i ? "L" : "M"}${(x * 2400).toFixed(1)} ${(y * 1500).toFixed(1)}`);
    }
    return pts.join(" ");
  }

  const strands = [
    threadPath(0.11, 0.14, 0.4),
    threadPath(0.17, 0.2, 1.1),
    threadPath(0.23, 0.26, 2.2),
    threadPath(0.29, 0.33, 0.8),
  ];

  function paintThreads() {
    const svg = root.querySelector("[data-world-map-threads]");
    if (!svg) return;
    const layers = ["aura", "shadow", "body", "core", "shine"];
    const g = svg.querySelector("[data-world-map-strand-root]");
    if (!g) return;
    g.replaceChildren();
    for (const d of strands) {
      for (const layer of layers) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", `thread-${layer}`);
        path.setAttribute("d", d);
        g.appendChild(path);
      }
    }
  }

  const regions = {
    tree: {
      line: "Дриада спит у корней мира.",
      pages: [
        {
          id: "dryad",
          noteHtml:
            'Дриада спит. <a href="' +
            `${base}pages/talk.html?c=keeper` +
            '">Спроси Кипера</a>.',
        },
        { id: "keeper", talk: true },
      ],
    },
    garden: {
      line: "Нить не была судьбой, она просто росла.",
      pages: [
        { id: "dream", talk: true },
        { id: "pak", talk: true },
        { id: "liora", talk: true },
        { id: "crystal", talk: true },
        { id: "cat", talk: true },
      ],
    },
    forest: {
      line: "Всё, от чего тебя спасли, до сих пор живёт во мне...",
      pages: [
        { id: "weaver", talk: true },
        { id: "shiny", talk: true },
        { id: "shinyBro", talk: true },
        { id: "mushroom", talk: true },
        { id: "forest", talk: true },
      ],
      enter: { href: `${base}pages/angry_forest.html`, label: "Войти в Лес" },
    },
    wasteland: {
      line: "Там не было ничего.",
      art: `${base}assets/img/The_fallow.jpeg`,
      artAlt: "Пустошь",
    },
  };

  function albumHref(id) {
    return `${base}pages/album.html#${encodeURIComponent(id)}`;
  }

  function talkHref(id) {
    const entry = (window.storyMeta?.album || []).find((a) => a.id === id);
    const talkId = entry?.talkId || id;
    return `${base}pages/talk.html?c=${encodeURIComponent(talkId)}`;
  }

  function pageCard(spec) {
    const id = typeof spec === "string" ? spec : spec.id;
    const opts = typeof spec === "string" ? {} : spec;
    const album = window.storyMeta?.album || [];
    const entry = album.find((a) => a.id === id);
    const ch = window.storyMeta?.characters?.[id];
    const name = entry?.name || ch?.name || id;
    const img = entry?.img || ch?.img || "";

    const card = document.createElement("div");
    card.className = "world-map__page";

    const artLink = document.createElement("a");
    artLink.href = albumHref(id);
    artLink.setAttribute("aria-label", name);
    artLink.innerHTML = `
      <div class="notebook-page">
        <div class="notebook-page__spiral" aria-hidden="true"></div>
        <img class="notebook-page__img" src="${img}" alt="${name}" loading="lazy" width="200" height="260">
      </div>
      <span class="world-map__page-name">${name}</span>
    `;
    card.appendChild(artLink);

    if (opts.noteHtml) {
      const note = document.createElement("span");
      note.className = "world-map__page-note";
      note.innerHTML = opts.noteHtml;
      card.appendChild(note);
    } else if (opts.talk && (entry?.talkId || ch)) {
      const talk = document.createElement("a");
      talk.className = "world-map__page-talk";
      talk.href = talkHref(id);
      talk.textContent = "Поговорить";
      card.appendChild(talk);
    }

    return card;
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

    if (data.pages) {
      const row = document.createElement("div");
      row.className = "world-map__pages";
      data.pages.forEach((spec) => row.appendChild(pageCard(spec)));
      inner.appendChild(row);
    }
    if (data.enter) {
      const link = document.createElement("a");
      link.className = "world-map__enter";
      link.href = data.enter.href;
      link.textContent = data.enter.label;
      inner.appendChild(link);
    }
    if (data.art) {
      const wrap = document.createElement("div");
      wrap.className = "world-map__wasteland-art";
      wrap.innerHTML = `
        <div class="notebook-page">
          <div class="notebook-page__spiral" aria-hidden="true"></div>
          <img class="notebook-page__img" src="${data.art}" alt="${data.artAlt || ""}" loading="lazy">
        </div>
      `;
      inner.appendChild(wrap);
    }
    panel.replaceChildren(inner);
  }

  function setFocus(key) {
    root.classList.toggle("is-focusing", Boolean(key));
    root.classList.toggle("is-focus-garden", key === "garden");
    root.classList.toggle("is-focus-tree", key === "tree");
    root.classList.toggle("is-focus-wasteland", key === "wasteland");
    root.classList.toggle("is-focus-forest", key === "forest");
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
    btn.addEventListener("click", () => {
      locked = locked === key ? "" : key;
      sync();
    });
  });

  stage?.addEventListener("mouseleave", () => {
    hover = "";
    if (!locked) setFocus("");
  });

  paintThreads();
  sync();
})();
