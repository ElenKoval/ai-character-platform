/**
 * Listen: vinyl shelf (all characters) + detail player.
 */
(() => {
  const RETURN_KEY = "sunnychimera-sound-return";
  const catalog = window.SunnySoundCatalog;
  if (!catalog?.characters?.length) return;

  const els = {
    page: document.querySelector("[data-sound-page]"),
    shelf: document.querySelector("[data-sound-shelf]"),
    detail: document.querySelector("[data-sound-detail]"),
    back: document.querySelector("[data-sound-back]"),
    backLabel: document.querySelector("[data-sound-back-label]"),
    artWrap: document.querySelector("[data-sound-art-wrap]"),
    art: document.querySelector("[data-sound-art]"),
    artPlaceholder: document.querySelector("[data-sound-art-placeholder]"),
    name: document.querySelector("[data-sound-name]"),
    song: document.querySelector("[data-sound-song]"),
    empty: document.querySelector("[data-sound-empty]"),
    player: document.querySelector("[data-sound-player]"),
    audio: document.querySelector("[data-sound-audio]"),
    play: document.querySelector("[data-sound-play]"),
    playIcon: document.querySelector("[data-sound-play-icon]"),
    seek: document.querySelector("[data-sound-seek]"),
    fill: document.querySelector("[data-sound-fill]"),
    knob: document.querySelector("[data-sound-knob]"),
    current: document.querySelector("[data-sound-current]"),
    duration: document.querySelector("[data-sound-duration]"),
    mute: document.querySelector("[data-sound-mute]"),
    muteIcon: document.querySelector("[data-sound-mute-icon]"),
    volume: document.querySelector("[data-sound-volume]"),
    status: document.querySelector("[data-sound-status]"),
    songlist: document.querySelector("[data-sound-songlist]"),
    lyrics: document.querySelector("[data-sound-lyrics]"),
    lyricsToggle: document.querySelector("[data-sound-lyrics-toggle]"),
    lyricsLabel: document.querySelector("[data-sound-lyrics-label]"),
    lyricsBody: document.querySelector("[data-sound-lyrics-body]"),
    lyricsText: document.querySelector("[data-sound-lyrics-text]"),
    stage: document.querySelector("[data-sound-stage]"),
  };

  let view = "shelf"; // shelf | detail
  let characterId = "";
  let songId = "";
  let seeking = false;
  let wasPlayingBeforeSeek = false;
  let lastVolume = 0.85;
  let reduceMotion = false;

  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  function lang() {
    return window.SunnyLocale?.getLang?.() || (document.documentElement.lang === "ru" ? "ru" : "en");
  }

  function tt(key, ru, en) {
    const v = window.SunnyI18n?.t?.(key) || window.SunnyLocale?.t?.(key) || "";
    if (v && v !== key) return v;
    return lang() === "ru" ? ru : en;
  }

  function character() {
    return catalog.byId(characterId) || null;
  }

  function songs() {
    return character()?.songs || [];
  }

  function song() {
    const list = songs();
    return list.find((s) => s.id === songId) || list[0] || null;
  }

  function songCountLabel(n) {
    if (lang() === "ru") {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return `${n} песня`;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} песни`;
      return `${n} песен`;
    }
    return n === 1 ? "1 song" : `${n} songs`;
  }

  function brotherPlaceholder() {
    return tt(
      "shinyBro.artPlaceholder",
      "Брат вышел за бурбоном.\nСкоро вернётся.",
      "Brother stepped out for bourbon.\nHe'll be back."
    );
  }

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r < 10 ? "0" : ""}${r}`;
  }

  function setStatus(msg) {
    if (!els.status) return;
    if (!msg) {
      els.status.hidden = true;
      els.status.textContent = "";
      return;
    }
    els.status.hidden = false;
    els.status.textContent = msg;
  }

  function resetDiscSpin() {
    els.stage?.classList.remove("is-playing", "is-spinning");
  }

  function setPlayingUI(playing) {
    const isRu = lang() === "ru";
    if (els.playIcon) els.playIcon.textContent = playing ? "❚❚" : "▶";
    if (els.play) {
      els.play.setAttribute("aria-label", playing ? (isRu ? "Пауза" : "Pause") : isRu ? "Играть" : "Play");
      els.play.classList.toggle("is-playing", playing);
    }
    if (reduceMotion || !els.stage) return;
    if (playing) {
      els.stage.classList.add("is-spinning", "is-playing");
    } else {
      // Keep is-spinning so the disc freezes at the current angle
      els.stage.classList.remove("is-playing");
    }
  }

  const ICON_SPEAKER =
    '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 9v6h3.5L14 20V4L7.5 9H4zm12.5 1.1a3.5 3.5 0 0 1 0 3.8v-3.8zm2.1-2.4v8.6a6.2 6.2 0 0 0 0-8.6z"/></svg>';
  const ICON_SPEAKER_MUTED =
    '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 9v6h3.5L14 20V4L7.5 9H4zm12.2.3 1.4-1.4 1.4 1.4 1.4-1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4 1.4-1.4-1.4-1.4 1.4-1.4-1.4 1.4-1.4-1.4-1.4z"/></svg>';

  function setMutedUI(muted) {
    const isRu = lang() === "ru";
    if (els.muteIcon) els.muteIcon.innerHTML = muted ? ICON_SPEAKER_MUTED : ICON_SPEAKER;
    if (els.mute) {
      els.mute.setAttribute(
        "aria-label",
        muted ? (isRu ? "Включить звук" : "Unmute") : isRu ? "Выключить звук" : "Mute"
      );
      els.mute.classList.toggle("is-muted", muted);
    }
  }

  function progressRatio() {
    const a = els.audio;
    if (!a || !a.duration || !Number.isFinite(a.duration) || a.duration <= 0) return 0;
    return Math.min(1, Math.max(0, a.currentTime / a.duration));
  }

  function renderProgress() {
    const ratio = progressRatio();
    const pct = `${(ratio * 100).toFixed(3)}%`;
    if (els.fill) els.fill.style.width = pct;
    if (els.knob) els.knob.style.left = pct;
    if (els.seek) els.seek.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
    if (els.current) els.current.textContent = formatTime(els.audio?.currentTime || 0);
    if (els.duration) {
      const d = els.audio?.duration;
      els.duration.textContent = Number.isFinite(d) ? formatTime(d) : "0:00";
    }
  }

  function stopAudio({ reset = true } = {}) {
    const a = els.audio;
    if (!a) return;
    a.pause();
    if (reset) {
      try {
        a.currentTime = 0;
      } catch (e) {}
      resetDiscSpin();
    }
    setPlayingUI(false);
    renderProgress();
  }

  function loadSong(nextSong, { autoplay = false } = {}) {
    stopAudio({ reset: true });
    setStatus("");
    songId = nextSong?.id || "";
    if (!nextSong?.src || !els.audio) {
      if (els.audio) {
        els.audio.removeAttribute("src");
        delete els.audio.dataset.songId;
        els.audio.load();
      }
      return;
    }
    els.audio.src = nextSong.src;
    els.audio.dataset.songId = nextSong.id || "";
    els.audio.load();
    if (autoplay) {
      const p = els.audio.play();
      if (p && typeof p.then === "function") {
        p.then(() => setPlayingUI(true)).catch(() => {
          setPlayingUI(false);
          setStatus(tt("sound.playError", "Не удалось воспроизвести.", "Could not play."));
        });
      }
    } else {
      setPlayingUI(false);
    }
  }

  function setView(next) {
    view = next;
    const shelf = next === "shelf";
    if (els.shelf) els.shelf.hidden = !shelf;
    if (els.detail) els.detail.hidden = shelf;
    els.page?.classList.toggle("is-shelf", shelf);
    els.page?.classList.toggle("is-detail", !shelf);
    if (els.backLabel) {
      els.backLabel.textContent = tt("sound.backToAll", "← Все персонажи", "← All characters");
    }
  }

  function setShelfHash() {
    const next = "#listen";
    if (window.location.hash !== next) {
      history.replaceState(null, "", window.location.pathname + window.location.search + next);
    }
  }

  function updateHash(c) {
    if (!c) {
      setShelfHash();
      return;
    }
    const id = c.soundId || c.id;
    const next = `#sound-${id}`;
    if (window.location.hash !== next) {
      history.replaceState(null, "", window.location.pathname + window.location.search + next);
    }
  }

  function showShelf() {
    stopAudio({ reset: true });
    characterId = "";
    songId = "";
    if (els.lyricsToggle) els.lyricsToggle.setAttribute("aria-expanded", "false");
    if (els.lyricsBody) els.lyricsBody.hidden = true;
    setView("shelf");
    setShelfHash();
    document.title = tt("sound.title", "Звук мира", "The Sound of the World");
    buildShelf();
  }

  function openCharacter(id, { fromHash = false } = {}) {
    if (!catalog.byId(id)) return;
    stopAudio({ reset: true });
    characterId = id;
    songId = "";
    if (els.lyricsToggle) els.lyricsToggle.setAttribute("aria-expanded", "false");
    if (els.lyricsBody) els.lyricsBody.hidden = true;
    setView("detail");
    renderCharacter();
    if (!fromHash) updateHash(character());
  }

  function renderArt(c) {
    if (!c) return;
    const hasImg = !!c.img;
    if (els.art) {
      if (hasImg) {
        els.art.hidden = false;
        els.art.src = c.img;
        els.art.alt = c.names?.[lang()] || c.names?.ru || "";
      } else {
        els.art.hidden = true;
        els.art.removeAttribute("src");
        els.art.alt = "";
      }
    }
    if (els.artPlaceholder) {
      if (!hasImg && c.artPlaceholder) {
        els.artPlaceholder.hidden = false;
        els.artPlaceholder.textContent = brotherPlaceholder();
      } else {
        els.artPlaceholder.hidden = true;
        els.artPlaceholder.textContent = "";
      }
    }
    if (els.artWrap) {
      els.artWrap.classList.toggle("is-placeholder", !hasImg && !!c.artPlaceholder);
      els.artWrap.dataset.char = c.id || "";
    }
  }

  function renderSonglist(c) {
    if (!els.songlist) return;
    const list = c.songs || [];
    if (list.length <= 1) {
      els.songlist.hidden = true;
      els.songlist.replaceChildren();
      return;
    }
    els.songlist.hidden = false;
    els.songlist.replaceChildren();
    list.forEach((s) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sound-songlist__btn" + (s.id === songId ? " is-active" : "");
      btn.textContent = s.title;
      btn.setAttribute("aria-pressed", s.id === songId ? "true" : "false");
      btn.addEventListener("click", () => selectSong(s.id));
      li.appendChild(btn);
      els.songlist.appendChild(li);
    });
  }

  function renderLyrics(s, { hasSong = false } = {}) {
    const text = (s?.lyrics || "").trim();
    if (els.lyricsLabel) {
      els.lyricsLabel.textContent = tt("sound.lyrics", "Текст песни", "Lyrics");
    }
    if (!hasSong) {
      if (els.lyricsToggle) {
        els.lyricsToggle.hidden = true;
        els.lyricsToggle.setAttribute("aria-expanded", "false");
      }
      if (els.lyrics) els.lyrics.hidden = true;
      if (els.lyricsBody) els.lyricsBody.hidden = true;
      if (els.lyricsText) els.lyricsText.textContent = "";
      return;
    }
    if (els.lyricsToggle) els.lyricsToggle.hidden = false;
    if (els.lyrics) els.lyrics.hidden = false;
    if (els.lyricsText) {
      els.lyricsText.textContent =
        text || tt("sound.lyricsSoon", "Текст скоро появится.", "Lyrics coming soon.");
      els.lyricsText.classList.toggle("is-soon", !text);
    }
    const open = els.lyricsToggle?.getAttribute("aria-expanded") === "true";
    if (els.lyricsBody) els.lyricsBody.hidden = !open;
  }

  function renderCharacter() {
    const c = character();
    if (!c) return;
    const list = songs();
    if (!songId || !list.some((s) => s.id === songId)) {
      songId = list[0]?.id || "";
    }
    const s = song();
    const name = c.names?.[lang()] || c.names?.en || c.id;

    if (els.name) els.name.textContent = name;
    renderArt(c);

    const hasSongs = list.length > 0 && !!s?.src;
    if (els.empty) {
      els.empty.hidden = hasSongs;
      els.empty.textContent = hasSongs
        ? ""
        : tt("sound.comingSoon", "Музыка скоро появится", "Music coming soon");
    }
    if (els.song) {
      els.song.hidden = !hasSongs;
      els.song.textContent = hasSongs ? s.title : "";
    }
    if (els.player) els.player.hidden = !hasSongs;

    if (hasSongs) {
      if (els.audio?.dataset.songId !== s.id) {
        loadSong(s, { autoplay: false });
      }
      renderSonglist(c);
      renderLyrics(s, { hasSong: true });
    } else {
      stopAudio({ reset: true });
      if (els.audio) {
        els.audio.removeAttribute("src");
        delete els.audio.dataset.songId;
        els.audio.load();
      }
      if (els.songlist) {
        els.songlist.hidden = true;
        els.songlist.replaceChildren();
      }
      renderLyrics(null, { hasSong: false });
    }

    document.title = `${name} — ${tt("sound.title", "Звук мира", "The Sound of the World")}`;
    updateHash(c);
  }

  function selectSong(id) {
    const s = songs().find((x) => x.id === id);
    if (!s) return;
    if (s.id === songId) return;
    stopAudio({ reset: true });
    songId = s.id;
    if (els.song) els.song.textContent = s.title;
    loadSong(s, { autoplay: false });
    renderSonglist(character());
    if (els.lyricsToggle) els.lyricsToggle.setAttribute("aria-expanded", "false");
    renderLyrics(s, { hasSong: true });
  }

  function buildShelf() {
    if (!els.shelf) return;
    els.shelf.replaceChildren();
    const listenLabel = tt("sound.listen", "Слушать", "Listen");
    const soonLabel = tt("sound.soon", "Скоро", "Soon");

    catalog.characters.forEach((c) => {
      const name = c.names?.[lang()] || c.names?.en || c.id;
      const count = (c.songs || []).filter((s) => s && s.src).length;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "sound-vinyl";
      card.dataset.soundChar = c.id;
      card.dataset.char = c.id;
      card.setAttribute("aria-label", name);

      const disc = document.createElement("span");
      disc.className = "sound-vinyl__disc";
      disc.setAttribute("aria-hidden", "true");
      disc.innerHTML = `
        <span class="sound-vinyl__plate">
          <span class="sound-vinyl__grooves"></span>
          <span class="sound-vinyl__label"></span>
          <span class="sound-vinyl__spindle"></span>
          <span class="sound-vinyl__listen">${listenLabel}</span>
        </span>
      `;

      const label = disc.querySelector(".sound-vinyl__label");
      if (c.img) {
        const img = document.createElement("img");
        img.className = "sound-vinyl__img";
        img.src = c.img;
        img.alt = "";
        img.loading = "lazy";
        label.appendChild(img);
      } else if (c.artPlaceholder) {
        const ph = document.createElement("span");
        ph.className = "art-placeholder sound-vinyl__placeholder";
        ph.textContent = brotherPlaceholder();
        label.appendChild(ph);
        card.classList.add("is-placeholder");
      }

      const meta = document.createElement("span");
      meta.className = "sound-vinyl__meta";
      const nameEl = document.createElement("span");
      nameEl.className = "sound-vinyl__name";
      nameEl.textContent = name;
      const status = document.createElement("span");
      status.className = "sound-vinyl__status" + (count ? "" : " is-soon");
      status.textContent = count ? songCountLabel(count) : soonLabel;
      meta.append(nameEl, status);

      card.append(disc, meta);
      card.addEventListener("click", () => openCharacter(c.id));
      els.shelf.appendChild(card);
    });
  }

  function characterFromHash() {
    const hash = window.location.hash || "";
    // #listen / empty / bare # → collection shelf (nav "Listen" uses #listen)
    if (!hash || hash === "#" || /^#listen\/?$/i.test(hash)) return null;
    const m = /^#sound-(.+)$/i.exec(hash);
    if (!m) return null;
    return catalog.bySoundId(m[1]) || catalog.byId(m[1]);
  }

  function seekToClientX(clientX) {
    const a = els.audio;
    const bar = els.seek;
    if (!a || !bar || !a.duration || !Number.isFinite(a.duration)) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
    renderProgress();
  }

  function bindPlayer() {
    const a = els.audio;
    if (!a) return;

    a.volume = Number(els.volume?.value) || 0.85;
    lastVolume = a.volume || 0.85;
    setMutedUI(a.muted || a.volume === 0);

    els.back?.addEventListener("click", () => showShelf());

    els.play?.addEventListener("click", () => {
      if (!a.src) return;
      if (a.paused) {
        setStatus(tt("sound.loading", "Загрузка…", "Loading…"));
        const p = a.play();
        if (p && typeof p.then === "function") {
          p.then(() => {
            setStatus("");
            setPlayingUI(true);
          }).catch(() => {
            setPlayingUI(false);
            setStatus(tt("sound.playError", "Не удалось воспроизвести.", "Could not play."));
          });
        }
      } else {
        a.pause();
        setPlayingUI(false);
        setStatus("");
      }
    });

    a.addEventListener("play", () => {
      setStatus("");
      setPlayingUI(true);
    });
    a.addEventListener("playing", () => {
      setStatus("");
      setPlayingUI(true);
    });
    a.addEventListener("pause", () => setPlayingUI(false));
    a.addEventListener("ended", () => {
      try {
        a.currentTime = 0;
      } catch (e) {}
      resetDiscSpin();
      setPlayingUI(false);
      renderProgress();
    });
    a.addEventListener("timeupdate", () => {
      if (!seeking) renderProgress();
    });
    a.addEventListener("loadedmetadata", () => {
      renderProgress();
      setStatus("");
    });
    a.addEventListener("error", () => {
      setPlayingUI(false);
      setStatus(tt("sound.playError", "Не удалось воспроизвести.", "Could not play."));
    });
    a.addEventListener("waiting", () => {
      if (!a.paused) setStatus(tt("sound.loading", "Загрузка…", "Loading…"));
    });
    a.addEventListener("canplay", () => {
      if (els.status?.textContent === tt("sound.loading", "Загрузка…", "Loading…")) setStatus("");
    });

    const onSeekStart = (clientX) => {
      seeking = true;
      wasPlayingBeforeSeek = !a.paused;
      if (wasPlayingBeforeSeek) a.pause();
      seekToClientX(clientX);
    };
    const onSeekMove = (clientX) => {
      if (!seeking) return;
      seekToClientX(clientX);
    };
    const onSeekEnd = () => {
      if (!seeking) return;
      seeking = false;
      if (wasPlayingBeforeSeek) {
        const p = a.play();
        if (p && typeof p.then === "function") {
          p.then(() => setPlayingUI(true)).catch(() => setPlayingUI(false));
        }
      }
      wasPlayingBeforeSeek = false;
    };

    els.seek?.addEventListener("pointerdown", (e) => {
      els.seek.setPointerCapture?.(e.pointerId);
      onSeekStart(e.clientX);
    });
    els.seek?.addEventListener("pointermove", (e) => onSeekMove(e.clientX));
    els.seek?.addEventListener("pointerup", onSeekEnd);
    els.seek?.addEventListener("pointercancel", onSeekEnd);

    els.seek?.addEventListener("keydown", (e) => {
      if (!a.duration) return;
      const step = e.shiftKey ? 10 : 5;
      if (e.key === "ArrowRight" || e.key === "Right") {
        e.preventDefault();
        a.currentTime = Math.min(a.duration, a.currentTime + step);
        renderProgress();
      } else if (e.key === "ArrowLeft" || e.key === "Left") {
        e.preventDefault();
        a.currentTime = Math.max(0, a.currentTime - step);
        renderProgress();
      } else if (e.key === "Home") {
        e.preventDefault();
        a.currentTime = 0;
        renderProgress();
      } else if (e.key === "End") {
        e.preventDefault();
        a.currentTime = a.duration;
        renderProgress();
      }
    });

    els.volume?.addEventListener("input", () => {
      const v = Number(els.volume.value);
      a.volume = v;
      if (v > 0) {
        lastVolume = v;
        a.muted = false;
      } else {
        a.muted = true;
      }
      setMutedUI(a.muted || a.volume === 0);
    });

    els.mute?.addEventListener("click", () => {
      if (a.muted || a.volume === 0) {
        a.muted = false;
        a.volume = lastVolume > 0 ? lastVolume : 0.85;
        if (els.volume) els.volume.value = String(a.volume);
      } else {
        lastVolume = a.volume || lastVolume;
        a.muted = true;
      }
      setMutedUI(a.muted || a.volume === 0);
    });

    els.lyricsToggle?.addEventListener("click", () => {
      const open = els.lyricsToggle.getAttribute("aria-expanded") === "true";
      const next = !open;
      els.lyricsToggle.setAttribute("aria-expanded", next ? "true" : "false");
      if (els.lyricsBody) els.lyricsBody.hidden = !next;
    });
  }

  function updateBackLink() {
    const back = document.querySelector(".sound-hub__back");
    if (!back) return;
    back.setAttribute("href", "../index.html");
  }

  function init() {
    bindPlayer();
    buildShelf();
    updateBackLink();

    const fromHash = characterFromHash();
    if (fromHash) {
      openCharacter(fromHash.id, { fromHash: true });
    } else {
      showShelf();
    }

    document.addEventListener("sunnychimera:i18n-ready", () => {
      const playing = !els.audio?.paused && !!els.audio?.src;
      if (view === "shelf") {
        buildShelf();
        document.title = tt("sound.title", "Звук мира", "The Sound of the World");
      } else {
        buildShelf();
        renderCharacter();
        if (els.backLabel) {
          els.backLabel.textContent = tt("sound.backToAll", "← Все персонажи", "← All characters");
        }
        setPlayingUI(playing);
        setMutedUI(!!els.audio?.muted || els.audio?.volume === 0);
      }
      updateBackLink();
    });

    window.addEventListener("hashchange", () => {
      const c = characterFromHash();
      if (c) openCharacter(c.id, { fromHash: true });
      else showShelf();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.SunnySoundPage = {
    rememberReturnFrom(pageFile) {
      try {
        if (pageFile) sessionStorage.setItem(RETURN_KEY, pageFile);
      } catch (e) {}
    },
  };
})();
