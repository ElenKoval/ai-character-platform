/**

 * Mobile character pages: landing (portrait + CTAs) then lore or chat fullscreen.

 * Enabled via data-mobile-tabs on <body>.

 */

(function () {

  var MQ = window.matchMedia("(max-width: 900px)");

  var VIEW_STORAGE_PREFIX = "sunnychimera-mobile-view:";

  var RESTORE_VIEW_FLAG = "sunnychimera-restore-view";

  function viewStorageKey() {

    return VIEW_STORAGE_PREFIX + window.location.pathname.replace(/\\/g, "/");

  }

  /** Только после смены языка (reload); с мира — всегда лендинг персонажа */
  function loadStoredView() {

    try {

      if (sessionStorage.getItem(RESTORE_VIEW_FLAG) !== "1") return "home";

      sessionStorage.removeItem(RESTORE_VIEW_FLAG);

      var v = sessionStorage.getItem(viewStorageKey());

      if (v === "lore" || v === "chat" || v === "home") return v;

    } catch (e) {}

    return "home";

  }

  function saveView(view) {

    try { sessionStorage.setItem(viewStorageKey(), view); } catch (e) {}

  }

  function markViewRestoreAfterLangSwitch() {

    try { sessionStorage.setItem(RESTORE_VIEW_FLAG, "1"); } catch (e) {}

  }



  function label(key, fallback) {

    var t = window.SunnyI18n && window.SunnyI18n.t;

    return t ? t(key) : fallback;

  }



  function worldBackHref(body) {
    var dossier = body.querySelector("[data-dossier]");
    var id = dossier && dossier.getAttribute("data-dossier");
    return id ? "album.html#" + encodeURIComponent(id) : "album.html";
  }



  function backLabel() {

    return label("mobileLanding.back", "Back");

  }



  /** Убрать устаревшую вставку в шапке (старый класс). */

  function removeInjectedPageBack(body) {

    var pageBack = body.querySelector(".character-page-back");

    if (!pageBack) return;

    var next = pageBack.nextElementSibling;

    if (next && next.classList.contains("topbar__dot")) next.remove();

    pageBack.remove();

  }



  /** «← Назад» в шапке рядом с Врата · Мир Дрима · Мир Вивер. */

  function ensureTopbarWorldBack(body) {

    if (!body.classList.contains("character-page")) return;

    removeInjectedPageBack(body);

    if (body.querySelector(".character-topbar-world-back")) return;

    var topbarLeft = body.querySelector(".topbar__left");

    if (!topbarLeft) return;

    var a = document.createElement("a");

    a.className = "topbar__back character-topbar-world-back";

    a.href = worldBackHref(body);

    a.setAttribute("data-i18n", "mobileLanding.back");

    a.textContent = backLabel();

    topbarLeft.insertBefore(a, topbarLeft.firstChild);

  }



  function refreshTopbarWorldBack(body) {

    var link = body.querySelector(".character-topbar-world-back");

    if (link) link.textContent = backLabel();

  }



  /** Убрать нав под именем; Inner Sound — снова под тегом/именем. */

  function restoreCaptionUnderName(body) {

    if (!body.classList.contains("character-page")) return;

    var actions = body.querySelector(".character-caption__actions");

    if (actions) actions.remove();

    var left = body.querySelector(".character-caption__left");

    var sound = body.querySelector(".character-caption .sound-playlist-link");

    if (!left || !sound || left.contains(sound)) return;

    var tag = left.querySelector(".character-caption__tag");

    if (tag) {

      tag.insertAdjacentElement("afterend", sound);

      return;

    }

    var name = left.querySelector(".character-caption__name");

    if (name) name.insertAdjacentElement("afterend", sound);

    else left.appendChild(sound);

  }



  function initBody(body) {

    ensureTopbarWorldBack(body);

    restoreCaptionUnderName(body);

    var layout = body.querySelector(".character-layout");

    if (!layout) return;



    var lore = layout.querySelector(".character-lore");

    var chat = layout.querySelector(".character-chat");

    if (!lore || !chat) return;



    if (body.querySelector(".character-mobile-home")) return;



    var figure = layout.querySelector(".character-figure");

    var content = layout.querySelector(".character-content");

    var isHorizontal = body.classList.contains("character-page--horizontal");



    var backBtn = document.createElement("button");

    backBtn.type = "button";

    backBtn.className = "character-mobile-back";

    backBtn.hidden = true;



    var home = document.createElement("div");

    home.className = "character-mobile-home";



    var prompt = document.createElement("p");

    prompt.className = "character-mobile-home__prompt";



    var actions = document.createElement("div");

    actions.className = "character-mobile-home__actions";



    var btnRead = document.createElement("button");

    btnRead.type = "button";

    btnRead.className = "character-mobile-home__btn character-mobile-home__btn--lore";



    var btnAsk = document.createElement("button");

    btnAsk.type = "button";

    btnAsk.className = "character-mobile-home__btn character-mobile-home__btn--chat";



    actions.appendChild(btnRead);

    actions.appendChild(btnAsk);

    home.appendChild(prompt);

    home.appendChild(actions);



    var activeView = loadStoredView();



    function updateBackBtn() {

      if (activeView === "home") {

        backBtn.hidden = true;

      } else {

        backBtn.hidden = false;

        backBtn.dataset.backMode = "home";

        backBtn.textContent = backLabel();

      }

    }



    function applyLabels() {

      prompt.textContent = label("mobileLanding.startPrompt", "Where will you begin?");

      btnRead.textContent = label("mobileLanding.readStories", "Read the stories");

      btnAsk.textContent = label("mobileTab.speak", label("mobileLanding.askQuestion", "Speak"));

      updateBackBtn();

    }



    function setView(view) {

      activeView = view;

      saveView(view);

      body.classList.remove("mobile-view--home", "mobile-view--lore", "mobile-view--chat");

      body.classList.add("mobile-view--" + view);

      backBtn.hidden = false;

      updateBackBtn();

      if (view === "chat") {

        requestAnimationFrame(function () {

          var input = body.querySelector(".character-chat .chat__input");

          if (input && typeof input.focus === "function") {

            try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }

          }

        });

      }

    }



    function mountShell() {

      if (!backBtn.parentElement) {

        layout.insertBefore(backBtn, layout.firstChild);

      }

      if (!home.parentElement) {

        var isVisualLeft = layout.classList.contains("character-layout--visual-left");

        if (isHorizontal && figure) {

          var caption = figure.querySelector(".character-caption");

          if (caption) {

            caption.insertAdjacentElement("afterend", home);

          } else {

            figure.appendChild(home);

          }

        } else if (isVisualLeft && figure) {

          var imgWrap = figure.querySelector(".character-figure__img-wrap");

          if (imgWrap) {

            imgWrap.insertAdjacentElement("afterend", home);

          } else {

            figure.appendChild(home);

          }

        } else if (content) {

          content.insertBefore(home, content.firstChild);

        } else if (figure) {

          var imgWrapFallback = figure.querySelector(".character-figure__img-wrap");

          if (imgWrapFallback) {

            imgWrapFallback.insertAdjacentElement("afterend", home);

          } else {

            figure.appendChild(home);

          }

        }

      }

    }



    function unmountShell() {

      if (backBtn.parentElement) backBtn.parentElement.removeChild(backBtn);

      if (home.parentElement) home.parentElement.removeChild(home);

    }



    function mountMobileLore() {

      if (!figure || lore.classList.contains("character-lore--in-figure")) return;

      var isVisualLeft = layout.classList.contains("character-layout--visual-left");

      var chatInFigure = figure.querySelector(":scope > .character-chat");

      if (isVisualLeft) {

        var imgWrap = figure.querySelector(".character-figure__img-wrap");

        if (imgWrap) {

          imgWrap.insertAdjacentElement("afterend", lore);

        } else {

          figure.appendChild(lore);

        }

        lore.classList.add("character-lore--in-figure");

        return;

      }

      if (isHorizontal && chatInFigure) {

        figure.insertBefore(lore, chatInFigure);

      } else if (isHorizontal) {

        figure.appendChild(lore);

      } else {

        figure.appendChild(lore);

      }

      lore.classList.add("character-lore--in-figure");

    }



    function unmountMobileLore() {

      if (!lore.classList.contains("character-lore--in-figure")) return;

      var isVisualLeft = layout.classList.contains("character-layout--visual-left");

      if (isVisualLeft) {

        var contentEl = layout.querySelector(".character-content");

        if (contentEl) {

          contentEl.insertBefore(lore, contentEl.firstChild);

        } else {

          layout.insertBefore(lore, figure);

        }

      } else if (isHorizontal) {

        layout.insertBefore(lore, figure);

      } else {

        var chatAside = layout.querySelector(":scope > .character-chat");

        if (chatAside) {

          layout.insertBefore(lore, chatAside);

        } else {

          layout.insertBefore(lore, figure.nextElementSibling);

        }

      }

      lore.classList.remove("character-lore--in-figure");

    }



    function activateMobile() {

      body.classList.add("has-mobile-tabs");

      document.documentElement.classList.add("has-mobile-tabs-root");

      mountMobileLore();

      mountShell();

      setView(activeView);

    }



    function deactivateMobile() {

      body.classList.remove(

        "has-mobile-tabs",

        "mobile-view--home",

        "mobile-view--lore",

        "mobile-view--chat"

      );

      document.documentElement.classList.remove("has-mobile-tabs-root");

      unmountShell();

      unmountMobileLore();

    }



    function syncMq() {

      if (MQ.matches) {

        activateMobile();

      } else {

        deactivateMobile();

      }

    }



    backBtn.addEventListener("click", function () {

      setView("home");

    });

    btnRead.addEventListener("click", function () { setView("lore"); });

    btnAsk.addEventListener("click", function () { setView("chat"); });



    applyLabels();

    document.addEventListener("sunnychimera:i18n-ready", function () {

      applyLabels();

      refreshTopbarWorldBack(body);

    });

    if (typeof MQ.addEventListener === "function") {

      MQ.addEventListener("change", syncMq);

    } else {

      MQ.addListener(syncMq);

    }

    syncMq();

  }



  function boot() {

    document.querySelectorAll("body[data-mobile-tabs]").forEach(initBody);

    document.querySelectorAll("body.character-page").forEach(function (body) {

      ensureTopbarWorldBack(body);

      restoreCaptionUnderName(body);

    });

  }



  if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", boot);

  } else {

    boot();

  }



  window.SunnyCharacterMobileTabs = {

    prepareLangReload: function () {

      var body = document.body;

      if (!body.hasAttribute("data-mobile-tabs")) return;

      var view = "home";

      if (body.classList.contains("mobile-view--lore")) view = "lore";

      else if (body.classList.contains("mobile-view--chat")) view = "chat";

      saveView(view);

      markViewRestoreAfterLangSwitch();

    }

  };

})();


