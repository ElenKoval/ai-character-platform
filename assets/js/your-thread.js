/* Your Thread: one desire → Dream & Weaver answer together → continue in normal talk. */
(() => {
  const root = document.querySelector("[data-yt]");
  if (!root) return;

  const STORAGE_KEY = "sunnychimera-scene-chats";
  const HISTORY_CAP = 40;

  const ask = root.querySelector("[data-yt-ask]");
  const reveal = root.querySelector("[data-yt-reveal]");
  const form = root.querySelector("[data-yt-form]");
  const input = root.querySelector("[data-yt-input]");
  const sayBtn = root.querySelector("[data-yt-say]");
  const desireEl = root.querySelector("[data-yt-desire]");
  const helpEl = root.querySelector("[data-yt-help]");
  const againBtn = root.querySelector("[data-yt-again]");
  const castEl = root.querySelector("[data-yt-cast]");
  const replyEls = {
    dream: root.querySelector('[data-yt-reply="dream"]'),
    weaver: root.querySelector('[data-yt-reply="weaver"]'),
  };
  const continueEls = {
    dream: root.querySelector('[data-yt-continue="dream"]'),
    weaver: root.querySelector('[data-yt-continue="weaver"]'),
  };

  const meta = window.storyMeta?.characters || {};
  const base = window.storyMeta?.base || "../";

  const SCENE_INSTRUCTION =
    "Человек назвал то, чего хочет слишком сильно. Ответь ему в 2–4 фразах, в своём характере: что ты сделал бы с этой Жаждой.\n\n" +
    "Если человек пишет, что хочет умереть, причинить себе вред или кому-то другому, или что ему угрожает опасность — ненадолго выйди из роли, ответь тепло и просто, без образов мира, и предложи обратиться к близкому человеку или на линию помощи.";

  const CRISIS_RE =
    /умереть|убить\s+себя|самоубий|суицид|покончить|вредить\s+себе|себе\s+вред|не\s+хочу\s+жить|хочу\s+смерти|kill\s+myself|suicide|end\s+my\s+life|hurt\s+myself|self[-\s]?harm|want\s+to\s+die/i;

  let loading = false;
  let desireText = "";
  let replies = { dream: "", weaver: "" };
  let typeTimers = [];

  function apiBase() {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return window.location.origin;
    if (window.location.protocol === "file:") return "https://ai-character-platform.onrender.com";
    return window.location.origin;
  }

  function isCrisis(text) {
    return CRISIS_RE.test(text || "");
  }

  function formatReply(text) {
    const t = (text || "").replace(/[«»"„“”]/g, "").replace(/\s+/g, " ").trim();
    if (!t) return "— …";
    return t.startsWith("—") || t.startsWith("–") ? t : `— ${t}`;
  }

  function paintCord() {
    const svg = root.querySelector("[data-yt-cord]");
    const g = svg?.querySelector("[data-yt-cord-paths]");
    if (!svg || !g) return;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    if (mobile) {
      svg.setAttribute("viewBox", "0 0 400 40");
      const d = "M20 20 C80 8 140 32 200 20 S320 6 380 20";
      g.replaceChildren();
      ["aura", "shadow", "body", "core", "shine"].forEach((layer) => {
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("class", `thread-${layer}`);
        p.setAttribute("d", d);
        g.appendChild(p);
      });
      return;
    }
    svg.setAttribute("viewBox", "0 0 40 400");
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const y = 12 + t * 376;
      const x = 20 + Math.sin(t * 11) * 1.4 + Math.sin(t * 23) * 0.7;
      pts.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    const d = pts.join(" ");
    g.replaceChildren();
    ["aura", "shadow", "body", "core", "shine"].forEach((layer) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("class", `thread-${layer}`);
      p.setAttribute("d", d);
      g.appendChild(p);
    });
  }

  function clearTyping() {
    typeTimers.forEach((id) => clearTimeout(id));
    typeTimers = [];
  }

  function typeWords(el, full, pace, onDone) {
    if (!el) return;
    const text = formatReply(full);
    const words = text.split(/(\s+)/);
    el.textContent = "";
    let i = 0;
    const step = () => {
      if (i >= words.length) {
        onDone?.();
        return;
      }
      el.textContent += words[i];
      i += 1;
      const delay = Math.max(28, Number(pace) || 70);
      typeTimers.push(window.setTimeout(step, delay));
    };
    step();
  }

  async function askCharacter(apiId, message) {
    const res = await fetch(apiBase() + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: [],
        provider: "auto",
        character: apiId,
        systemExtra: SCENE_INSTRUCTION,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : "Ошибка сервера");
    }
    return (data.text || "").trim() || "…";
  }

  function saveTalkHistory(characterKey, desire, reply) {
    const c = meta[characterKey];
    const chatId = (c && (c.id || c.apiId)) || characterKey;
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      all[chatId] = [
        { role: "user", text: desire },
        { role: "model", text: reply },
      ].slice(-HISTORY_CAP);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  function showAsk() {
    clearTyping();
    loading = false;
    desireText = "";
    replies = { dream: "", weaver: "" };
    ask.hidden = false;
    reveal.hidden = true;
    helpEl.hidden = true;
    desireEl.textContent = "";
    replyEls.dream.textContent = "";
    replyEls.weaver.textContent = "";
    continueEls.dream.hidden = true;
    continueEls.weaver.hidden = true;
    sayBtn.disabled = false;
    input.value = "";
    input.focus();
  }

  async function runDesire(raw) {
    const desire = (raw || "").trim().slice(0, 200);
    if (!desire || loading) return;
    loading = true;
    desireText = desire;
    sayBtn.disabled = true;
    ask.hidden = true;
    reveal.hidden = false;
    desireEl.textContent = desire;
    helpEl.hidden = !isCrisis(desire);
    replyEls.dream.textContent = "…";
    replyEls.weaver.textContent = "…";
    continueEls.dream.hidden = true;
    continueEls.weaver.hidden = true;
    paintCord();

    const dreamApi = meta.dream?.apiId || "dream";
    const weaverApi = meta.weaver?.apiId || "weaver";

    try {
      const [dreamReply, weaverReply] = await Promise.all([
        askCharacter(dreamApi, desire),
        askCharacter(weaverApi, desire),
      ]);
      replies.dream = dreamReply;
      replies.weaver = weaverReply;

      clearTyping();
      let done = 0;
      const finishOne = (key) => {
        done += 1;
        continueEls[key].hidden = false;
        if (done >= 2) loading = false;
      };
      typeWords(replyEls.dream, dreamReply, meta.dream?.typePace || 95, () => finishOne("dream"));
      typeWords(replyEls.weaver, weaverReply, meta.weaver?.typePace || 42, () => finishOne("weaver"));
    } catch (err) {
      loading = false;
      const msg = err?.message || "Ошибка сети";
      replyEls.dream.textContent = formatReply(msg);
      replyEls.weaver.textContent = formatReply(msg);
      continueEls.dream.hidden = true;
      continueEls.weaver.hidden = true;
    }
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    runDesire(input.value);
  });

  againBtn?.addEventListener("click", showAsk);

  Object.entries(continueEls).forEach(([key, link]) => {
    link?.addEventListener("click", (e) => {
      e.preventDefault();
      if (!desireText || !replies[key]) return;
      saveTalkHistory(key, desireText, replies[key]);
      if (window.SunnyTalk?.captureReturn) window.SunnyTalk.captureReturn();
      window.location.href = `${base}pages/talk.html?c=${encodeURIComponent(key)}`;
    });
  });

  /* Cast row */
  const castOrder = [
    "dream",
    "weaver",
    "keeper",
    "pak",
    "liora",
    "crystal",
    "cat",
    "shiny",
    "shinyBro",
    "mushroom",
    "forest",
  ];
  if (castEl) {
    const label = document.createElement("span");
    label.className = "yt-cast__label";
    label.textContent = "Все персонажи";
    const frag = document.createDocumentFragment();
    frag.appendChild(label);
    let n = 0;
    castOrder.forEach((id) => {
      const c = meta[id];
      if (!c) return;
      if (n) {
        const dot = document.createElement("span");
        dot.className = "yt-cast__dot";
        dot.textContent = "·";
        frag.appendChild(dot);
      }
      const a = document.createElement("a");
      a.href = `${base}pages/talk.html?c=${encodeURIComponent(c.id || id)}`;
      a.textContent = id === "shinyBro" ? "Брат" : c.name;
      frag.appendChild(a);
      n += 1;
    });
    castEl.replaceChildren(frag);
  }

  paintCord();
  window.addEventListener("resize", paintCord);
  window.setTimeout(() => input?.focus(), 80);
})();
