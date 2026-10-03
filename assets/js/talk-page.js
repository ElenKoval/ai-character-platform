/**
 * Dedicated talk page — full conversation, no overlays.
 */
(() => {
  const STORAGE_KEY = "sunnychimera-scene-chats";
  const HISTORY_CAP = 40;

  function apiBase() {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return window.location.origin;
    if (window.location.protocol === "file:") return "https://ai-character-platform.onrender.com";
    return window.location.origin;
  }

  function resolveCharacter(key) {
    const chars = window.storyMeta?.characters || {};
    if (!key) return null;
    if (chars[key]) return chars[key];
    return (
      Object.values(chars).find(
        (c) => c.id === key || c.apiId === key || c.soundId === key
      ) || null
    );
  }

  function stripQuotes(s) {
    return (s || "")
      .replace(/[«»"„“”]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatNpc(text) {
    const t = stripQuotes(text);
    if (!t) return "";
    return t.startsWith("—") || t.startsWith("–") ? t : `— ${t}`;
  }

  function chatIdFor(c) {
    return (c && (c.id || c.apiId)) || "";
  }

  function loadSavedChat(id) {
    if (!id) return [];
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const list = all[id];
      if (!Array.isArray(list)) return [];
      return list
        .filter((m) => m && (m.role === "user" || m.role === "model") && typeof m.text === "string")
        .map((m) => ({ role: m.role, text: m.text }));
    } catch (e) {
      return [];
    }
  }

  function saveChat(id, list) {
    if (!id) return;
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      all[id] = (list || []).slice(-HISTORY_CAP);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  function clearChat(id) {
    if (!id) return;
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      delete all[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  const params = new URLSearchParams(window.location.search);
  const character = resolveCharacter(params.get("c") || params.get("id") || "");
  if (!character) {
    window.location.replace("../index.html");
    return;
  }

  const els = {
    back: document.querySelector("[data-talk-back]"),
    art: document.querySelector("[data-talk-art]"),
    name: document.querySelector("[data-talk-name]"),
    column: document.querySelector(".talk__column"),
    log: document.querySelector("[data-talk-log]"),
    thread: document.querySelector("[data-talk-thread]"),
    wait: document.querySelector("[data-talk-wait]"),
    form: document.querySelector("[data-talk-form]"),
    input: document.querySelector("[data-talk-input]"),
    say: document.querySelector("[data-talk-say]"),
    release: document.querySelector("[data-talk-release]"),
  };

  let history = [];
  let loading = false;
  let typeTimer = 0;
  let releaseArmed = false;
  const chatId = chatIdFor(character);

  document.title = `${character.name} — разговор`;
  els.name.textContent = character.name;
  els.art.src = character.img;
  els.art.alt = character.name;
  els.art.className = "talk__art";
  if (character.sceneContrast === "hard" || character.sceneContrast === "face") {
    els.art.classList.add(`talk__art--${character.sceneContrast}`);
  } else if (character.sceneContrast === "soft") {
    els.art.classList.add("talk__art--soft");
  }
  els.input.placeholder = character.askHint || `Спроси ${character.nameWith || character.name}…`;
  els.wait.textContent = character.waitPhrase || "…";

  els.back?.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.SunnyTalk?.back) window.SunnyTalk.back();
    else window.history.back();
  });

  function persist() {
    saveChat(chatId, history);
  }

  function setThinking(on) {
    loading = !!on;
    document.body.classList.toggle("is-thinking", loading);
    els.input.disabled = loading;
    els.say.disabled = loading;
    if (els.thread) {
      // Thread lives under the last NPC line; show while thinking or when an NPC line exists
      const hasNpc = history.some((m) => m.role === "model");
      els.thread.hidden = !(loading || hasNpc);
    }
  }

  function lineOpacity(index, total) {
    if (total <= 1) return 1;
    const age = total - 1 - index;
    return Math.max(0.4, 1 - age * 0.1);
  }

  function renderLog(opts = {}) {
    const typingEl = opts.typingEl || null;
    // Keep thread node alive across log rebuilds
    if (els.thread && els.thread.parentNode === els.log) {
      els.log.parentNode.appendChild(els.thread);
    }
    els.log.replaceChildren();
    const total = history.length;
    history.forEach((m, i) => {
      const p = document.createElement("p");
      const isNpc = m.role === "model";
      p.className = "talk__line " + (isNpc ? "talk__line--npc" : "talk__line--user");
      p.style.opacity = String(lineOpacity(i, total));
      if (typingEl != null && i === total - 1 && isNpc) {
        p.textContent = formatNpc(typingEl);
      } else {
        p.textContent = isNpc ? formatNpc(m.text) : m.text;
      }
      els.log.appendChild(p);
    });
    placeThread();
    if (opts.scroll !== false) {
      window.requestAnimationFrame(() => {
        const scroller = els.column;
        if (!scroller) return;
        scroller.scrollTo({
          top: scroller.scrollHeight,
          behavior: opts.smooth ? "smooth" : "auto",
        });
      });
    }
  }

  function placeThread() {
    if (!els.thread) return;
    const npcLines = els.log.querySelectorAll(".talk__line--npc");
    const lastNpc = npcLines[npcLines.length - 1];
    const lastLine = els.log.querySelector(".talk__line:last-child");
    const hasNpc = npcLines.length > 0;
    els.thread.hidden = !(loading || hasNpc);
    // While thinking — under the newest line; otherwise under last NPC reply
    const anchor = loading ? lastLine || lastNpc : lastNpc;
    if (anchor) {
      anchor.insertAdjacentElement("afterend", els.thread);
    } else if (els.log.parentNode) {
      els.log.parentNode.insertBefore(els.thread, els.log.nextSibling);
    }
  }

  function clearTypeTimer() {
    if (typeTimer) {
      window.clearInterval(typeTimer);
      typeTimer = 0;
    }
  }

  function typeLine(text) {
    clearTypeTimer();
    const full = text || "";
    const pace = Math.max(18, Number(character.typePace) || 70);
    let i = 0;
    const tick = () => {
      i += 1;
      const partial = full.slice(0, i);
      // Update last history display while typing
      if (history.length && history[history.length - 1].role === "model") {
        const snap = history.slice();
        // Temporarily show partial in render without mutating stored text
        const last = els.log.querySelector(".talk__line:last-child");
        if (last && last.classList.contains("talk__line--npc")) {
          last.textContent = formatNpc(partial);
        } else {
          renderLog({ typingEl: partial, scroll: true });
        }
      }
      if (i >= full.length) {
        clearTypeTimer();
        renderLog({ scroll: true, smooth: true });
      }
    };
    // Ensure model message exists in DOM
    renderLog({ typingEl: "", scroll: true });
    typeTimer = window.setInterval(tick, pace);
    tick();
  }

  function renderRelease() {
    if (!els.release) return;
    els.release.replaceChildren();
    if (!releaseArmed) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "talk__release-link";
      btn.textContent = "Отпустить разговор";
      btn.addEventListener("click", () => {
        releaseArmed = true;
        renderRelease();
      });
      els.release.appendChild(btn);
      return;
    }
    const yes = document.createElement("button");
    yes.type = "button";
    yes.className = "talk__release-choice";
    yes.textContent = "Отпустить?";
    yes.addEventListener("click", () => {
      clearTypeTimer();
      clearChat(chatId);
      history = [];
      const opening = stripQuotes(character.quote || "");
      if (opening) {
        history.push({ role: "model", text: opening });
        persist();
      }
      releaseArmed = false;
      setThinking(false);
      renderLog({ scroll: true });
      renderRelease();
      els.input.focus();
    });
    const dot = document.createElement("span");
    dot.className = "talk__release-dot";
    dot.textContent = "·";
    const no = document.createElement("button");
    no.type = "button";
    no.className = "talk__release-choice";
    no.textContent = "Оставить";
    no.addEventListener("click", () => {
      releaseArmed = false;
      renderRelease();
    });
    els.release.append(yes, dot, no);
  }

  async function send(text) {
    if (loading || !character) return;
    const msg = (text || "").trim();
    if (!msg) return;

    history.push({ role: "user", text: msg });
    persist();
    renderLog({ scroll: true, smooth: true });
    setThinking(true);
    els.wait.textContent = character.waitPhrase || "…";

    try {
      const res = await fetch(apiBase() + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: history.slice(0, -1),
          provider: "auto",
          character: character.apiId || character.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setThinking(false);

      if (!res.ok) {
        const err = typeof data.error === "string" ? data.error : "Ошибка сервера";
        history.pop();
        persist();
        history.push({ role: "model", text: err });
        renderLog({ scroll: true });
        return;
      }

      const reply = (data.text || "").trim() || "…";
      history.push({ role: "model", text: reply });
      persist();
      typeLine(reply);
    } catch (err) {
      setThinking(false);
      history.pop();
      persist();
      history.push({ role: "model", text: "Ошибка сети" });
      renderLog({ scroll: true });
    } finally {
      els.input.focus();
    }
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = els.input.value;
    els.input.value = "";
    send(text);
  });

  // Boot conversation
  const saved = loadSavedChat(chatId);
  const opening = stripQuotes(character.quote || "");
  if (saved.length) {
    history = saved.slice();
  } else if (opening) {
    history = [{ role: "model", text: opening }];
    persist();
  } else {
    history = [];
  }
  renderLog({ scroll: false });
  placeThread();
  renderRelease();

  const seed = window.SunnyTalk?.takeSeed?.() || "";
  if (seed) {
    window.setTimeout(() => send(seed), 40);
  } else {
    window.setTimeout(() => els.input.focus(), 60);
  }
})();
