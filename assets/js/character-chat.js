/**
 * Чат персонажа (один чат на странице): Gemini или Groq.
 * Подключается на страницах Weaver, Dream, Keeper, Crystal, Shiny и т.д.
 * Персонаж задаётся через data-character на .chat (по умолчанию weaver).
 */
(function () {
  const chatContainer = document.querySelector(".chat");
  const form = document.querySelector(".chat__form");
  const input = document.querySelector(".chat__input");
  const sendBtn = document.querySelector(".chat__send");
  const log = document.querySelector(".chat__log");
  const hint = document.querySelector(".chat__hint");

  if (!form || !input || !log) return;

  
  const character = (chatContainer && chatContainer.getAttribute("data-character")) || "weaver";

  function applyChatLabels() {
    const t = window.SunnyI18n && window.SunnyI18n.t;
    const headerTitle = document.querySelector(".chat__header-title");
    const headerKey = character === "keeper" ? "chat.askKeeper" : "chat.askSomething";
    if (headerTitle) {
      headerTitle.textContent = t ? t(headerKey) : (character === "keeper" ? "ASK KIPER ABOUT YOUR ESSENCE" : "ASK ME SOMETHING...");
    }
    if (input) {
      input.placeholder = t ? t("chat.seekPlaceholder") : "Seek the truth...";
    }
    if (sendBtn && t) sendBtn.textContent = t("chat.send");
    if (hint && t) {
      const hintKey = "chat.hintGeminiGroq";
      if (hint.textContent.indexOf("Gemini") !== -1 || hint.textContent.indexOf("Groq") !== -1) {
        hint.textContent = t(hintKey);
      }
    }
  }
  applyChatLabels();
  document.addEventListener("sunnychimera:i18n-ready", applyChatLabels);

  let history = [];
  let loading = false;
  var STORAGE_KEY = "sunnychimera-ai-source";
  /** roots → Groq, aether → Gemini */
  let aiSource = "roots";

  /** Подсказки с названием модели при наведении */
  var rootsModel = "Groq";
  var aetherModel = "Gemini";
  document.querySelectorAll(".chat__source-btn--roots").forEach(function (b) { b.title = rootsModel; });
  document.querySelectorAll(".chat__source-btn--aether").forEach(function (b) { b.title = aetherModel; });

  /** Инициализация: Roots по умолчанию */
  document.querySelectorAll(".character-chat").forEach(function (p) {
    p.classList.add("ai-source-roots");
  });

  function syncProviderButtons() {
    document.querySelectorAll(".chat__provider-btn").forEach(function (btn) {
      var p = (btn.getAttribute("data-provider") || "").toLowerCase();
      var isGemini = p === "gemini";
      var isGroq = p === "groq" || p === "ollama";
      if (isGemini) btn.classList.toggle("is-active", aiSource === "aether");
      if (isGroq) btn.classList.toggle("is-active", aiSource === "roots");
    });
  }

  function updateProviderBadge() {
    var badge = document.querySelector(".chat__provider-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "chat__provider-badge";
      var header = document.querySelector(".chat__header");
      if (header) header.appendChild(badge);
    }
    if (badge) {
      badge.textContent = aiSource === "aether" ? "Gemini" : "Groq";
      badge.setAttribute("data-provider", aiSource === "aether" ? "gemini" : "groq");
    }
  }

  /** Переключатель Roots / Aether (+ кнопки Gemini / Groq под шапкой) */
  function setAiSource(source) {
    aiSource = source;
    try { localStorage.setItem(STORAGE_KEY, source); } catch (e) {}
    document.querySelectorAll(".character-chat").forEach(function (p) {
      p.classList.remove("ai-source-roots", "ai-source-aether");
      p.classList.add("ai-source-" + source);
    });
    document.querySelectorAll(".character-chat .chat__source-btn--roots").forEach(function (b) {
      b.classList.toggle("is-active", source === "roots");
    });
    document.querySelectorAll(".character-chat .chat__source-btn--aether").forEach(function (b) {
      b.classList.toggle("is-active", source === "aether");
    });
    syncProviderButtons();
    updateProviderBadge();
    if (hint) setHintForProvider();
  }

  function providerBtnToSource(btn) {
    var p = (btn.getAttribute("data-provider") || "").toLowerCase();
    if (p === "gemini") return "aether";
    if (p === "groq" || p === "ollama") return "roots";
    return null;
  }

  try {
    var savedSource = localStorage.getItem(STORAGE_KEY);
    if (savedSource === "roots" || savedSource === "aether") {
      setAiSource(savedSource);
    }
  } catch (e) {}
  document.querySelectorAll(".character-chat .chat__source-btn--roots").forEach(function (btn) {
    btn.addEventListener("click", function () { setAiSource("roots"); });
  });
  document.querySelectorAll(".character-chat .chat__source-btn--aether").forEach(function (btn) {
    btn.addEventListener("click", function () { setAiSource("aether"); });
  });
  document.querySelectorAll(".chat__provider-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = providerBtnToSource(btn);
      if (next) setAiSource(next);
    });
  });
  syncProviderButtons();
  updateProviderBadge();

  function appendMessage(text, isUser, providerLabel) {
    const wrap = document.createElement("div");
    wrap.className = "chat__msg-wrap" + (isUser ? " chat__msg-wrap--user" : "");
    const msg = document.createElement("div");
    msg.className = "chat__msg" + (isUser ? " chat__msg--user" : " chat__msg--npc");
    const bubble = document.createElement("div");
    bubble.className = "chat__bubble";
    bubble.textContent = text;
    msg.appendChild(bubble);
    wrap.appendChild(msg);
    if (!isUser && providerLabel) {
      const label = document.createElement("span");
      label.className = "chat__msg-provider";
      label.textContent = providerLabel;
      wrap.appendChild(label);
    }
    log.appendChild(wrap);
    var chatPanel = log.closest(".character-chat");
    if (chatPanel) chatPanel.classList.add("is-expanded");
    requestAnimationFrame(function () {
      log.scrollTop = log.scrollHeight;
      var lastBubble = wrap.querySelector(".chat__bubble");
      if (lastBubble) lastBubble.scrollIntoView({ block: "end", behavior: "smooth" });
    });
    setTimeout(function () {
      log.scrollTop = log.scrollHeight;
    }, 450);
  }

  function setHintForProvider() {
    if (!hint) return;
    hint.textContent = aiSource === "roots"
      ? "Сейчас: Groq (левая иконка Roots). Для Google Gemini нажмите правую иконку Aether."
      : "Сейчас: Google Gemini (Aether). Для Groq нажмите левую иконку Roots.";
  }

  function getApiBase() {
    var host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return window.location.origin;
    }
    if (window.location.protocol === "file:") {
      return "https://ai-character-platform.onrender.com";
    }
    return window.location.origin;
  }

  function setLoading(on) {
    loading = on;
    input.disabled = on;
    if (sendBtn) {
      sendBtn.disabled = on;
      sendBtn.textContent = on ? "…" : "Send";
    }
    if (hint) {
      if (on) hint.textContent = "Персонаж думает…";
      else setHintForProvider();
    }
    var panel = chatContainer && chatContainer.closest(".character-chat");
    if (panel) {
      if (on) panel.classList.add("is-loading");
      else panel.classList.remove("is-loading");
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (loading) return;
    const text = input.value.trim();
    if (!text) return;
    setLoading(true);
    input.value = "";
    appendMessage(text, true);
    history.push({ role: "user", text });

    var providerToSend = aiSource === "roots" ? "groq" : "gemini";

    try {
      const res = await fetch(getApiBase() + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(0, -1), provider: providerToSend, character: character }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errMsg = res.statusText;
        if (typeof data.error === "string") {
          errMsg = data.error;
        } else if (data.error && typeof data.error === "object") {
          errMsg = data.error.message || data.error.code || JSON.stringify(data.error);
        }
        if (typeof errMsg === "string" && errMsg.startsWith("{")) {
          try {
            const parsed = JSON.parse(errMsg);
            errMsg = parsed.error?.message || parsed.message || errMsg;
          } catch (_) {}
        }
        appendMessage(errMsg ? "Ошибка: " + errMsg : "Ошибка сервера (" + res.status + ")", false, null);
        history.pop();
        setLoading(false);
        input.focus();
        return;
      }

      const reply = (data.text || "").trim() || "…";
      appendMessage(reply, false, null);
      history.push({ role: "model", text: reply });
    } catch (err) {
      appendMessage("Ошибка сети: " + (err.message || "не удалось отправить").trim(), false, null);
      history.pop();
    } finally {
      setLoading(false);
      input.focus();
    }
  });

  input.disabled = false;
  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.type = "submit";
  }
  if (hint) setHintForProvider();

  /** Кнопка «свернуть» чат (вертикальный новый макет): возврат к 30% высоты */
  document.querySelectorAll(".chat__reset").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var chatPanel = btn.closest(".character-chat");
      if (chatPanel) chatPanel.classList.remove("is-expanded");
    });
  });

  /** Глаз справа в шапке чата: уменьшение/увеличение чата */
  document.querySelectorAll(".character-chat .chat__eye-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var chatPanel = btn.closest(".character-chat");
      if (chatPanel) chatPanel.classList.toggle("is-expanded");
    });
  });
})();
