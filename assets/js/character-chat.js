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

  /** Идентификатор персонажа для системного промпта (data-character на .chat). По умолчанию weaver. */
  const character = (chatContainer && chatContainer.getAttribute("data-character")) || "weaver";

  /** Текст в шапке чата: Keeper - про эссенцию, остальные - ASK ME SOMETHING... */
  const placeholderText = character === "keeper" ? "ASK THE KEEPER ABOUT YOUR ESSENCE" : "ASK ME SOMETHING...";
  const headerTitle = document.querySelector(".chat__header-title");
  if (headerTitle) headerTitle.textContent = placeholderText;
  if (input) input.placeholder = "Seek the truth...";

  let history = [];
  let loading = false;
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

  /** Переключатель Roots / Aether */
  function setAiSource(source) {
    aiSource = source;
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
    if (hint) setHintForProvider();
  }
  document.querySelectorAll(".character-chat .chat__source-btn--roots").forEach(function (btn) {
    btn.addEventListener("click", function () { setAiSource("roots"); });
  });
  document.querySelectorAll(".character-chat .chat__source-btn--aether").forEach(function (btn) {
    btn.addEventListener("click", function () { setAiSource("aether"); });
  });

  const apiBase = (window.location.port === "63342" || window.location.port === "63343")
    ? "https://ai-character-platform.onrender.com"
    : window.location.origin;

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
      label.textContent = providerLabel === "groq" ? "Groq" : "Gemini";
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
      ? "Groq (бесплатный тариф). Ключ: console.groq.com → GROQ_API_KEY в server/.env"
      : "Using Gemini (rate limits). On 429, switch to Roots.";
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
      const res = await fetch(apiBase + "/api/chat", {
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
      const actualProvider = data.provider || (aiSource === "roots" ? "groq" : "gemini");
      appendMessage(reply, false, actualProvider);
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
  if (hint) hint.textContent = "По умолчанию: Roots (Groq). Или Aether (Gemini). Под каждым ответом - кто ответил.";

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
