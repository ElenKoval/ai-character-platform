/**
 * Shared site header + chapter reader for SunnyChimera.
 */
(() => {
  const STORAGE_PROGRESS = "sunnychimera-read-progress";
  const STORAGE_PREFS = "sunnychimera-reader-prefs";
  const t = (key, vars) =>
    (window.SunnyLocale && window.SunnyLocale.t(key, vars)) || key;

  function assetBase() {
    const path = (window.location.pathname || "").replace(/\\/g, "/");
    return /\/pages\//.test(path) || /\/pages$/.test(path) ? "../" : "";
  }

  const base = assetBase();
  const home = `${base}index.html`;
  const isHome = /(^|\/)index\.html?$/.test(window.location.pathname.replace(/\\/g, "/")) ||
    /\/SunnyChimeraWorld\/?$/.test(window.location.pathname.replace(/\\/g, "/")) ||
    window.location.pathname.endsWith("/");

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || "null");
    } catch (e) {
      return null;
    }
  }

  function chapterNumFromId(id) {
    if (!id) return 0;
    if (id === "prologue" || id === "beginning") return 0;
    const m = /^ch(\d+)$/i.exec(String(id));
    return m ? Math.min(13, Math.max(0, Number(m[1]) || 0)) : 0;
  }

  function saveProgress(data) {
    try {
      const prev = loadProgress() || {};
      const chapterId = data?.chapterId || prev.chapterId || "";
      const num = chapterNumFromId(chapterId);
      const maxChapterNum = Math.max(
        Number.isFinite(prev.maxChapterNum) ? prev.maxChapterNum : 0,
        Number.isFinite(data?.maxChapterNum) ? data.maxChapterNum : 0,
        num
      );
      localStorage.setItem(
        STORAGE_PROGRESS,
        JSON.stringify({ ...prev, ...data, chapterId, maxChapterNum })
      );
    } catch (e) {}
  }

  /** Chat API context: read progress + mode for hybrid character prompts. */
  window.SunnyChatContext = {
    chapterNumFromId,
    getReadChapter() {
      const p = loadProgress();
      if (p && Number.isFinite(p.maxChapterNum)) return Math.min(13, Math.max(0, p.maxChapterNum));
      return chapterNumFromId(p?.chapterId);
    },
    getCurrentChapter() {
      const openId =
        document.querySelector("dialog.site-reader[open]") &&
        (window.SunnyReader?.currentChapterId?.() || null);
      if (openId) return chapterNumFromId(openId);
      const p = loadProgress();
      return chapterNumFromId(p?.chapterId);
    },
    payload(mode = "talk", extra = {}) {
      const readChapter = this.getReadChapter();
      const currentChapter =
        mode === "reader" ? this.getCurrentChapter() : readChapter;
      return {
        mode,
        readChapter,
        currentChapter,
        ...extra,
      };
    },
  };

  function loadPrefs() {
    try {
      return Object.assign({ size: 22, paper: false }, JSON.parse(localStorage.getItem(STORAGE_PREFS) || "{}"));
    } catch (e) {
      return { size: 22, paper: false };
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_PREFS, JSON.stringify(prefs));
    } catch (e) {}
  }

  function currentSection() {
    const path = window.location.pathname.replace(/\\/g, "/");
    if (path.includes("sound.html")) return "listen";
    if (path.includes("album.html")) return "album";
    if (path.includes("your-thread")) return "thread";
    if (isHome) return "home";
    return "";
  }

  /* ---------- Header ---------- */
  function buildHeader() {
    document
      .querySelectorAll("body > header.topbar, body > header.world-page__topbar, body > header:not(.site-header):not(.chat__header)")
      .forEach((el) => el.remove());

    const section = currentSection();
    const header = document.createElement("header");
    header.className = "site-header";
    const homeLink = isHome
      ? ""
      : `<a href="${home}" class="site-nav__home">${t("home")}</a>`;
    header.innerHTML = `
      <a class="site-header__brand" href="${home}" aria-label="${t("brandAria")}">${t("brand")}</a>
      <div class="site-header__end">
        <nav class="site-nav site-nav--desktop" aria-label="Main">
          ${homeLink}
          <button type="button" class="site-nav__read${section === "home" ? " is-current" : ""}" data-nav-read>${t("read")}</button>
          <button type="button" class="site-nav__continue" data-nav-continue hidden>${t("continue")}</button>
          <a href="${base}pages/your-thread.html" class="${section === "thread" ? "is-current" : ""}">${t("yourThread")}</a>
          <a href="${base}pages/album.html" class="${section === "album" ? "is-current" : ""}">${t("album")}</a>
          <a href="${base}pages/sound.html" class="${section === "listen" ? "is-current" : ""}">${t("listen")}</a>
        </nav>
        <div class="site-header__tools">
          <div data-lang-switch-host></div>
          <button type="button" class="site-nav__burger" aria-label="${t("menu")}" data-nav-burger>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    `;
    document.body.prepend(header);
    document.body.classList.add("has-site-header");
    if (isHome) document.body.classList.add("page-home");

    const mobile = document.createElement("div");
    mobile.className = "site-nav-mobile";
    mobile.setAttribute("hidden", "");
    mobile.innerHTML = `
      <button type="button" class="site-nav-mobile__close" data-nav-close aria-label="${t("close")}">×</button>
      ${homeLink}
      <button type="button" data-nav-read>${t("read")}</button>
      <button type="button" class="site-nav__continue" data-nav-continue hidden>${t("continue")}</button>
      <a href="${base}pages/your-thread.html">${t("yourThread")}</a>
      <a href="${base}pages/album.html">${t("album")}</a>
      <a href="${base}pages/sound.html">${t("listen")}</a>
    `;
    document.body.appendChild(mobile);

    return { header, mobile };
  }

  function updateContinueButtons() {
    const progress = loadProgress();
    const buttons = document.querySelectorAll("[data-nav-continue]");
    const story = window.homepageStory;
    if (!progress?.chapterId || !story?.chapters) {
      buttons.forEach((b) => {
        b.hidden = true;
      });
      return;
    }
    const ch = story.chapters.find((c) => c.id === progress.chapterId);
    if (!ch) {
      buttons.forEach((b) => {
        b.hidden = true;
      });
      return;
    }
    buttons.forEach((b) => {
      b.hidden = false;
      b.textContent = t("continue");
      b.title = ch.toc || ch.title;
    });
  }

  function bindNav(header, mobile) {
    const openContents = () => {
      if (isHome) {
        const el = document.querySelector("#contents") || document.querySelector("#keeper");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.location.href = `${home}#contents`;
      }
      closeMobile();
    };

    const openContinue = () => {
      const progress = loadProgress();
      if (!progress?.chapterId) return;
      if (window.SunnyReader?.open) {
        window.SunnyReader.open(progress.chapterId, { restoreScroll: progress.scrollRatio || 0 });
      } else if (!isHome) {
        window.location.href = `${home}?read=${encodeURIComponent(progress.chapterId)}`;
      }
      closeMobile();
    };

    document.querySelectorAll("[data-nav-read]").forEach((b) => b.addEventListener("click", openContents));
    document.querySelectorAll("[data-nav-continue]").forEach((b) => b.addEventListener("click", openContinue));

    const burger = header.querySelector("[data-nav-burger]");
    const closeBtn = mobile.querySelector("[data-nav-close]");
    function openMobile() {
      mobile.hidden = false;
      mobile.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function closeMobile() {
      mobile.classList.remove("is-open");
      mobile.hidden = true;
      document.body.style.overflow = "";
    }
    burger?.addEventListener("click", openMobile);
    closeBtn?.addEventListener("click", closeMobile);
    mobile.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMobile));

    /* Header stays pinned — no hide-on-scroll. */
    header.classList.remove("is-hidden");

    updateContinueButtons();
  }

  /* ---------- Reader ---------- */
  function isSceneBreak(text) {
    const t = (text || "").trim();
    return t === "***" || t === "* * *" || t === "•••" || t === "· · ·";
  }

  function ensureReader() {
    let dialog = document.querySelector("#reader");
    if (dialog && !dialog.classList.contains("site-reader")) {
      dialog.classList.add("site-reader");
    }
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "reader";
      dialog.className = "site-reader";
      document.body.appendChild(dialog);
    }
    dialog.innerHTML = `
      <div class="site-reader__progress" aria-hidden="true"><span data-reader-progress></span></div>
      <div class="site-reader__bar">
        <button type="button" class="site-reader__back" data-reader-close>
          <span aria-hidden="true">←</span> ${t("readerHome")}
        </button>
        <div class="site-reader__bar-actions">
          <span class="site-reader__bar-label">${t("readerLabel")}</span>
          <button type="button" data-reader-aa aria-expanded="false">Aa</button>
        </div>
      </div>
      <div class="site-reader__settings" data-reader-settings>
        <label>${window.SunnyLocale?.getLang() === "ru" ? "Размер" : "Size"} <input type="range" min="18" max="28" step="1" data-reader-size></label>
        <label>${window.SunnyLocale?.getLang() === "ru" ? "Бумага" : "Paper"} <input type="checkbox" data-reader-paper></label>
      </div>
      <div class="site-reader__layout">
        <article class="site-reader__article">
          <div class="site-reader__mobile-art" data-reader-mobile-art hidden>
            <div class="notebook-page notebook-page--warm">
              <div class="notebook-page__spiral" aria-hidden="true"></div>
              <img class="notebook-page__img" data-reader-mobile-img alt="">
            </div>
          </div>
          <p class="site-reader__kicker" data-reader-kicker></p>
          <h2 class="site-reader__title" id="reader-title" data-reader-title></h2>
          <div class="site-reader__text" data-reader-text></div>
          <section class="site-reader__cast site-reader__cast--mobile" data-reader-cast-mobile hidden>
            <h3>${t("readerInChapter")}</h3>
            <ul class="site-reader__cast-list" data-reader-cast-mobile-list></ul>
          </section>
          <nav class="site-reader__nav" aria-label="${t("readerChapterNav")}">
            <button type="button" data-reader-prev></button>
            <a href="${home}#contents" data-reader-toc>${t("readerToc")}</a>
            <button type="button" data-reader-next></button>
          </nav>
        </article>
        <aside class="site-reader__rail" data-reader-rail>
          <div class="site-reader__rail-stage" data-reader-rail-cast>
            <div class="notebook-page notebook-page--warm site-reader__notebook" data-reader-notebook hidden>
              <div class="notebook-page__spiral" aria-hidden="true"></div>
              <div class="site-reader__art-layers" data-reader-art-layers>
                <div class="site-reader__art-stage" data-reader-art-stage>
                  <img class="notebook-page__img is-active" data-reader-art-a alt="">
                  <img class="notebook-page__img" data-reader-art-b alt="" aria-hidden="true">
                </div>
                <div class="site-reader__focus" data-reader-focus>
                  <p class="site-reader__focus-name" data-reader-focus-name></p>
                  <p class="site-reader__focus-line" data-reader-focus-line hidden></p>
                  <button type="button" class="site-reader__focus-talk" data-reader-focus-talk hidden></button>
                  <p class="site-reader__cast-others" data-reader-cast-others></p>
                </div>
              </div>
            </div>
          </div>
          <div class="site-reader__rail-chat" data-reader-rail-chat hidden>
            <div class="site-reader__rail-chat-bar">
              <strong data-reader-chat-name></strong>
              <button type="button" data-reader-chat-close>${t("readerBackList")}</button>
            </div>
            <div class="chat site-reader__chat" data-reader-chat-root>
              <div class="chat__log" data-reader-chat-log></div>
              <form class="chat__form" data-reader-chat-form>
                <input class="chat__input" type="text" placeholder="Спроси…" autocomplete="off" data-reader-chat-input>
                <button class="chat__send" type="submit">→</button>
              </form>
              <p class="ai-share-note" data-ai-share-note></p>
              <p class="chat__hint" data-reader-chat-hint aria-live="polite"></p>
            </div>
          </div>
        </aside>
      </div>
    `;
    return dialog;
  }

  function initReader(dialog) {
    const story = window.homepageStory;
    if (!story?.chapters?.length) {
      window.SunnyReader = { open: () => {} };
      return;
    }
    const meta = window.storyMeta || { characters: {}, chapters: {} };
    const chapters = story.chapters;
    const prefs = loadPrefs();
    let currentIndex = 0;
    let lastFocus = null;
    let restoreScroll = 0;
    let mentionObserver = null;
    let mentionScrollSync = null;
    let artSyncFn = null;
    let chatHistory = [];
    let chatLoading = false;
    let chatApiId = "";
    let suppressUrlSync = false;
    let closingViaHistory = false;
    let openedWithPush = false;
    let chapterArtSrc = "";
    let chapterArtLabel = "";
    let activeArtKey = "chapter";
    let activeArtLabel = "";
    let artFrontIsA = true;
    let artSwapTimer = 0;
    let firstAppearances = []; /* { id, el, name, src } in document order */
    let speechLogCache = null;
    let speechLogChapterId = "";
    let chapterArtHoldUntil = 0;
    let chapterArtHoldTimer = 0;
    let artHoverTalk = false;
    let pinnedArtKey = null; /* manual cast pick — don't snap back to Dryad */
    let pinnedArtScroll = 0;

    const progressEl = dialog.querySelector("[data-reader-progress]");
    const settings = dialog.querySelector("[data-reader-settings]");
    const sizeInput = dialog.querySelector("[data-reader-size]");
    const paperInput = dialog.querySelector("[data-reader-paper]");
    const article = dialog.querySelector(".site-reader__article");
    const rail = dialog.querySelector("[data-reader-rail]");
    const railCast = dialog.querySelector("[data-reader-rail-cast]");
    const railChat = dialog.querySelector("[data-reader-rail-chat]");
    const chatLog = dialog.querySelector("[data-reader-chat-log]");
    const chatForm = dialog.querySelector("[data-reader-chat-form]");
    const chatInput = dialog.querySelector("[data-reader-chat-input]");
    const chatHint = dialog.querySelector("[data-reader-chat-hint]");

    function applyPrefs() {
      article.style.setProperty("--reader-size", `${prefs.size}px`);
      dialog.classList.toggle("is-paper", !!prefs.paper);
      if (sizeInput) sizeInput.value = String(prefs.size);
      if (paperInput) paperInput.checked = !!prefs.paper;
      savePrefs(prefs);
    }
    applyPrefs();

    function kickerFor(ch) {
      const info = meta.chapters?.[ch.id];
      const en = window.SunnyLocale?.getLang() === "en";
      if (!info || info.num === 0) {
        return window.SunnyI18n?.t?.("reader.partOneIntro") ||
          (en ? "Part One · Prologue" : "Часть первая · Вступление");
      }
      const tpl =
        window.SunnyI18n?.t?.("reader.partOneChapter") ||
        (en ? "Part One · Chapter {n}" : "Часть первая · Глава {n}");
      return tpl.replace("{n}", String(info.num));
    }

    function aliasHit(text, alias) {
      if (!alias) return false;
      if (alias.length >= 4) return text.includes(alias);
      try {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(?:^|[^A-Za-zА-Яа-яЁё])${escaped}(?:[^A-Za-zА-Яа-яЁё]|$)`, "i").test(text);
      } catch (e) {
        return text.includes(alias);
      }
    }

    function mentionsInText(text, castIds) {
      const found = [];
      castIds.forEach((id) => {
        const c = meta.characters?.[id];
        if (!c?.aliases?.length) return;
        if (c.aliases.some((alias) => aliasHit(text, alias))) found.push(id);
      });
      return found;
    }

    function unwrapItalic(text) {
      const raw = String(text || "");
      const m = raw.match(/^<em>([\s\S]*)<\/em>$/i);
      if (m) return { italic: true, text: m[1] };
      return { italic: false, text: raw };
    }

    function renderText(paragraphs, castIds) {
      const frag = document.createDocumentFragment();
      paragraphs.forEach((t) => {
        if (isSceneBreak(t)) {
          const knot = document.createElement("div");
          knot.className = "site-reader__knot";
          knot.setAttribute("aria-hidden", "true");
          frag.appendChild(knot);
          return;
        }
        const { italic, text } = unwrapItalic(t);
        const p = document.createElement("p");
        if (italic) p.classList.add("is-italic");
        p.textContent = text;
        const ids = mentionsInText(text, castIds);
        if (ids.length) p.dataset.mentions = ids.join(" ");
        frag.appendChild(p);
      });
      return frag;
    }

    function castItem(id) {
      try { window.storyMeta?.applyLang?.(window.SunnyLocale?.getLang?.() || "en"); } catch (e) {}

      const c = meta.characters?.[id];
      if (!c) return null;
      const li = document.createElement("li");
      li.dataset.castId = id;
      const img = document.createElement("img");
      img.src = c.img;
      img.alt = c.name;
      img.loading = "lazy";
      img.onerror = () => {
        img.style.opacity = "0.2";
      };
      const el = document.createElement("div");
      el.className = "site-reader__cast-card";
      const pageLink = document.createElement("a");
      pageLink.href = c.page;
      pageLink.className = "site-reader__cast-page";
      pageLink.appendChild(img);
      const name = document.createElement("strong");
      name.textContent = c.name;
      pageLink.appendChild(name);
      const talk = document.createElement("a");
      talk.className = "site-reader__cast-talk";
      talk.textContent = t("talkGeneric") || (window.SunnyLocale?.getLang?.() === "ru" ? "Поговорить" : "Talk");
      talk.href = `${base}pages/talk.html?c=${encodeURIComponent(id)}`;
      talk.addEventListener("click", (e) => {
        e.preventDefault();
        openTalkPage(id);
      });
      el.append(pageLink, talk);
      li.appendChild(el);
      return li;
    }

    function renderCast(ch) {
      const ids = meta.chapters?.[ch.id]?.cast || [];
      const mobileBox = dialog.querySelector("[data-reader-cast-mobile]");
      const mobileList = dialog.querySelector("[data-reader-cast-mobile-list]");
      mobileList.replaceChildren();
      ids.forEach((id) => {
        const mobileItem = castItem(id);
        if (mobileItem) mobileList.appendChild(mobileItem);
      });
      mobileBox.hidden = !mobileList.children.length;
      updateFocusUI();
      closeRailChat();
    }

    function talkInvite(c) {
      const form = (c && (c.nameWith || c.name)) || "";
      const lang = window.SunnyLocale?.getLang?.() || "en";
      if (!form) return t("talkGeneric");
      if (lang === "ru") {
        // «со» before с/з/ш/ж + consonant (со Злым Лесом)
        const prep = /^[сзшжСЗШЖ][^аеёиоуыэюяАЕЁИОУЫЭЮЯ]/.test(form) ? "со" : "с";
        return `Поговорить ${prep} ${form}`;
      }
      return t("talkWith", { name: c.name || form });
    }

    const SPEECH_VERBS =
      "сказал|сказала|спросил|спросила|позвал|позвала|ответил|ответила|прошептал|прошептала|пробурчал|пробурчала|крикнул|крикнула|добавил|добавила|признал(?:а|ся|ась)?|сообщил|сообщила|повторил|повторила|продолжил|продолжила|заметил|заметила|отозвался|отозвалась|буркнул|буркнула|шепнул|шепнула|воскликнул|воскликнула|уточнил|уточнила|перебил|перебила|промолвил|промолвила|произнёс|произнес|произнесла";

    function charIdFromSpeakerToken(token, castIds) {
      const t = (token || "").trim();
      if (!t) return null;
      for (const id of castIds) {
        const c = meta.characters?.[id];
        if (!c) continue;
        if (c.name === t) return id;
        if ((c.aliases || []).some((a) => a === t)) return id;
      }
      return null;
    }

    function cleanSpeechLine(raw) {
      return (raw || "")
        .replace(/\s+/g, " ")
        .replace(/^[\s—–−-]+|[\s—–−-]+$/g, "")
        .replace(/[.,;:!?…]+$/g, (m) => (/[!?…]/.test(m) ? m.slice(-1) : ""))
        .trim();
    }

    function pushSpeech(list, id, el, raw) {
      const text = cleanSpeechLine(raw);
      if (!id || !text || text.length < 2) return;
      list.push({ id, el, text });
    }

    function buildSpeechLog(castIds) {
      const log = [];
      let lastMale = null;
      let lastFemale = null;
      let lastAny = null;
      let turnA = null;
      let turnB = null;
      let expectNext = null;
      const attrRe = new RegExp(
        `—\\s*([\\s\\S]+?)\\s*([,?!])\\s*—\\s*(?:${SPEECH_VERBS})\\s+([А-ЯЁA-Z][а-яёa-zА-ЯЁA-Za-z]*(?:\\s+[А-ЯЁA-Z][а-яёa-zА-ЯЁA-Za-z]+)?|он|она)`,
        "gi"
      );

      const noteNarrativeNames = (text) => {
        castIds.forEach((id) => {
          const c = meta.characters?.[id];
          if (!c) return;
          const hit =
            aliasHit(text, c.name) ||
            (c.aliases || []).some((a) => /[А-ЯЁа-яё]/.test(a) && aliasHit(text, a));
          if (!hit) return;
          if (c.gender === "f") lastFemale = id;
          else lastMale = id;
          lastAny = id;
        });
      };

      dialog.querySelectorAll("[data-reader-text] p").forEach((p) => {
        const text = (p.textContent || "").trim();
        if (!text) return;
        const isDialogue = /^[—–−]/.test(text);
        if (!isDialogue) {
          noteNarrativeNames(text);
          if (text.length > 90) {
            expectNext = null;
            turnA = null;
            turnB = null;
          }
          return;
        }

        let matchedAttr = false;
        attrRe.lastIndex = 0;
        let m;
        while ((m = attrRe.exec(text))) {
          matchedAttr = true;
          const speech = m[1];
          const who = m[3];
          let id = null;
          if (/^он$/i.test(who)) id = lastMale || lastAny;
          else if (/^она$/i.test(who)) id = lastFemale || lastAny;
          else id = charIdFromSpeakerToken(who, castIds);

          if (id) {
            const c = meta.characters[id];
            if (c?.gender === "f") lastFemale = id;
            else lastMale = id;
            lastAny = id;
            if (!turnA) turnA = id;
            else if (id !== turnA && !turnB) turnB = id;
            expectNext = turnA && turnB ? (id === turnA ? turnB : turnA) : null;
          }
          pushSpeech(log, id, p, speech);

          const after = text.slice(m.index + m[0].length);
          const cont = after.match(/^\s*\.\s*—\s*([\s\S]+)$/);
          if (cont && id) {
            const more = cont[1].split(/\s*—\s*(?=(?:сказал|сказала|спросил|спросила|позвал|позвала)\b)/)[0];
            pushSpeech(log, id, p, more);
          }
        }

        if (matchedAttr) return;

        // Unattributed dialogue turns: alternate between the last two speakers
        const bare = text.replace(/^[—–−]\s*/, "");
        const address = bare.match(/^([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?)\s*[.,!?]/);
        let speaker = expectNext;
        if (!speaker && address) {
          const addressed = charIdFromSpeakerToken(address[1], castIds);
          if (addressed) {
            if (lastFemale && lastFemale !== addressed) speaker = lastFemale;
            else if (lastMale && lastMale !== addressed) speaker = lastMale;
            else {
              speaker =
                castIds.find(
                  (id) => id !== addressed && meta.characters?.[id]?.gender !== meta.characters?.[addressed]?.gender
                ) || null;
            }
          }
        }
        if (!speaker) speaker = lastAny;
        const parts = bare.split(/\s*—\s*/).map((s) => s.trim()).filter(Boolean);
        parts.forEach((part) => pushSpeech(log, speaker, p, part));
        if (speaker && turnA && turnB) {
          expectNext = speaker === turnA ? turnB : turnA;
        } else if (speaker && turnA && speaker !== turnA && !turnB) {
          turnB = speaker;
          expectNext = turnA;
        } else if (speaker && !turnA) {
          turnA = speaker;
        }
        if (speaker) {
          lastAny = speaker;
          if (meta.characters[speaker]?.gender === "f") lastFemale = speaker;
          else lastMale = speaker;
        }
      });
      return log;
    }

    function readingFocusOffset() {
      return dialog.scrollTop + dialog.clientHeight * 0.3;
    }

    function getSpeechLog() {
      const ch = chapters[currentIndex];
      const id = ch?.id || "";
      if (speechLogCache && speechLogChapterId === id) return speechLogCache;
      const castIds = meta.chapters?.[id]?.cast || [];
      speechLogCache = buildSpeechLog(castIds);
      speechLogChapterId = id;
      return speechLogCache;
    }

    function latestPassedLine(charId) {
      if (!isCharacterArt(charId)) return "";
      // A bit below the art-swap line so end-of-chapter speeches still count as read
      const focus = dialog.scrollTop + dialog.clientHeight * 0.72;
      const log = getSpeechLog();
      let best = "";
      for (let i = 0; i < log.length; i++) {
        const s = log[i];
        if (s.id !== charId) continue;
        if (offsetInDialog(s.el) <= focus) best = s.text;
      }
      return best;
    }

    function updateFocusUI() {
      const nameEl = dialog.querySelector("[data-reader-focus-name]");
      const lineEl = dialog.querySelector("[data-reader-focus-line]");
      const talkEl = dialog.querySelector("[data-reader-focus-talk]");
      const othersEl = dialog.querySelector("[data-reader-cast-others]");
      if (!nameEl || !talkEl || !othersEl || !lineEl) return;

      // No changing quote-from-text under characters — only art, name, talk.
      lineEl.textContent = "";
      lineEl.hidden = true;

      if (isCharacterArt(activeArtKey)) {
        const c = meta.characters[activeArtKey];
        nameEl.textContent = c.name;
        nameEl.hidden = false;
        talkEl.hidden = false;
        talkEl.textContent = t("talkGeneric") || (window.SunnyLocale?.getLang?.() === "ru" ? "Поговорить" : "Talk");
        talkEl.dataset.talk = activeArtKey;
      } else {
        nameEl.textContent = activeArtLabel || chapterArtLabel || "";
        nameEl.hidden = !nameEl.textContent;
        talkEl.hidden = true;
        talkEl.textContent = "";
        delete talkEl.dataset.talk;
      }

      const ch = chapters[currentIndex];
      const ids = meta.chapters?.[ch?.id]?.cast || [];
      othersEl.replaceChildren();
      const others = ids.filter((id) => id !== activeArtKey && meta.characters?.[id]);
      others.forEach((id, i) => {
        if (i) {
          const sep = document.createElement("span");
          sep.className = "site-reader__cast-sep";
          sep.textContent = " · ";
          sep.setAttribute("aria-hidden", "true");
          othersEl.appendChild(sep);
        }
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "site-reader__cast-other";
        btn.dataset.showArt = id;
        btn.textContent = meta.characters[id].name;
        othersEl.appendChild(btn);
      });
      othersEl.hidden = !others.length;
    }

    function applyArtOrientation(notebook, art) {
      notebook.classList.remove("is-portrait", "is-landscape", "is-square");
      const w = art.naturalWidth;
      const h = art.naturalHeight;
      if (!w || !h) return;
      const ratio = w / h;
      if (ratio > 1.12) notebook.classList.add("is-landscape");
      else if (ratio < 0.88) notebook.classList.add("is-portrait");
      else notebook.classList.add("is-square");
    }

    function artLayers() {
      return {
        notebook: dialog.querySelector("[data-reader-notebook]"),
        a: dialog.querySelector("[data-reader-art-a]"),
        b: dialog.querySelector("[data-reader-art-b]"),
        mobileWrap: dialog.querySelector("[data-reader-mobile-art]"),
        mobileImg: dialog.querySelector("[data-reader-mobile-img]"),
      };
    }

    function setActiveCast(id) {
      // kept for call sites; rail focus UI syncs from activeArtKey
      void id;
      updateFocusUI();
    }

    function isCharacterArt(key) {
      return !!key && key !== "chapter" && !!meta.characters?.[key];
    }

    function sizeArtStageToDrawing() {
      const stage = dialog.querySelector("[data-reader-art-stage]");
      const layers = dialog.querySelector("[data-reader-art-layers]");
      const img = dialog.querySelector(".site-reader__art-stage .notebook-page__img.is-active");
      const focus = dialog.querySelector("[data-reader-focus]");
      if (!stage || !layers || !img || !img.naturalWidth || !img.naturalHeight) return;
      const lw = layers.clientWidth || stage.clientWidth;
      if (!lw) return;
      const railH = dialog.querySelector("[data-reader-rail]")?.clientHeight || dialog.clientHeight;
      const focusH = focus ? focus.getBoundingClientRect().height : 72;
      // Leave room above/below so the whole block can sit centered in the rail
      const maxH = Math.max(140, Math.min(railH - focusH - 48, railH * 0.58));
      const byWidth = (img.naturalHeight / img.naturalWidth) * lw;
      stage.style.height = `${Math.round(Math.min(byWidth, maxH))}px`;
    }

    function activeArtDisplayRect() {
      const stage = dialog.querySelector("[data-reader-art-stage]");
      const img = dialog.querySelector(".site-reader__art-stage .notebook-page__img.is-active");
      if (!stage || !img || !img.naturalWidth || !img.naturalHeight) return null;
      const lw = stage.clientWidth;
      const lh = stage.clientHeight;
      if (!lw || !lh) return null;
      const scale = Math.min(lw / img.naturalWidth, lh / img.naturalHeight);
      const dispW = img.naturalWidth * scale;
      const dispH = img.naturalHeight * scale;
      const left = (lw - dispW) / 2;
      const top = (lh - dispH) / 2;
      return { stage, left, top, width: dispW, height: dispH };
    }

    function pointInActiveArt(clientX, clientY) {
      const rect = activeArtDisplayRect();
      if (!rect) return false;
      const box = rect.stage.getBoundingClientRect();
      const x = clientX - box.left;
      const y = clientY - box.top;
      return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;
    }

    function syncArtInteract() {
      const layers = dialog.querySelector("[data-reader-art-layers]");
      if (!layers) return;
      const talkable = isCharacterArt(activeArtKey);
      layers.classList.toggle("is-talkable", talkable);
      if (!talkable) {
        layers.classList.remove("is-over-art");
        layers.removeAttribute("role");
        layers.removeAttribute("tabindex");
        layers.removeAttribute("aria-label");
        artHoverTalk = false;
      } else {
        layers.setAttribute("role", "button");
        layers.setAttribute("tabindex", "0");
        layers.setAttribute(
          "aria-label",
          talkInvite(meta.characters[activeArtKey] || { name: activeArtLabel })
        );
      }
      updateFocusUI();
      requestAnimationFrame(() => sizeArtStageToDrawing());
    }

    function showArt(src, key, alt) {
      const { notebook, a, b, mobileWrap, mobileImg } = artLayers();
      if (!notebook || !a || !b) return;
      if (!src) {
        notebook.hidden = true;
        if (mobileWrap) mobileWrap.hidden = true;
        activeArtKey = "";
        activeArtLabel = "";
        artHoverTalk = false;
        syncArtInteract();
        return;
      }
      notebook.hidden = false;
      activeArtLabel = alt || "";
      if (mobileWrap && mobileImg) {
        mobileWrap.hidden = false;
        mobileImg.src = src;
        mobileImg.alt = alt || "";
        applyArtOrientation(mobileWrap.querySelector(".notebook-page") || notebook, mobileImg);
      }
      if (key === activeArtKey) {
        const front = artFrontIsA ? a : b;
        if (front.getAttribute("src") === src) {
          syncArtInteract();
          return;
        }
      }
      const front = artFrontIsA ? a : b;
      const back = artFrontIsA ? b : a;
      const commit = () => {
        applyArtOrientation(notebook, back);
        back.alt = alt || "";
        back.classList.add("is-active");
        front.classList.remove("is-active");
        front.setAttribute("aria-hidden", "true");
        back.removeAttribute("aria-hidden");
        artFrontIsA = !artFrontIsA;
        activeArtKey = key;
        artHoverTalk = false;
        syncArtInteract();
      };
      if (back.getAttribute("src") === src && back.complete && back.naturalWidth) {
        window.clearTimeout(artSwapTimer);
        artSwapTimer = window.setTimeout(commit, 30);
        return;
      }
      back.onload = () => {
        back.onload = null;
        commit();
      };
      back.src = src;
      if (back.complete && back.naturalWidth) {
        back.onload = null;
        commit();
      }
    }

    function earliestAliasIndex(text, aliases) {
      let best = -1;
      (aliases || []).forEach((alias) => {
        if (!alias || !aliasHit(text, alias)) return;
        const idx = text.indexOf(alias);
        if (idx < 0) return;
        if (best < 0 || idx < best) best = idx;
      });
      return best;
    }

    function buildFirstAppearances(castIds) {
      const seen = new Set();
      const list = [];
      dialog.querySelectorAll("[data-reader-text] p").forEach((p) => {
        const text = p.textContent || "";
        const hits = [];
        castIds.forEach((id) => {
          if (seen.has(id)) return;
          const c = meta.characters?.[id];
          if (!c?.img) return;
          const idx = earliestAliasIndex(text, c.aliases);
          if (idx >= 0) hits.push({ id, idx, name: c.name, src: c.img });
        });
        hits.sort((a, b) => a.idx - b.idx);
        hits.forEach((h, stagger) => {
          if (seen.has(h.id)) return;
          seen.add(h.id);
          list.push({ id: h.id, el: p, name: h.name, src: h.src, stagger });
        });
      });
      return list;
    }

    function offsetInDialog(el) {
      const dr = dialog.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      return er.top - dr.top + dialog.scrollTop;
    }

    function pinnedArt() {
      if (!pinnedArtKey) return null;
      // Release pin after a real scroll so reading can take over again
      if (Math.abs(dialog.scrollTop - pinnedArtScroll) > 120) {
        pinnedArtKey = null;
        return null;
      }
      if (pinnedArtKey === "chapter" && chapterArtSrc) {
        return { key: "chapter", src: chapterArtSrc, label: chapterArtLabel };
      }
      const c = meta.characters?.[pinnedArtKey];
      if (!c?.img) {
        pinnedArtKey = null;
        return null;
      }
      return { key: pinnedArtKey, src: c.img, label: c.name };
    }

    function pinArt(key) {
      pinnedArtKey = key || null;
      pinnedArtScroll = dialog.scrollTop;
    }

    function artForScrollPosition() {
      const pinned = pinnedArt();
      if (pinned) return pinned;

      // Hold chapter art (Dryad etc.) for a few seconds at chapter open
      if (chapterArtSrc && Date.now() < chapterArtHoldUntil && dialog.scrollTop < 40) {
        return {
          key: "chapter",
          src: chapterArtSrc,
          label: chapterArtLabel,
        };
      }
      // Near the very top — chapter art, but gently (pin protects manual picks)
      if (chapterArtSrc && dialog.scrollTop < 48) {
        return {
          key: "chapter",
          src: chapterArtSrc,
          label: chapterArtLabel,
        };
      }
      // Reading line in the upper third: name must reach it before art swaps.
      // Mid-viewport (0.5) swapped too early and blocked scroll-back to chapter art.
      const focusOffset = dialog.scrollTop + dialog.clientHeight * 0.3;
      let current = {
        key: "chapter",
        src: chapterArtSrc,
        label: chapterArtLabel,
      };
      for (let i = 0; i < firstAppearances.length; i++) {
        const m = firstAppearances[i];
        // Stagger same-paragraph first appearances so earlier name unlocks first
        const unlockAt = offsetInDialog(m.el) + (m.stagger || 0) * (dialog.clientHeight * 0.22);
        if (unlockAt <= focusOffset) {
          current = { key: m.id, src: m.src, label: m.name };
        } else {
          break;
        }
      }
      return current;
    }

    function setNotebook(ch) {
      chapterArtSrc = meta.chapters?.[ch.id]?.image || "";
      const isDryadArt = /dryad\.(jpe?g|png|webp)$/i.test(chapterArtSrc);
      chapterArtLabel = isDryadArt ? t("dryadName") : ch.title || "";
      activeArtKey = "";
      artFrontIsA = true;
      firstAppearances = [];
      speechLogCache = null;
      speechLogChapterId = "";
      pinnedArtKey = null;
      pinnedArtScroll = 0;
      window.clearTimeout(chapterArtHoldTimer);
      // Hold only when opening near the top — avoid a 1s Dryad flash on mid-chapter restore
      const openAtTop = restoreScroll < 0.02;
      const holdMs = ch.id === "prologue" || ch.id === "ch1" ? 5200 : 2200;
      chapterArtHoldUntil = chapterArtSrc && openAtTop ? Date.now() + holdMs : 0;
      const { notebook, a, b } = artLayers();
      if (a) {
        a.classList.add("is-active");
        a.removeAttribute("aria-hidden");
        a.removeAttribute("src");
      }
      if (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-hidden", "true");
        b.removeAttribute("src");
      }
      if (chapterArtSrc && openAtTop) showArt(chapterArtSrc, "chapter", chapterArtLabel);
      else if (!chapterArtSrc && notebook) notebook.hidden = true;
      setActiveCast(null);
    }

    function observeMentions() {
      if (mentionObserver) {
        mentionObserver.disconnect();
        mentionObserver = null;
      }
      if (mentionScrollSync) {
        dialog.removeEventListener("scroll", mentionScrollSync);
        dialog.removeEventListener("scrollend", mentionScrollSync);
        mentionScrollSync = null;
      }
      artSyncFn = null;
      window.clearTimeout(chapterArtHoldTimer);
      const ch = chapters[currentIndex];
      const castIds = meta.chapters?.[ch?.id]?.cast || [];
      firstAppearances = buildFirstAppearances(castIds);
      const syncArt = () => {
        const next = artForScrollPosition();
        if (next.src) {
          showArt(next.src, next.key, next.label);
          setActiveCast(next.key === "chapter" ? null : next.key);
        } else {
          showArt(chapterArtSrc, "chapter", chapterArtLabel);
          setActiveCast(null);
        }
      };
      if (chapterArtHoldUntil > Date.now()) {
        chapterArtHoldTimer = window.setTimeout(() => {
          if (dialog.open) syncArt();
        }, chapterArtHoldUntil - Date.now() + 30);
      }
      let artRaf = 0;
      const scheduleArtSync = () => {
        if (artRaf) return;
        artRaf = requestAnimationFrame(() => {
          artRaf = 0;
          syncArt();
        });
      };
      artSyncFn = syncArt;
      mentionScrollSync = scheduleArtSync;
      dialog.addEventListener("scroll", scheduleArtSync, { passive: true });
      dialog.addEventListener("scrollend", scheduleArtSync);
      const paras = firstAppearances.map((m) => m.el);
      if (paras.length && "IntersectionObserver" in window) {
        mentionObserver = new IntersectionObserver(scheduleArtSync, {
          root: dialog,
          rootMargin: "-5% 0px -20% 0px",
          threshold: [0, 0.1, 0.35, 0.7],
        });
        paras.forEach((p) => mentionObserver.observe(p));
      }
      syncArt();
    }

    function apiBase() {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") return window.location.origin;
      if (window.location.protocol === "file:") return "https://ai-character-platform.onrender.com";
      return window.location.origin;
    }

    function appendChat(text, isUser) {
      const wrap = document.createElement("div");
      wrap.className = "chat__msg" + (isUser ? " chat__msg--user" : " chat__msg--npc");
      const bubble = document.createElement("div");
      bubble.className = "chat__bubble";
      bubble.textContent = text;
      wrap.appendChild(bubble);
      chatLog.appendChild(wrap);
      chatLog.scrollTop = chatLog.scrollHeight;
    }

    function openTalkPage(id, seedText) {
      const c = meta.characters?.[id];
      if (!c) return;
      artHoverTalk = false;
      const layers = dialog.querySelector("[data-reader-art-layers]");
      layers?.classList.remove("is-over-art");
      closeRailChat();
      persistPosition();
      const opts = { seed: (seedText || "").trim() };
      if (window.SunnyTalk?.go) {
        window.SunnyTalk.go(id, opts);
        return;
      }
      // Fallback if talk-nav not loaded yet
      try {
        sessionStorage.setItem(
          "sunnychimera-talk-return",
          JSON.stringify({
            href: window.location.href,
            reader: true,
            scrollRatio: (() => {
              const max = dialog.scrollHeight - dialog.clientHeight;
              return max > 0 ? dialog.scrollTop / max : 0;
            })(),
            chapterId: chapters[currentIndex]?.id || "",
            at: Date.now(),
          })
        );
        if (opts.seed) sessionStorage.setItem("sunnychimera-talk-seed", opts.seed);
      } catch (e) {}
      window.location.href = `${base}pages/talk.html?c=${encodeURIComponent(id)}`;
    }

    function openRailChat(id, seedText) {
      openTalkPage(id, seedText);
    }

    function closeRailChat() {
      railChat.hidden = true;
      railCast.hidden = false;
      rail.classList.remove("is-chat-open");
      chatHistory = [];
      chatLoading = false;
    }

    async function sendChatMessage(rawText) {
      if (chatLoading || !chatApiId) return;
      const text = (rawText || "").trim();
      if (!text) return;
      chatLoading = true;
      if (chatInput) {
        chatInput.value = "";
        chatInput.disabled = true;
      }
      const already =
        chatHistory.length &&
        chatHistory[chatHistory.length - 1].role === "user" &&
        chatHistory[chatHistory.length - 1].text === text;
      if (!already) {
        appendChat(text, true);
        chatHistory.push({ role: "user", text });
      }
      if (chatHint) chatHint.textContent = "…";
      try {
        const ctx = window.SunnyChatContext?.payload?.("reader") || {
          mode: "reader",
          readChapter: 0,
          currentChapter: 0,
        };
        const res = await fetch(apiBase() + "/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: chatHistory.slice(0, -1),
            provider: "auto",
            character: chatApiId,
            ...ctx,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.code === "rate_limit" || res.status === 429) {
            const chMeta =
              Object.values(meta.characters || {}).find(
                (c) => c.apiId === chatApiId || c.id === chatApiId
              ) || {};
            const wait =
              chMeta.waitPhrase ||
              data.waitPhrase ||
              (document.documentElement.lang === "ru" ? "…" : "…");
            const hint =
              data.retryHint ||
              (document.documentElement.lang === "ru"
                ? "Попробуй ещё раз через минуту"
                : "Try again in a minute");
            if (chatHint) {
              chatHint.className = "chat__hint chat__hint--rate-limit";
              chatHint.replaceChildren();
              const w = document.createElement("span");
              w.className = "chat__rate-wait";
              w.textContent = wait;
              const btn = document.createElement("button");
              btn.type = "button";
              btn.className = "chat__rate-retry";
              btn.textContent = hint;
              btn.addEventListener("click", () => sendChatMessage(text));
              chatHint.append(w, btn);
            }
          } else {
            appendChat(typeof data.error === "string" ? data.error : "Ошибка сервера", false);
            chatHistory.pop();
            if (chatHint) chatHint.textContent = "";
          }
        } else {
          const reply = (data.text || "").trim() || "…";
          appendChat(reply, false);
          chatHistory.push({ role: "model", text: reply });
          if (chatHint) {
            chatHint.className = "chat__hint";
            chatHint.textContent = "";
          }
        }
      } catch (err) {
        appendChat("Ошибка сети", false);
        chatHistory.pop();
        if (chatHint) chatHint.textContent = "";
      } finally {
        chatLoading = false;
        if (chatInput) {
          chatInput.disabled = false;
          chatInput.focus();
        }
      }
    }

    chatForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      sendChatMessage(chatInput?.value);
    });

    dialog.querySelector("[data-reader-focus-talk]")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = e.currentTarget.dataset.talk || activeArtKey;
      if (isCharacterArt(id)) openTalkPage(id);
    });

    dialog.querySelector("[data-reader-chat-close]")?.addEventListener("click", closeRailChat);

    const artLayersEl = dialog.querySelector("[data-reader-art-layers]");
    if (artLayersEl) {
      artLayersEl.addEventListener("mousemove", (e) => {
        if (!isCharacterArt(activeArtKey)) {
          artLayersEl.classList.remove("is-over-art");
          return;
        }
        artLayersEl.classList.toggle("is-over-art", pointInActiveArt(e.clientX, e.clientY));
      });
      artLayersEl.addEventListener("mouseleave", () => {
        artLayersEl.classList.remove("is-over-art");
      });
      artLayersEl.addEventListener("click", (e) => {
        if (e.target.closest("[data-reader-focus]")) return;
        if (!isCharacterArt(activeArtKey)) return;
        if (!pointInActiveArt(e.clientX, e.clientY)) return;
        e.preventDefault();
        openRailChat(activeArtKey);
      });
      artLayersEl.addEventListener("keydown", (e) => {
        if (!isCharacterArt(activeArtKey)) return;
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        openRailChat(activeArtKey);
      });
    }

    dialog.addEventListener("click", (e) => {
      const showArtBtn = e.target.closest("[data-show-art]");
      if (showArtBtn && dialog.contains(showArtBtn)) {
        e.preventDefault();
        const id = showArtBtn.dataset.showArt;
        const c = meta.characters?.[id];
        if (c?.img) {
          // Eager key so focus line / ask target update before art crossfade finishes
          pinArt(id);
          activeArtKey = id;
          activeArtLabel = c.name;
          showArt(c.img, id, c.name);
          setActiveCast(id);
        }
        return;
      }
      const talk = e.target.closest("[data-talk]");
      if (!talk || !dialog.contains(talk)) return;
      if (talk.matches("[data-reader-focus-talk]")) return;
      e.preventDefault();
      openRailChat(talk.dataset.talk);
    });

    function updateNav() {
      const prev = chapters[currentIndex - 1];
      const next = chapters[currentIndex + 1];
      const prevBtn = dialog.querySelector("[data-reader-prev]");
      const nextBtn = dialog.querySelector("[data-reader-next]");
      if (prev) {
        prevBtn.disabled = false;
        prevBtn.textContent = `← ${prev.toc || prev.title}`;
      } else {
        prevBtn.disabled = true;
        prevBtn.textContent = "←";
      }
      if (next) {
        nextBtn.disabled = false;
        nextBtn.textContent = `${next.toc || next.title} →`;
      } else {
        nextBtn.disabled = false;
        nextBtn.textContent = story.endNote || t("readerEnd");
      }
    }

    function persistPosition() {
      const ch = chapters[currentIndex];
      if (!ch) return;
      const max = dialog.scrollHeight - dialog.clientHeight;
      const ratio = max > 0 ? dialog.scrollTop / max : 0;
      saveProgress({ chapterId: ch.id, scrollRatio: ratio, updatedAt: Date.now() });
      updateContinueButtons();
    }

    function updateProgressBar() {
      const max = dialog.scrollHeight - dialog.clientHeight;
      const ratio = max > 0 ? dialog.scrollTop / max : 0;
      if (progressEl) progressEl.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
    }

    function readerUrl(chapterId) {
      const url = new URL(window.location.href);
      if (chapterId) url.searchParams.set("read", chapterId);
      else url.searchParams.delete("read");
      return url.pathname + url.search + url.hash;
    }

    function syncReaderUrl(chapterId, mode) {
      if (suppressUrlSync) return;
      const href = readerUrl(chapterId);
      const state = chapterId ? { sunnyReader: true, chapterId } : { sunnyReader: false };
      if (mode === "push") history.pushState(state, "", href);
      else history.replaceState(state, "", href);
    }

    function leaveReader() {
      if (!dialog.open) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get("read") && openedWithPush) {
        closingViaHistory = true;
        openedWithPush = false;
        history.back();
        return;
      }
      if (params.get("read")) syncReaderUrl(null, "replace");
      dialog.close();
    }

    function open(keyOrIndex, opts = {}) {
      const index =
        typeof keyOrIndex === "number"
          ? keyOrIndex
          : chapters.findIndex(
              (c) =>
                c.id === keyOrIndex ||
                (keyOrIndex === "beginning" && c.id === "prologue") ||
                (keyOrIndex === "child" && c.id === "ch1")
            );
      if (index < 0) return;
      currentIndex = index;
      restoreScroll = opts.restoreScroll || 0;
      const ch = chapters[index];
      const castIds = meta.chapters?.[ch.id]?.cast || [];
      dialog.querySelector("[data-reader-kicker]").textContent = kickerFor(ch);
      dialog.querySelector("[data-reader-title]").textContent = ch.title;
      dialog.querySelector("[data-reader-text]").replaceChildren(renderText(ch.text, castIds));
      setNotebook(ch);
      renderCast(ch);
      updateNav();
      const wasOpen = dialog.open;
      if (!wasOpen) {
        lastFocus = document.activeElement;
        dialog.showModal();
        document.body.style.overflow = "hidden";
        document.documentElement.classList.add("reader-open");
        if (!opts.fromPopstate && !opts.fromUrl) {
          syncReaderUrl(ch.id, "push");
          openedWithPush = true;
        } else if (opts.fromUrl) {
          syncReaderUrl(ch.id, "replace");
          openedWithPush = false;
        }
      } else if (!opts.fromPopstate) {
        syncReaderUrl(ch.id, "replace");
      }
      requestAnimationFrame(() => {
        const max = dialog.scrollHeight - dialog.clientHeight;
        dialog.scrollTop = restoreScroll * max;
        updateProgressBar();
        persistPosition();
        observeMentions();
      });
    }

    dialog.querySelector("[data-reader-close]").addEventListener("click", leaveReader);
    dialog.addEventListener("close", () => {
      persistPosition();
      document.body.style.overflow = "";
      document.documentElement.classList.remove("reader-open");
      lastFocus?.focus();
      settings.classList.remove("is-open");
      closeRailChat();
      if (mentionObserver) {
        mentionObserver.disconnect();
        mentionObserver = null;
      }
      if (mentionScrollSync) {
        dialog.removeEventListener("scroll", mentionScrollSync);
        dialog.removeEventListener("scrollend", mentionScrollSync);
        mentionScrollSync = null;
      }
      artSyncFn = null;
      window.clearTimeout(chapterArtHoldTimer);
      chapterArtHoldUntil = 0;
      if (!closingViaHistory) {
        const params = new URLSearchParams(window.location.search);
        if (params.get("read")) syncReaderUrl(null, "replace");
      }
      closingViaHistory = false;
    });
    dialog.addEventListener("cancel", (e) => {
      // Esc: same as «На главную» — back to homepage, not out of the site
      e.preventDefault();
      leaveReader();
    });
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) leaveReader();
    });
    window.addEventListener("popstate", () => {
      const params = new URLSearchParams(window.location.search);
      const readId = params.get("read");
      if (readId) {
        if (dialog.open && chapters[currentIndex]?.id === readId) return;
        suppressUrlSync = true;
        open(readId, { fromPopstate: true });
        suppressUrlSync = false;
        return;
      }
      if (dialog.open) {
        closingViaHistory = true;
        dialog.close();
      }
    });
    dialog.addEventListener(
      "scroll",
      () => {
        updateProgressBar();
        persistPosition();
      },
      { passive: true }
    );
    window.addEventListener("resize", () => {
      if (!dialog.open) return;
      sizeArtStageToDrawing();
      updateFocusUI();
    });

    dialog.querySelector("[data-reader-prev]").addEventListener("click", () => {
      if (currentIndex > 0) open(currentIndex - 1);
    });
    dialog.querySelector("[data-reader-next]").addEventListener("click", () => {
      if (currentIndex < chapters.length - 1) open(currentIndex + 1);
      else leaveReader();
    });
    dialog.querySelector("[data-reader-toc]").addEventListener("click", (e) => {
      e.preventDefault();
      openedWithPush = false;
      closingViaHistory = true;
      dialog.close();
      const url = new URL(window.location.href);
      url.searchParams.delete("read");
      url.hash = "contents";
      history.replaceState({ sunnyReader: false }, "", url.pathname + url.search + url.hash);
      closingViaHistory = false;
      if (isHome) {
        document.querySelector("#contents")?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = `${home}#contents`;
      }
    });

    dialog.querySelector("[data-reader-aa]").addEventListener("click", () => {
      const openNow = !settings.classList.contains("is-open");
      settings.classList.toggle("is-open", openNow);
      dialog.querySelector("[data-reader-aa]").setAttribute("aria-expanded", openNow ? "true" : "false");
    });
    sizeInput?.addEventListener("input", () => {
      prefs.size = Number(sizeInput.value) || 22;
      applyPrefs();
    });
    paperInput?.addEventListener("change", () => {
      prefs.paper = !!paperInput.checked;
      applyPrefs();
    });

    document.querySelectorAll("[data-read]").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        open(b.dataset.read);
      });
    });

    window.SunnyReader = {
      open,
      chapters,
      persist: persistPosition,
      syncArt: () => artSyncFn?.(),
      currentChapterId: () => chapters[currentIndex]?.id || "",
    };
    updateContinueButtons();

    const params = new URLSearchParams(window.location.search);
    let readId = params.get("read");
    let restoreFromTalk = null;
    try {
      const raw = sessionStorage.getItem("sunnychimera-talk-restore");
      if (raw) restoreFromTalk = JSON.parse(raw);
    } catch (e) {}
    if (restoreFromTalk?.reader && restoreFromTalk.chapterId) {
      try {
        sessionStorage.removeItem("sunnychimera-talk-restore");
      } catch (e) {}
      readId = restoreFromTalk.chapterId;
      open(readId, {
        fromUrl: true,
        restoreScroll: restoreFromTalk.scrollRatio || loadProgress()?.scrollRatio || 0,
      });
    } else if (readId) {
      open(readId, {
        fromUrl: true,
        restoreScroll: loadProgress()?.scrollRatio || 0,
      });
    }
    if (window.location.hash === "#contents" && isHome) {
      setTimeout(() => document.querySelector("#contents")?.scrollIntoView(), 50);
    }
  }

  /* Restore window scroll after returning from talk (non-reader pages) */
  try {
    const raw = sessionStorage.getItem("sunnychimera-talk-restore");
    if (raw) {
      const restore = JSON.parse(raw);
      if (!restore.reader && typeof restore.scrollY === "number") {
        sessionStorage.removeItem("sunnychimera-talk-restore");
        window.requestAnimationFrame(() => {
          window.scrollTo(0, restore.scrollY || 0);
        });
      }
    }
  } catch (e) {}

  /* ---------- boot ---------- */
  const { header, mobile } = buildHeader();
  bindNav(header, mobile);
  const dialog = ensureReader();

  function bootReader() {
    if (window.homepageStory?.chapters) initReader(dialog);
    else {
      // story script may load after shell on some pages
      setTimeout(() => {
        if (window.homepageStory?.chapters) initReader(dialog);
      }, 0);
    }
  }
  bootReader();
})();
