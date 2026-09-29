/**
 * world.html: чат только у Кипера; у Дриады — подпись «обращайся к Киперу».
 * Модель выбирается на сервере автоматически.
 */
(function () {
  const keeperChat = document.querySelector(".world-history__chat--keeper .chat");
  if (!keeperChat) return;

  const keeperForm = keeperChat.querySelector(".chat__form");
  const keeperInput = keeperChat.querySelector(".chat__input");
  const keeperSendBtn = keeperChat.querySelector(".chat__send");
  const keeperLog = keeperChat.querySelector(".chat__log");

  if (!keeperForm || !keeperLog) return;

  function applyWorldChatLabels() {
    var t = window.SunnyI18n && window.SunnyI18n.t;
    var headerText = t ? t("chat.askKeeper") : "ASK KIPER ABOUT YOUR ESSENCE";
    var seek = t ? t("chat.seekPlaceholder") : "Seek the truth...";
    var title = keeperChat.querySelector(".chat__header-title");
    if (title) title.textContent = headerText;
    if (keeperInput) keeperInput.placeholder = seek;
  }
  applyWorldChatLabels();
  document.addEventListener("sunnychimera:i18n-ready", applyWorldChatLabels);

  const character = "keeper";
  let keeperHistory = [];
  let loading = false;

  const apiBase = "https://ai-character-platform.onrender.com";

  function appendToLog(logEl, text, isUser) {
    const wrap = document.createElement("div");
    wrap.className = "chat__msg-wrap" + (isUser ? " chat__msg-wrap--user" : "");
    const msg = document.createElement("div");
    msg.className = "chat__msg" + (isUser ? " chat__msg--user" : " chat__msg--npc");
    const bubble = document.createElement("div");
    bubble.className = "chat__bubble";
    bubble.textContent = text;
    msg.appendChild(bubble);
    wrap.appendChild(msg);
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;
    var chatPanel = logEl.closest(".world-history__chat");
    if (chatPanel) chatPanel.classList.add("is-expanded");
  }

  function setLoading(on) {
    loading = on;
    if (keeperInput) keeperInput.disabled = on;
    if (keeperSendBtn) {
      keeperSendBtn.disabled = on;
      var t = window.SunnyI18n && window.SunnyI18n.t;
      keeperSendBtn.textContent = on ? "…" : (t ? t("chat.send") : "Send");
    }
  }

  function sendMessage(userText) {
    setLoading(true);
    document.querySelectorAll(".world-history__chat").forEach(function (p) { p.classList.add("is-loading"); });
    keeperHistory.push({ role: "user", text: userText });

    fetch(apiBase + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        history: keeperHistory.slice(0, -1),
        provider: "auto",
        character: character,
        askedInChat: "keeper",
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
          appendToLog(keeperLog, errMsg || "Ошибка сервера (" + res.status + ")", false);
          keeperHistory.pop();
          return;
        }
        var reply = (data.text || "").trim() || "…";
        appendToLog(keeperLog, reply, false);
        keeperHistory.push({ role: "model", text: reply });
      })
      .catch(function (err) {
        appendToLog(keeperLog, "Network error: " + (err.message || "failed to send").trim(), false);
        keeperHistory.pop();
      })
      .finally(function () {
        setLoading(false);
        document.querySelectorAll(".world-history__chat").forEach(function (p) { p.classList.remove("is-loading"); });
        if (keeperInput) keeperInput.focus();
      });
  }

  keeperForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (loading) return;
    var text = keeperInput.value.trim();
    if (!text) return;
    keeperInput.value = "";
    appendToLog(keeperLog, text, true);
    sendMessage(text);
  });

  if (keeperInput) keeperInput.disabled = false;
  if (keeperSendBtn) keeperSendBtn.type = "submit";

  if (keeperInput) {
    setTimeout(function () { keeperInput.focus(); }, 300);
  }

  document.querySelectorAll(".world-history__chat .chat__eye-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var chatPanel = btn.closest(".world-history__chat");
      if (chatPanel) chatPanel.classList.toggle("is-expanded");
    });
  });

  function updateTypingState(inputEl) {
    var chatBox = inputEl && inputEl.closest(".chat");
    if (!chatBox) return;
    if (inputEl.value.trim() || document.activeElement === inputEl) {
      chatBox.classList.add("is-typing");
    } else {
      chatBox.classList.remove("is-typing");
    }
  }

  if (keeperInput) {
    keeperInput.addEventListener("input", function () { updateTypingState(keeperInput); });
    keeperInput.addEventListener("focus", function () { updateTypingState(keeperInput); });
    keeperInput.addEventListener("blur", function () { updateTypingState(keeperInput); });
  }
})();
