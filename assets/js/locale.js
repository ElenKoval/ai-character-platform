/**
 * Sync locale helpers for shell/pages (before async i18n.json fetch).
 */
(function () {
  var STORAGE_KEY = "sunnychimera-lang";

  function getLang() {
    try {
      var m = /[?&]lang=(en|ru)/i.exec(window.location.search || "");
      if (m) return m[1].toLowerCase();
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "ru") return stored;
    } catch (e) {}
    var nav = (navigator.language || "").toLowerCase();
    return nav.indexOf("ru") === 0 ? "ru" : "en";
  }

  var UI = {
    en: {
      brand: "The Dryad's World",
      brandAria: "The Dryad's World — home",
      home: "Home",
      read: "Read",
      continue: "Continue",
      yourThread: "Your Thread",
      album: "Album",
      listen: "Listen",
      about: "About the author & world",
      partOne: "Part One",
      legal: "© 2026 sunnyChimera. Texts and drawings. All rights reserved · Characters respond with AI",
      skip: "Skip to content",
      menu: "Menu",
      close: "Close",
      beetleSleep: "Put the beetle to sleep",
      beetleWake: "Wake the beetle",
      readerHome: "Home",
      readerLabel: "Reader · Part One",
      readerEnd: "End of Part One",
      readerInChapter: "In this chapter",
      readerChapterNav: "Chapter navigation",
      talkWith: "Talk with {name}",
      talkGeneric: "Talk",
      dossierChapters: "Appears in chapters",
      dossierSound: "Sound of the world",
      chatAskPlaceholder: "Ask…",
      chatSend: "Send",
      readerToc: "contents",
      readerBackList: "Back to list",
      dryadName: "Dryad",
      talkBack: "← Back",
      talkRelease: "Release the talk",
      talkReleaseConfirm: "Release?",
      talkKeep: "Keep",
      talkTitle: "{name} — talk",
      mapHint: "Trace the world",
      mapEnterForest: "Enter the Forest",
      mapAskKeeper: 'The Dryad sleeps. <a href="{href}">Ask Kiper</a>.',
      mapGarden: "Garden",
      mapTree: "Dryad's Tree",
      mapWasteland: "Wasteland",
      mapForest: "Angry Forest",
      keeperTouch: "Touch Kiper",
      keeperThought: "Another thought from Kiper",
      history: "Story",
      partFirstHtml: 'Part <em>One</em>',
      itBegins: "It is only beginning.",
      mapTitle: "World Map",
      fromAlbum: "From the album",
      fromAlbumRegion: "From the album · {name}",
      albumSkip: "To the album",
      openAlbum: "Open the album",
      dreamName: "Dream",
      weaverName: "Weaver",
      keeperName: "Kiper",
      forestName: "Angry Forest",
      siteTitle: "SunnyChimera — The Dryad's World",
      siteDesc: "Where does what you want too much go? The Garden knows. The Forest remembers. Stories and drawings of the Dryad's world.",
      talkSay: "Say it",
      talkNetworkError: "Network error",
      talkServerError: "Server error",
      talkDocTitle: "Talk — SunnyChimera",
      threadTitle: "Your Thread — SunnyChimera",
      threadDesc: "What do you want too much?",
      threadAskTitle: "What do you want too much?",
      threadEpigraphHtml:
        "Dream will not let the Thread break.<br>Weaver will not let it stay the same.<br><em>Both call it salvation.</em>",
      threadPlaceholder: "In one phrase…",
      threadSay: "Say it",
      threadContinueWith: "Continue with {name}",
      threadRetry: "Try again",
      threadAskMore: "Ask also:",
      threadAskKeeper: "Ask Kiper",
      threadAgain: "Another Thread",
      threadCastLabel: "All characters",
      threadCrisis: "If things are hard right now — you are not alone. Find a helpline in your country:",
      threadThinking: "He is thinking. Try again",
      albumTitle: "Album — SunnyChimera",
      albumHeading: "Album",
      albumLead: "Drawings of the Dryad's world — notebook pages.",
      albumSkip: "Skip to the album",
      albumTalk: "Talk",
    },
    ru: {
      brand: "Мир Дриады",
      brandAria: "Мир Дриады — главная",
      home: "На главную",
      read: "Читать",
      continue: "Продолжить",
      yourThread: "Твоя Нить",
      album: "Альбом",
      listen: "Послушать",
      about: "Об авторе и мире",
      partOne: "Часть первая",
      legal: "© 2026 sunnyChimera. Тексты и рисунки. Все права защищены · Персонажи отвечают с помощью ИИ",
      skip: "К содержанию",
      menu: "Меню",
      close: "Закрыть",
      beetleSleep: "Усыпить жука",
      beetleWake: "Разбудить жука",
      readerHome: "На главную",
      readerLabel: "Читалка · Часть первая",
      readerEnd: "Конец первой части",
      readerInChapter: "В этой главе",
      readerChapterNav: "Навигация по главам",
      talkWith: "Поговорить с {name}",
      talkGeneric: "Поговорить",
      dossierChapters: "Появляется в главах",
      dossierSound: "Звук мира",
      chatAskPlaceholder: "Спроси…",
      chatSend: "Отправить",
      readerToc: "оглавление",
      readerBackList: "К списку",
      dryadName: "Дриада",
      talkBack: "← Вернуться",
      talkRelease: "Отпустить разговор",
      talkReleaseConfirm: "Отпустить?",
      talkKeep: "Оставить",
      talkTitle: "{name} — разговор",
      mapHint: "Проведи по миру",
      mapEnterForest: "Войти в Лес",
      mapAskKeeper: 'Дриада спит. <a href="{href}">Спроси Кипера</a>.',
      mapGarden: "Сад",
      mapTree: "Дерево Дриады",
      mapWasteland: "Пустошь",
      mapForest: "Злой Лес",
      keeperTouch: "Коснись Кипера",
      keeperThought: "Другая мысль Кипера",
      history: "История",
      partFirstHtml: "Часть <em>первая</em>",
      itBegins: "Оно только начинается.",
      mapTitle: "Карта мира",
      fromAlbum: "Из альбома",
      fromAlbumRegion: "Из альбома · {name}",
      openAlbum: "Открыть альбом",
      dreamName: "Дрим",
      weaverName: "Вивер",
      keeperName: "Кипер",
      forestName: "Злой Лес",
      siteTitle: "SunnyChimera — Мир Дриады",
      siteDesc: "Куда уходит то, чего ты хочешь слишком сильно? В Саду знают. В Лесу помнят. Истории и рисунки мира Дриады.",
      talkSay: "Сказать",
      talkNetworkError: "Ошибка сети",
      talkServerError: "Ошибка сервера",
      talkDocTitle: "Разговор — SunnyChimera",
      threadTitle: "Твоя Нить — SunnyChimera",
      threadDesc: "Чего ты хочешь слишком сильно?",
      threadAskTitle: "Чего ты хочешь слишком сильно?",
      threadEpigraphHtml:
        "Дрим не даст Нити порваться.<br>Вивер не даст ей остаться прежней.<br><em>Оба называют это спасением.</em>",
      threadPlaceholder: "Одной фразой…",
      threadSay: "Сказать",
      threadContinueWith: "Продолжить с {name}",
      threadRetry: "Повторить",
      threadAskMore: "Спросить ещё:",
      threadAskKeeper: "Спросить Кипера",
      threadAgain: "Другая Нить",
      threadCastLabel: "Все персонажи",
      threadCrisis: "Если тебе сейчас тяжело — ты не один. Найти линию помощи в своей стране:",
      threadThinking: "Он задумался. Попробуй ещё раз",
      albumTitle: "Альбом — SunnyChimera",
      albumHeading: "Альбом",
      albumLead: "Рисунки мира Дриады — страницы блокнота.",
      albumSkip: "К альбому",
      albumTalk: "Поговорить",
    },
  };

  function t(key, vars) {
    var lang = getLang();
    var dict = UI[lang] || UI.en;
    var value = dict[key] != null ? dict[key] : (UI.en[key] || key);
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        value = value.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
      });
    }
    return value;
  }

  try {
    document.documentElement.lang = getLang();
  } catch (e) {}

  window.SunnyLocale = {
    getLang: getLang,
    t: t,
    UI: UI,
  };
})();
