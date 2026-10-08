/* Your Thread: one desire → Dream & Weaver → optional crew asks → continue in talk. */
(() => {
  const root = document.querySelector("[data-yt]");
  if (!root) return;

  const STORAGE_KEY = "sunnychimera-scene-chats";
  const HISTORY_CAP = 40;

  /** Must match talk-page.js — chats are scoped by UI language. */
  function storageKey() {
    const code = window.SunnyLocale?.getLang?.() || "en";
    return STORAGE_KEY + ":" + code;
  }

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
  const retryEls = {
    dream: root.querySelector('[data-yt-retry="dream"]'),
    weaver: root.querySelector('[data-yt-retry="weaver"]'),
  };
  const crewHosts = {
    dream: root.querySelector('[data-yt-crew-replies="dream"]'),
    weaver: root.querySelector('[data-yt-crew-replies="weaver"]'),
    keeper: root.querySelector('[data-yt-crew-replies="keeper"]'),
  };

  const meta = window.storyMeta?.characters || {};
  const base = window.storyMeta?.base || "../";

  const lang = () => window.SunnyLocale?.getLang?.() || "en";
  /** JSON dictionary when loaded, else sync SunnyLocale flat keys (thread.say → threadSay). */
  const tt = (key) => {
    const fromJson = window.SunnyI18n?.t?.(key);
    if (fromJson) return fromJson;
    const L = window.SunnyLocale;
    if (!L?.t) return "";
    const camel = key
      .split(".")
      .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
      .join("");
    const v = L.t(camel);
    return v && v !== camel ? v : "";
  };

  function sceneInstruction() {
    return lang() === "ru"
      ? "Человек назвал то, чего хочет слишком сильно. Ответь ему в 2–4 фразах, в своём характере: что ты сделал бы с этой Жаждой. Отвечай по-русски.\n\n" +
          "Если человек пишет, что хочет умереть, причинить себе вред или кому-то другому, или что ему угрожает опасность — ненадолго выйди из роли, ответь тепло и просто, без образов мира, и предложи обратиться к близкому человеку или на линию помощи."
      : "A person named what they want too much. Answer in 2–4 sentences, in character: what you would do with this Thirst. Reply in English.\n\n" +
          "If they write about wanting to die, harm themselves or someone else, or being in danger — briefly step out of character, answer warmly and simply, without world imagery, and suggest reaching a trusted person or a helpline.";
  }

  function crewInstruction() {
    return lang() === "ru"
      ? "Человек назвал то, чего хочет слишком сильно. Ответь ему коротко — в 1–3 фразах, в своём характере: что ты сделал бы с этой Жаждой. Отвечай по-русски.\n\n" +
          "Если человек пишет, что хочет умереть, причинить себе вред или кому-то другому, или что ему угрожает опасность — ненадолго выйди из роли, ответь тепло и просто, без образов мира, и предложи обратиться к близкому человеку или на линию помощи."
      : "A person named what they want too much. Answer briefly — 1–3 sentences, in character: what you would do with this Thirst. Reply in English.\n\n" +
          "If they write about wanting to die, harm themselves or someone else, or being in danger — briefly step out of character, answer warmly and simply, without world imagery, and suggest reaching a trusted person or a helpline.";
  }

  const CRISIS_RE =
    /умереть|убить\s+себя|самоубий|суицид|покончить|вредить\s+себе|себе\s+вред|не\s+хочу\s+жить|хочу\s+смерти|kill\s+myself|suicide|end\s+my\s+life|hurt\s+myself|self[-\s]?harm|want\s+to\s+die/i;

  const CREW_SIDE = {
    pak: "dream",
    liora: "dream",
    crystal: "dream",
    cat: "dream",
    shiny: "weaver",
    shinyBro: "weaver",
    mushroom: "weaver",
    forest: "weaver",
    keeper: "keeper",
  };

  const DISPLAY_NAME = {
    ru: {
      pak: "Пак",
      liora: "Лиора",
      crystal: "Кристалл",
      cat: "Кот",
      shiny: "Шайни",
      shinyBro: "Брат",
      mushroom: "Гриб",
      forest: "Злой Лес",
      keeper: "Кипер",
    },
    en: {
      pak: "Pak",
      liora: "Liora",
      crystal: "Crystal",
      cat: "Cat",
      shiny: "Shiny",
      shinyBro: "Brother",
      mushroom: "Mushroom",
      forest: "Angry Forest",
      keeper: "Kiper",
    },
  };

  function continueWith(key) {
    const name = displayName(key);
    if (lang() === "ru") {
      const map = {
        dream: "Продолжить с Дримом",
        weaver: "Продолжить с Вивер",
        pak: "Продолжить с Паком",
        liora: "Продолжить с Лиорой",
        crystal: "Продолжить с Кристаллом",
        cat: "Продолжить с Котом",
        shiny: "Продолжить с Шайни",
        shinyBro: "Продолжить с Братом",
        mushroom: "Продолжить с Грибом",
        forest: "Продолжить со Злым Лесом",
        keeper: "Продолжить с Кипером",
      };
      return map[key] || `Продолжить с ${name}`;
    }
    return `Continue with ${name}`;
  }

  let loading = false;
  let desireText = "";
  let replies = { dream: "", weaver: "" };
  let errors = { dream: "", weaver: "" };
  let typeTimers = [];
  let pending = { dream: false, weaver: false };
  let crewAsked = new Set();
  let crewPending = new Set();
  let crewReplies = {};
  let crewCards = {};

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

  function waitPhrase(key) {
    return meta[key]?.waitPhrase || "…";
  }

  function displayName(key) {
    const table = DISPLAY_NAME[lang()] || DISPLAY_NAME.en;
    return table[key] || meta[key]?.name || key;
  }

  function applyUi() {
    document.title = tt("thread.title") || document.title;
    const epigraph = root.querySelector("[data-yt-epigraph]");
    const epigraphHtml = tt("thread.epigraphHtml");
    if (epigraph && epigraphHtml) epigraph.innerHTML = epigraphHtml;
    const title = root.querySelector(".yt-ask__title");
    if (title) title.textContent = tt("thread.askTitle") || title.textContent;
    if (input) input.placeholder = tt("thread.placeholder") || input.placeholder;
    if (sayBtn) sayBtn.textContent = tt("thread.say") || sayBtn.textContent;
    const dreamName = root.querySelector(".yt-name.yt-cell--dream");
    const weaverName = root.querySelector(".yt-name.yt-cell--weaver");
    if (dreamName) dreamName.textContent = tt("thread.dream") || displayName("dream");
    if (weaverName) weaverName.textContent = tt("thread.weaver") || displayName("weaver");
    if (continueEls.dream) continueEls.dream.textContent = continueWith("dream");
    if (continueEls.weaver) continueEls.weaver.textContent = continueWith("weaver");
    Object.values(retryEls).forEach((el) => {
      if (el) el.textContent = tt("thread.retry") || (lang() === "ru" ? "Повторить" : "Try again");
    });
    root.querySelectorAll("[data-i18n='thread.askMore']").forEach((el) => {
      el.textContent = tt("thread.askMore") || (lang() === "ru" ? "Спросить ещё:" : "Ask also:");
    });
    root.querySelectorAll(".yt-crew").forEach((crew) => {
      // Remove leftover bare text-node labels if a data-i18n span exists
      if (crew.querySelector("[data-i18n='thread.askMore']")) {
        crew.childNodes.forEach((node) => {
          if (node.nodeType === 3 && node.textContent.trim()) node.textContent = "";
        });
      } else {
        const first = crew.childNodes[0];
        if (first && first.nodeType === 3) {
          first.textContent =
            (tt("thread.askMore") || (lang() === "ru" ? "Спросить ещё:" : "Ask also:")) + " ";
        }
      }
    });
    const keeperAsk = root.querySelector("[data-yt-ask-char='keeper']");
    if (keeperAsk && keeperAsk.classList.contains("yt-keeper-ask")) {
      keeperAsk.textContent = tt("thread.askKeeper") || keeperAsk.textContent;
    }
    root.querySelectorAll("[data-yt-ask-char]").forEach((btn) => {
      const id = btn.getAttribute("data-yt-ask-char");
      if (id && id !== "keeper") btn.textContent = displayName(id);
      if (id === "keeper" && btn.classList.contains("yt-keeper-ask")) {
        btn.textContent = tt("thread.askKeeper") || btn.textContent;
      }
    });
    if (againBtn) againBtn.textContent = tt("thread.again") || againBtn.textContent;
    if (helpEl) {
      const link = helpEl.querySelector("a");
      const linkHtml = link ? link.outerHTML : "";
      helpEl.innerHTML =
        (tt("thread.crisis") || helpEl.textContent) + (linkHtml ? " " + linkHtml : "");
    }
    if (castEl) castEl.setAttribute("aria-label", tt("thread.castLabel") || castEl.getAttribute("aria-label"));
    document.documentElement.lang = lang();
  }

  function paintCord() {
    const svg = root.querySelector("[data-yt-cord]");
    const g = svg?.querySelector("[data-yt-cord-paths]");
    if (!svg || !g) return;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    g.replaceChildren();
    if (mobile) {
      svg.setAttribute("viewBox", "0 0 400 40");
      const d = "M12 20 C70 10 130 30 200 20 S330 8 388 20";
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
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      const y = 8 + t * 384;
      const x = 20 + Math.sin(t * 12) * 1.5 + Math.sin(t * 27) * 0.6;
      pts.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    const d = pts.join(" ");
    ["aura", "shadow", "body", "core", "shine"].forEach((layer) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("class", `thread-${layer}`);
      p.setAttribute("d", d);
      g.appendChild(p);
    });
  }

  function clearTyping(key) {
    if (key) {
      typeTimers = typeTimers.filter((t) => {
        if (t.key === key) {
          clearTimeout(t.id);
          return false;
        }
        return true;
      });
      return;
    }
    typeTimers.forEach((t) => clearTimeout(t.id));
    typeTimers = [];
  }

  function typeInto(el, key, full, pace, onDone) {
    if (!el) return;
    clearTyping(key);
    const text = formatReply(full);
    const words = text.split(/(\s+)/);
    el.classList.remove("is-wait", "is-error");
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
      const id = window.setTimeout(step, delay);
      typeTimers.push({ key, id });
    };
    step();
  }

  async function askCharacter(apiId, message, systemExtra, mode = "thread", provider = "auto") {
    const ctx = window.SunnyChatContext?.payload?.(mode) || {
      mode,
      readChapter: 0,
      currentChapter: 0,
    };
    const body = {
      message,
      history: [],
      provider,
      character: apiId,
      ...ctx,
    };
    // Legacy characters still use systemExtra; living hybrids use their own cores only.
    const hybridIds = new Set(["dream", "weaver", "pak", "drpak", "liora", "cat"]);
    if (systemExtra && !hybridIds.has(String(apiId || "").toLowerCase())) {
      body.systemExtra = systemExtra;
    }
    const res = await fetch(apiBase() + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = typeof data.error === "string" ? data.error : `HTTP ${res.status}`;
      const error = new Error(err);
      error.status = res.status;
      error.body = data;
      throw error;
    }
    return (data.text || "").trim() || "…";
  }

  function saveTalkHistory(characterKey, desire, reply) {
    const c = meta[characterKey];
    const chatId = (c && (c.id || c.apiId)) || characterKey;
    try {
      const key = storageKey();
      const all = JSON.parse(localStorage.getItem(key) || "{}");
      all[chatId] = [
        { role: "user", text: desire },
        { role: "model", text: reply },
      ].slice(-HISTORY_CAP);
      localStorage.setItem(key, JSON.stringify(all));
    } catch (e) {}
  }

  function goToTalk(characterKey) {
    const c = meta[characterKey];
    const talkId = (c && (c.id || characterKey)) || characterKey;
    if (window.SunnyTalk?.captureReturn) window.SunnyTalk.captureReturn();
    window.location.href = `${base}pages/talk.html?c=${encodeURIComponent(talkId)}`;
  }

  function setWaiting(key) {
    const el = replyEls[key];
    if (!el) return;
    el.classList.add("is-wait");
    el.classList.remove("is-error", "is-rate-limit");
    el.textContent = waitPhrase(key);
    continueEls[key].hidden = true;
    retryEls[key].hidden = true;
    if (retryEls[key]) {
      retryEls[key].textContent = tt("thread.retry") || (lang() === "ru" ? "Повторить" : "Try again");
    }
  }

  function setError(key, err) {
    errors[key] = err?.message || String(err || "unknown");
    console.error(`[your-thread] ${key} failed:`, err);
    const el = replyEls[key];
    if (!el) return;
    el.classList.remove("is-wait");
    el.classList.add("is-error");
    const body = err?.body || {};
    const isRate = err?.status === 429 || body.code === "rate_limit";
    if (isRate) {
      el.classList.add("is-rate-limit");
      const wait = waitPhrase(key) || body.waitPhrase || "…";
      const hint =
        body.retryHint ||
        tt("talk.retryLater") ||
        (lang() === "ru" ? "Попробуй ещё раз через минуту" : "Try again in a minute");
      el.replaceChildren();
      const w = document.createElement("span");
      w.className = "yt-rate-limit-wait";
      w.textContent = wait;
      el.appendChild(w);
      if (retryEls[key]) {
        retryEls[key].textContent = hint;
        retryEls[key].hidden = false;
      }
    } else {
      el.classList.remove("is-rate-limit");
      el.textContent =
        tt("thread.thinking") || (lang() === "ru" ? "Он задумался. Попробуй ещё раз" : "He is thinking. Try again");
      if (retryEls[key]) {
        retryEls[key].textContent = tt("thread.retry") || (lang() === "ru" ? "Повторить" : "Try again");
        retryEls[key].hidden = false;
      }
    }
    continueEls[key].hidden = true;
    replies[key] = "";
  }

  function syncLoading() {
    loading = pending.dream || pending.weaver || crewPending.size > 0;
    sayBtn.disabled = loading;
  }

  /**
   * Split providers for the parallel Dream/Weaver ask so both don't hit the
   * same Gemini free-tier slot (second call often 429 → Groq, which used to
   * truncate gpt-oss replies).
   */
  function threadProviderFor(key) {
    if (key === "dream") return "gemini";
    if (key === "weaver") return "groq";
    return "auto";
  }

  async function askOne(key) {
    const apiId = meta[key]?.apiId || key;
    pending[key] = true;
    syncLoading();
    setWaiting(key);
    clearTyping(key);
    try {
      const text = await askCharacter(
        apiId,
        desireText,
        sceneInstruction(),
        "thread",
        threadProviderFor(key)
      );
      replies[key] = text;
      errors[key] = "";
      // Show Continue as soon as the full reply is known (don't wait for typing).
      continueEls[key].hidden = false;
      retryEls[key].hidden = true;
      typeInto(replyEls[key], key, text, meta[key]?.typePace || 70);
    } catch (err) {
      setError(key, err);
    } finally {
      pending[key] = false;
      syncLoading();
    }
  }

  function markCrewUsed(key) {
    root.querySelectorAll(`[data-yt-ask-char="${key}"]`).forEach((btn) => {
      btn.classList.add("is-used");
      btn.setAttribute("aria-disabled", "true");
    });
  }

  function clearCrew() {
    Object.values(crewHosts).forEach((host) => host?.replaceChildren());
    root.querySelectorAll("[data-yt-ask-char]").forEach((btn) => {
      btn.classList.remove("is-used");
      btn.removeAttribute("aria-disabled");
    });
    crewAsked = new Set();
    crewPending = new Set();
    crewReplies = {};
    crewCards = {};
  }

  function makeCrewCard(key) {
    const side = CREW_SIDE[key];
    const host = crewHosts[side];
    if (!host) return null;

    const card = document.createElement("div");
    card.className = "yt-crew-card";
    card.dataset.ytCrewCard = key;

    const name = document.createElement("h3");
    name.className = "yt-crew-card__name";
    name.textContent = displayName(key);

    const reply = document.createElement("p");
    reply.className = "yt-crew-card__reply is-wait";
    reply.setAttribute("aria-live", "polite");
    reply.textContent = waitPhrase(key);

    const cont = document.createElement("a");
    cont.className = "yt-crew-card__continue";
    cont.href = `${base}pages/talk.html?c=${encodeURIComponent(meta[key]?.id || key)}`;
    cont.textContent = continueWith(key);
    cont.hidden = true;

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "yt-crew-card__retry";
    retry.textContent = tt("thread.retry") || (lang() === "ru" ? "Повторить" : "Try again");
    retry.hidden = true;

    cont.addEventListener("click", (e) => {
      e.preventDefault();
      if (!desireText || !crewReplies[key]) return;
      const full = crewReplies[key];
      clearTyping(`crew:${key}`);
      ui.reply.textContent = formatReply(full);
      saveTalkHistory(key, desireText, full);
      goToTalk(key);
    });

    retry.addEventListener("click", () => {
      if (!desireText || crewPending.has(key)) return;
      askCrew(key, true);
    });

    card.append(name, reply, cont, retry);
    host.appendChild(card);
    crewCards[key] = { card, reply, cont, retry };
    return crewCards[key];
  }

  async function askCrew(key, isRetry = false) {
    if (!desireText) return;
    if (!isRetry && crewAsked.has(key)) return;
    if (crewPending.has(key)) return;

    crewAsked.add(key);
    markCrewUsed(key);

    let ui = crewCards[key];
    if (!ui) ui = makeCrewCard(key);
    if (!ui) return;

    crewPending.add(key);
    syncLoading();
    clearTyping(`crew:${key}`);
    ui.reply.classList.add("is-wait");
    ui.reply.classList.remove("is-error");
    ui.reply.textContent = waitPhrase(key);
    ui.cont.hidden = true;
    ui.retry.hidden = true;
    crewReplies[key] = "";

    const apiId = meta[key]?.apiId || key;
    try {
      const text = await askCharacter(apiId, desireText, crewInstruction(), "ask_more");
      crewReplies[key] = text;
      typeInto(ui.reply, `crew:${key}`, text, meta[key]?.typePace || 60, () => {
        ui.cont.hidden = false;
        ui.retry.hidden = true;
      });
    } catch (err) {
      console.error(`[your-thread] crew ${key} failed:`, err);
      ui.reply.classList.remove("is-wait");
      ui.reply.classList.add("is-error");
      const body = err?.body || {};
      const isRate = err?.status === 429 || body.code === "rate_limit";
      if (isRate) {
        ui.reply.classList.add("is-rate-limit");
        ui.reply.replaceChildren();
        const w = document.createElement("span");
        w.className = "yt-rate-limit-wait";
        w.textContent = waitPhrase(key) || body.waitPhrase || "…";
        ui.reply.appendChild(w);
        ui.retry.textContent =
          body.retryHint ||
          (lang() === "ru" ? "Попробуй ещё раз через минуту" : "Try again in a minute");
      } else {
        ui.reply.classList.remove("is-rate-limit");
        ui.reply.textContent =
          tt("thread.thinking") ||
          (lang() === "ru" ? "Он задумался. Попробуй ещё раз" : "He is thinking. Try again");
        ui.retry.textContent = tt("thread.retry") || (lang() === "ru" ? "Повторить" : "Try again");
      }
      ui.cont.hidden = true;
      ui.retry.hidden = false;
    } finally {
      crewPending.delete(key);
      syncLoading();
    }
  }

  function showAsk() {
    clearTyping();
    loading = false;
    pending = { dream: false, weaver: false };
    desireText = "";
    replies = { dream: "", weaver: "" };
    errors = { dream: "", weaver: "" };
    clearCrew();
    ask.hidden = false;
    reveal.hidden = true;
    helpEl.hidden = true;
    desireEl.textContent = "";
    ["dream", "weaver"].forEach((key) => {
      replyEls[key].textContent = "";
      replyEls[key].classList.remove("is-wait", "is-error");
      continueEls[key].hidden = true;
      retryEls[key].hidden = true;
    });
    sayBtn.disabled = false;
    input.value = "";
    input.focus();
  }

  async function runDesire(raw) {
    const desire = (raw || "").trim().slice(0, 200);
    if (!desire || loading) return;
    desireText = desire;
    clearCrew();
    ask.hidden = true;
    reveal.hidden = false;
    desireEl.textContent = desire;
    helpEl.hidden = !isCrisis(desire);
    paintCord();
    await Promise.all([askOne("dream"), askOne("weaver")]);
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
      // Always persist the full API reply (not the mid-typing DOM text).
      const full = replies[key];
      if (replyEls[key]) {
        clearTyping(key);
        replyEls[key].textContent = formatReply(full);
      }
      saveTalkHistory(key, desireText, full);
      goToTalk(key);
    });
  });

  Object.entries(retryEls).forEach(([key, btn]) => {
    btn?.addEventListener("click", () => {
      if (!desireText || pending[key]) return;
      askOne(key);
    });
  });

  root.querySelectorAll("[data-yt-ask-char]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-yt-ask-char");
      if (!key || !desireText) return;
      askCrew(key);
    });
  });

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
    label.textContent = tt("thread.castLabel") || (lang() === "ru" ? "Все персонажи" : "All characters");
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
      a.textContent = displayName(id);
      frag.appendChild(a);
      n += 1;
    });
    castEl.replaceChildren(frag);
  }

  applyUi();
  document.addEventListener("sunnychimera:i18n-ready", applyUi);

  paintCord();
  window.addEventListener("resize", paintCord);
  window.setTimeout(() => input?.focus(), 80);
})();
