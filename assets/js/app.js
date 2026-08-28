const hint = document.getElementById("hint");

function setHint(text){
  if (hint) hint.textContent = text;
}

document.querySelectorAll(".panel").forEach(panel => {
  const isDream = panel.classList.contains("panel--dream");
  const isweaver = panel.classList.contains("panel--weaver");

  panel.addEventListener("mouseenter", () => {
    if (isDream) setHint("Dream: тишина, перья, защита.");
    if (isweaver) setHint("Прядильщица: нити, холод, проверка.");
  });

  panel.addEventListener("mouseleave", () => {
    setHint("Hover over a side.");
  });
});

/* Главная, мобильная: фразы Дрима и Вивер при прокрутке к картинке */
(() => {
  const panels = document.querySelectorAll(".panel--dream, .panel--weaver");
  if (!panels.length) return;

  const mobileUi = window.matchMedia("(max-width: 1100px)");
  const MIN_VISIBLE = 0.12;
  let observer = null;
  const visibleRatio = new Map();

  function replayWhisper(panel) {
    panel.querySelectorAll(".panel__whisper p").forEach(function (line) {
      line.style.animation = "none";
      void line.offsetHeight;
      line.style.animation = "";
    });
  }

  function setActiveWhisper(panel) {
    panels.forEach(function (p) {
      var on = p === panel;
      p.classList.toggle("is-whisper-active", on);
      if (on) replayWhisper(p);
    });
  }

  function clearWhispers() {
    panels.forEach(function (p) {
      p.classList.remove("is-whisper-active");
    });
  }

  function pickWhisperFromScroll() {
    var best = null;
    var bestRatio = MIN_VISIBLE;

    panels.forEach(function (panel) {
      var ratio = visibleRatio.get(panel) || 0;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = panel;
      }
    });

    if (best) setActiveWhisper(best);
    else clearWhispers();
  }

  function teardownScrollWhispers() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    visibleRatio.clear();
    clearWhispers();
  }

  function setupScrollWhispers() {
    teardownScrollWhispers();
    if (!mobileUi.matches) return;

    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var panel = entry.target.closest(".panel");
          if (!panel) return;
          visibleRatio.set(panel, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        pickWhisperFromScroll();
      },
      {
        threshold: [0, 0.08, 0.12, 0.2, 0.35, 0.5, 0.75],
        rootMargin: "0px 0px -8% 0px",
      }
    );

    panels.forEach(function (panel) {
      var art = panel.querySelector(".panel__art");
      if (art) observer.observe(art);
    });

    requestAnimationFrame(pickWhisperFromScroll);
  }

  mobileUi.addEventListener("change", setupScrollWhispers);
  setupScrollWhispers();
})();
document.querySelectorAll(".music-link").forEach(link => {
  link.addEventListener("mouseenter", () => {
    document.body.style.filter = "brightness(1.04)";
  });
  link.addEventListener("mouseleave", () => {
    document.body.style.filter = "";
  });
});

/* яйцо в центре - локальный наклон к курсору */
(() => {
  const egg = document.querySelector(".core__inner");
  if (!egg) return;

  const reset = () => {
    egg.style.setProperty("--ex", "0");
    egg.style.setProperty("--ey", "0");
  };

  egg.addEventListener("mousemove", (e) => {
    const rect = egg.getBoundingClientRect();
    const ex = (e.clientX - rect.left) / rect.width - 0.5;
    const ey = (e.clientY - rect.top) / rect.height - 0.5;
    egg.style.setProperty("--ex", ex.toFixed(3));
    egg.style.setProperty("--ey", ey.toFixed(3));
  });

  egg.addEventListener("mouseleave", reset);
  reset();
})();
