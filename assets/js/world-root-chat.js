/**
 * Страница «The Root of All Things»: два чата внизу (Nature слева, Keeper справа).
 * Nature молчит - при отправке сообщения в чат Nature ответ приходит в чат Keeper.
 * Общая история диалога с Keeper для обоих чатов.
 */
(function () {
  const natureChat = document.querySelector(".world-history__chat--nature .chat");
  const keeperChat = document.querySelector(".world-history__chat--keeper .chat");
  if (!natureChat || !keeperChat) return;

  const natureForm = natureChat.querySelector(".chat__form");
  const natureInput = natureChat.querySelector(".chat__input");
  const natureSendBtn = natureChat.querySelector(".chat__send");
  const natureLog = natureChat.querySelector(".chat__log");

  const keeperForm = keeperChat.querySelector(".chat__form");
  const keeperInput = keeperChat.querySelector(".chat__input");
  const keeperSendBtn = keeperChat.querySelector(".chat__send");
  const keeperLog = keeperChat.querySelector(".chat__log");

  if (!natureForm || !keeperForm || !natureLog || !keeperLog) return;

  /** Заголовок и плейсхолдер для обоих чатов (Keeper) */
  const placeholderText = "ASK THE KEEPER ABOUT YOUR ESSENCE";
  document.querySelectorAll(".world-history__chat .chat").forEach(function (chat) {
    var title = chat.querySelector(".chat__header-title");
    if (title) title.textContent = placeholderText;
    var inp = chat.querySelector(".chat__input");
    if (inp) inp.placeholder = "Seek the truth...";
  });

  const character = "keeper";
  let keeperHistory = [];
  let loading = false;
  /** roots → Groq, aether → Gemini */
  let aiSource = "aether";

  /** API на Render; с Vercel/других хостов — всегда ходим на Render, иначе 404 */
  const apiOrigin = "https://ai-character-platform.onrender.com";
  const isOnRender = window.location.origin === apiOrigin;
  const apiBase = isOnRender ? window.location.origin : apiOrigin;

  /** Инициализация: по умолчанию Gemini (aether), класс на панелях */
  document.querySelectorAll(".world-history__chat").forEach(function (p) {
    p.classList.add("ai-source-aether");
  });

  /** Подсказки с названием модели при наведении */
  document.querySelectorAll(".world-history__chat .chat__source-btn--roots").forEach(function (b) {
    b.title = "Groq";
  });
  document.querySelectorAll(".world-history__chat .chat__source-btn--aether").forEach(function (b) {
    b.title = "Gemini";
  });

  /** Переключатель Roots / Aether: синхронно для обоих чатов */
  function setAiSource(source) {
    aiSource = source;
    document.querySelectorAll(".world-history__chat").forEach(function (p) {
      p.classList.remove("ai-source-roots", "ai-source-aether");
      p.classList.add("ai-source-" + source);
    });
    document.querySelectorAll(".world-history__chat .chat__source-btn--roots").forEach(function (b) {
      b.classList.toggle("is-active", source === "roots");
    });
    document.querySelectorAll(".world-history__chat .chat__source-btn--aether").forEach(function (b) {
      b.classList.toggle("is-active", source === "aether");
    });
  }
  document.querySelectorAll(".world-history__chat .chat__source-btn--roots").forEach(function (btn) {
    btn.addEventListener("click", function () { setAiSource("roots"); });
  });
  document.querySelectorAll(".world-history__chat .chat__source-btn--aether").forEach(function (btn) {
    btn.addEventListener("click", function () { setAiSource("aether"); });
  });

  function appendToLog(logEl, text, isUser, providerLabel) {
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
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;
    var chatPanel = logEl.closest(".world-history__chat");
    if (chatPanel) chatPanel.classList.add("is-expanded");
  }

  function setLoading(on) {
    loading = on;
    [natureInput, keeperInput].forEach(function (el) { if (el) el.disabled = on; });
    [natureSendBtn, keeperSendBtn].forEach(function (el) { if (el) { el.disabled = on; el.textContent = on ? "…" : "Send"; } });
  }

  /** askedInChat: "nature" - написали в чате Nature; "keeper" - написали в чате Keeper (напрямую) */
  function sendMessage(userText, appendReplyToKeeperLog, askedInChat) {
    setLoading(true);
    document.querySelectorAll(".world-history__chat").forEach(function (p) { p.classList.add("is-loading"); });
    keeperHistory.push({ role: "user", text: userText });

    var providerToSend = aiSource === "roots" ? "groq" : "gemini";

    fetch(apiBase + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: keeperHistory.slice(0, -1),
          provider: providerToSend,
          character: character,
          askedInChat: askedInChat || "keeper",
        }),
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) { return { res: res, data: data }; });
      })
      .then(function (result) {
        var res = result.res;
        var data = result.data;
        if (!res.ok) {
          var errMsg = res.statusText;
          if (typeof data.error === "string") errMsg = data.error;
          else if (data.error && typeof data.error === "object") errMsg = (data.error && data.error.message) || data.error.code || String(data.error);
          if (providerToSend === "groq") {
            errMsg = "Groq не ответил. Проверь GROQ_API_KEY в server/.env (ключ: console.groq.com).";
          }
          if (appendReplyToKeeperLog) appendToLog(keeperLog, errMsg || "Ошибка сервера (" + res.status + ")", false, null);
          keeperHistory.pop();
          return;
        }
        var reply = (data.text || "").trim() || "…";
        var actualProvider = data.provider || (aiSource === "roots" ? "groq" : "gemini");
        if (appendReplyToKeeperLog) appendToLog(keeperLog, reply, false, actualProvider);
        keeperHistory.push({ role: "model", text: reply });
      })
      .catch(function (err) {
        var errMsg = providerToSend === "groq"
          ? "Groq не ответил. Проверь GROQ_API_KEY в server/.env."
          : "Network error: " + (err.message || "failed to send").trim();
        if (appendReplyToKeeperLog) appendToLog(keeperLog, errMsg, false, null);
        keeperHistory.pop();
      })
      .finally(function () {
        setLoading(false);
        document.querySelectorAll(".world-history__chat").forEach(function (p) { p.classList.remove("is-loading"); });
        if (askedInChat === "nature" && natureInput) natureInput.focus();
        else if (keeperInput) keeperInput.focus();
      });
  }

  natureForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (loading) return;
    var text = natureInput.value.trim();
    if (!text) return;
    natureInput.value = "";
    appendToLog(natureLog, text, true);
    sendMessage(text, true, "nature");
  });

  keeperForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (loading) return;
    var text = keeperInput.value.trim();
    if (!text) return;
    keeperInput.value = "";
    appendToLog(keeperLog, text, true);
    sendMessage(text, true, "keeper");
  });

  natureInput.disabled = false;
  keeperInput.disabled = false;
  if (natureSendBtn) natureSendBtn.type = "submit";
  if (keeperSendBtn) keeperSendBtn.type = "submit";

  /** Автофокус поля ввода при загрузке страницы (Keeper) */
  if (keeperInput) {
    setTimeout(function () { keeperInput.focus(); }, 300);
  }

  /** Eye toggle: один клик - развернуть/свернуть чат */
  document.querySelectorAll(".world-history__chat .chat__eye-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var chatPanel = btn.closest(".world-history__chat");
      if (chatPanel) chatPanel.classList.toggle("is-expanded");
    });
  });

  /** Пока пользователь печатает: зрачок «следит» за текстом (класс is-typing на .chat) */
  function updateTypingState(inputEl) {
    var chatBox = inputEl && inputEl.closest(".chat");
    if (!chatBox) return;
    if (inputEl.value.trim() || document.activeElement === inputEl) {
      chatBox.classList.add("is-typing");
    } else {
      chatBox.classList.remove("is-typing");
    }
  }
  [natureInput, keeperInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener("focus", function () { updateTypingState(input); });
    input.addEventListener("blur", function () { updateTypingState(input); });
    input.addEventListener("input", function () { updateTypingState(input); });
  });
})();
