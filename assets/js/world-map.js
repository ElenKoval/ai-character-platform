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

  /* Hanging Threads: left 10–36%, right 65–71%; height 20–64% of map. */
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
    threadPath(0.655, 0.668, 1.5),
    threadPath(0.68, 0.695, 2.8),
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
    garden: {
      line: "Нить не была судьбой, она просто росла.",
      pages: ["dream", "pak", "liora", "crystal", "cat"],
    },
    forest: {
      line: "Всё, от чего тебя спасли, до сих пор живёт во мне.",
      pages: ["weaver", "shiny", "shinyBro", "mushroom", "forest"],
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

  function pageCard(id) {
    const album = window.storyMeta?.album || [];
    const entry = album.find((a) => a.id === id);
    const ch = window.storyMeta?.characters?.[id];
    const name = entry?.name || ch?.name || id;
    const img = entry?.img || ch?.img || "";
    const a = document.createElement("a");
    a.className = "world-map__page";
    a.href = albumHref(id);
    a.innerHTML = `
      <div class="notebook-page">
        <div class="notebook-page__spiral" aria-hidden="true"></div>
        <img class="notebook-page__img" src="${img}" alt="${name}" loading="lazy" width="200" height="260">
      </div>
      <span class="world-map__page-name">${name}</span>
    `;
    return a;
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
      data.pages.forEach((id) => row.appendChild(pageCard(id)));
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
