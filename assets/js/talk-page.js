/**
 * Dedicated talk page — full conversation, no overlays.
 */
(() => {
  const STORAGE_KEY = "sunnychimera-scene-chats";
  function storageKey() {
    const code = window.SunnyLocale?.getLang?.() || "en";
    return STORAGE_KEY + ":" + code;
  }
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

  function readChapterNow() {
    const n = window.SunnyChatContext?.getReadChapter?.();
    return Number.isFinite(Number(n)) ? Math.min(13, Math.max(0, Math.trunc(Number(n)))) : 0;
  }

  function talkedKey(id) {
    return id ? `sunnychimera-talked:${id}` : "";
  }

  function hasTalkedBefore(id) {
    const key = talkedKey(id);
    if (!key) return false;
    try {
      return localStorage.getItem(key) === "1";
    } catch (e) {
      return false;
    }
  }

  function markTalked(id) {
    const key = talkedKey(id);
    if (!key) return;
    try {
      localStorage.setItem(key, "1");
    } catch (e) {}
  }

  function openingFor(c, { returning = false } = {}) {
    if (!c) return "";
    if (typeof c.getOpening === "function") {
      return stripQuotes(
        c.getOpening(readChapterNow(), { returning, lang: lang() })
      );
    }
    return stripQuotes(c.quote || "");
  }

  function formatNpc(text) {
    const t = stripQuotes(text);
    if (!t) return "";
    return t.startsWith("—") || t.startsWith("–") ? t : `— ${t}`;
  }

  function chatIdFor(c) {
    return (c && (c.id || c.apiId)) || "";
  }

  function normalizeChatList(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter((m) => m && (m.role === "user" || m.role === "model") && typeof m.text === "string")
      .map((m) => ({ role: m.role, text: m.text }));
  }

  function unpackSavedEntry(raw) {
    if (Array.isArray(raw)) return { messages: normalizeChatList(raw), moodNow: null };
    if (raw && typeof raw === "object") {
      return {
        messages: normalizeChatList(raw.messages || raw.history || []),
        moodNow:
          typeof raw.moodNow === "string" && raw.moodNow.trim()
            ? raw.moodNow.trim()
            : null,
      };
    }
    return { messages: [], moodNow: null };
  }

  function loadSavedChat(id) {
    if (!id) return { messages: [], moodNow: null };
    try {
      const scoped = JSON.parse(localStorage.getItem(storageKey()) || "{}");
      const fromScoped = unpackSavedEntry(scoped[id]);
      if (fromScoped.messages.length || fromScoped.moodNow) return fromScoped;

      // Legacy key used by older Your Thread builds (no :lang suffix).
      const legacy = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const fromLegacy = unpackSavedEntry(legacy[id]);
      if (fromLegacy.messages.length) {
        scoped[id] = {
          messages: fromLegacy.messages.slice(-HISTORY_CAP),
          moodNow: fromLegacy.moodNow,
        };
        localStorage.setItem(storageKey(), JSON.stringify(scoped));
        delete legacy[id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
        return fromLegacy;
      }
      return { messages: [], moodNow: null };
    } catch (e) {
      return { messages: [], moodNow: null };
    }
  }

  function saveChat(id, list, moodNow) {
    if (!id) return;
    try {
      const all = JSON.parse(localStorage.getItem(storageKey()) || "{}");
      const entry = { messages: (list || []).slice(-HISTORY_CAP) };
      if (typeof moodNow === "string" && moodNow.trim()) {
        entry.moodNow = moodNow.trim();
      }
      all[id] = entry;
      localStorage.setItem(storageKey(), JSON.stringify(all));
    } catch (e) {}
  }

  function clearChat(id) {
    if (!id) return;
    try {
      const all = JSON.parse(localStorage.getItem(storageKey()) || "{}");
      delete all[id];
      localStorage.setItem(storageKey(), JSON.stringify(all));
      // Also clear legacy unscoped entry if present.
      const legacy = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (legacy[id]) {
        delete legacy[id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
      }
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
    artPlaceholder: document.querySelector("[data-talk-art-placeholder]"),
    artWrap: document.querySelector(".talk__art-wrap"),
    name: document.querySelector("[data-talk-name]"),
    column: document.querySelector("[data-talk-column]"),
    log: document.querySelector("[data-talk-log]"),
    dock: document.querySelector("[data-talk-dock]"),
    form: document.querySelector("[data-talk-form]"),
    input: document.querySelector("[data-talk-input]"),
    say: document.querySelector("[data-talk-say]"),
    release: document.querySelector("[data-talk-release]"),
  };

  let history = [];
  let moodNow = null;
  let loading = false;
  let typeTimer = 0;
  let releaseArmed = false;
  let pendingRetry = "";
  let rateLimitEl = null;
  const chatId = chatIdFor(character);

  const lang = () => window.SunnyLocale?.getLang?.() || "en";
  const tt = (key, vars) => {
    let v = window.SunnyI18n?.t?.(key) || "";
    if (!v && window.SunnyLocale?.t) {
      const leaf = key.includes(".") ? key.split(".").pop() : key;
      const camel = key.includes(".")
        ? key
            .split(".")
            .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
            .join("")
        : key;
      v = window.SunnyLocale.t(camel, vars) || window.SunnyLocale.t(leaf, vars) || "";
    }
    if (v && vars) {
      Object.keys(vars).forEach((k) => {
        v = v.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
      });
    }
    return v;
  };

  document.title =
    tt("talk.title", { name: character.name }) ||
    `${character.name} — ${lang() === "ru" ? "разговор" : "talk"}`;
  els.name.textContent = character.name;
  if (els.back) els.back.textContent = tt("talk.back") || tt("talkBack") || (lang() === "ru" ? "← Вернуться" : "← Back");
  if (els.say) els.say.textContent = tt("talk.say") || tt("talkSay") || tt("thread.say") || (lang() === "ru" ? "Сказать" : "Say it");
  const artSrc = character.imgNeg || character.img || "";
  const placeholderText =
    character.artPlaceholder ||
    tt("shinyBro.artPlaceholder") ||
    (lang() === "ru"
      ? "Брат вышел за бурбоном.\nСкоро вернётся."
      : "Brother stepped out for bourbon.\nHe'll be back.");
  if (!artSrc && character.artPlaceholder) {
    if (els.art) els.art.hidden = true;
    if (els.artPlaceholder) {
      els.artPlaceholder.hidden = false;
      els.artPlaceholder.textContent = placeholderText;
    }
    els.artWrap?.classList.add("talk__art-wrap--placeholder");
  } else if (els.art) {
    els.art.hidden = false;
    els.art.alt = character.name;
    els.art.className = "talk__art";
    if (character.imgNeg) {
      els.art.src = character.imgNeg;
      els.art.classList.add("talk__art--ready");
    } else {
      els.art.src = character.img;
      if (character.sceneContrast === "hard" || character.sceneContrast === "face") {
        els.art.classList.add(`talk__art--${character.sceneContrast}`);
      } else if (character.sceneContrast === "soft") {
        els.art.classList.add("talk__art--soft");
      }
    }
    if (els.artPlaceholder) els.artPlaceholder.hidden = true;
  }
  els.input.placeholder = "";

  els.back?.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.SunnyTalk?.back) window.SunnyTalk.back();
    else window.history.back();
  });

  function persist() {
    saveChat(chatId, history, moodNow);
  }

  function setThinking(on) {
    loading = !!on;
    els.input.disabled = loading;
    els.say.disabled = loading;
  }

  function lineOpacity(index, total) {
    if (total <= 1) return 1;
    const age = total - 1 - index;
    return Math.max(0.4, 1 - age * 0.1);
  }

  function renderLog(opts = {}) {
    const typingEl = opts.typingEl || null;
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
    if (opts.scroll !== false) scrollToInput(opts.smooth);
  }

  function scrollToInput(smooth) {
    window.requestAnimationFrame(() => {
      const scroller = els.column;
      if (!scroller) return;
      scroller.scrollTo({
        top: scroller.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    });
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
      btn.textContent = tt("talk.release") || (lang() === "ru" ? "Отпустить разговор" : "Release the talk");
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
    yes.textContent = tt("talk.releaseConfirm") || (lang() === "ru" ? "Отпустить?" : "Release?");
    yes.addEventListener("click", () => {
      clearTypeTimer();
      const returning = hasTalkedBefore(chatId);
      clearChat(chatId);
      history = [];
      moodNow = null; // new talk → new «Сейчас» for Weaver
      const opening = openingFor(character, { returning });
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
    no.textContent = tt("talk.keep") || (lang() === "ru" ? "Оставить" : "Keep");
    no.addEventListener("click", () => {
      releaseArmed = false;
      renderRelease();
    });
    els.release.append(yes, dot, no);
  }

  function clearRateLimitUI() {
    pendingRetry = "";
    rateLimitEl?.remove();
    rateLimitEl = null;
  }

  function showRateLimitUI(waitPhrase, retryHint, retryMsg) {
    clearRateLimitUI();
    pendingRetry = retryMsg;
    rateLimitEl = document.createElement("div");
    rateLimitEl.className = "talk__rate-limit";
    rateLimitEl.setAttribute("role", "status");

    const wait = document.createElement("p");
    wait.className = "talk__rate-limit-wait";
    wait.textContent =
      waitPhrase ||
      character.waitPhrase ||
      (lang() === "ru" ? "Дрим смотрит на Нити…" : "…");

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "talk__rate-limit-retry";
    retry.textContent =
      retryHint ||
      tt("talk.retryLater") ||
      (lang() === "ru" ? "Попробуй ещё раз через минуту" : "Try again in a minute");
    retry.addEventListener("click", () => {
      const again = pendingRetry;
      clearRateLimitUI();
      if (again) send(again, { fromRetry: true });
    });

    rateLimitEl.append(wait, retry);
    els.log.appendChild(rateLimitEl);
    els.log.scrollTop = els.log.scrollHeight;
  }

  async function send(text, opts = {}) {
    if (loading || !character) return;
    const msg = (text || "").trim();
    if (!msg) return;

    clearRateLimitUI();
    const fromRetry = Boolean(opts.fromRetry);
    const last = history[history.length - 1];
    const alreadyPushed = fromRetry && last?.role === "user" && last.text === msg;
    if (!alreadyPushed) {
      history.push({ role: "user", text: msg });
      markTalked(chatId);
      persist();
    }
    renderLog({ scroll: true, smooth: true });
    setThinking(true);

    try {
      const ctx = window.SunnyChatContext?.payload?.("talk") || {
        mode: "talk",
        readChapter: 0,
        currentChapter: 0,
      };
      const apiId = character.apiId || character.id;
      const body = {
        message: msg,
        history: history.slice(0, -1),
        provider: "auto",
        character: apiId,
        ...ctx,
      };
      if (moodNow) body.moodNow = moodNow;
      const res = await fetch(apiBase() + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      setThinking(false);

      if (!res.ok) {
        if (data.code === "rate_limit" || res.status === 429) {
          // Keep the user line; don't store a technical error as a reply.
          showRateLimitUI(
            character.waitPhrase || data.waitPhrase,
            data.retryHint,
            msg
          );
          return;
        }
        const err =
          typeof data.error === "string"
            ? data.error
            : tt("talk.serverError") || (lang() === "ru" ? "Ошибка сервера" : "Server error");
        history.pop();
        persist();
        history.push({ role: "model", text: err });
        renderLog({ scroll: true });
        return;
      }

      if (typeof data.moodNow === "string" && data.moodNow.trim()) {
        moodNow = data.moodNow.trim();
      }
      const reply = (data.text || "").trim() || "…";
      history.push({ role: "model", text: reply });
      persist();
      typeLine(reply);
    } catch (err) {
      setThinking(false);
      history.pop();
      persist();
      history.push({
        role: "model",
        text: tt("talk.networkError") || (lang() === "ru" ? "Ошибка сети" : "Network error"),
      });
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

  try { window.storyMeta?.applyLang?.(lang()); } catch (e) {}
  // Boot conversation
  const saved = loadSavedChat(chatId);
  const opening = openingFor(character, { returning: hasTalkedBefore(chatId) });
  moodNow = saved.moodNow || null;
  if (saved.messages.length) {
    history = saved.messages.slice();
  } else if (opening) {
    history = [{ role: "model", text: opening }];
    persist();
  } else {
    history = [];
  }
  renderLog({ scroll: false });
  renderRelease();

  const seed = window.SunnyTalk?.takeSeed?.() || "";
  if (seed) {
    window.setTimeout(() => send(seed), 40);
  } else {
    window.setTimeout(() => els.input.focus(), 60);
  }
})();
