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
document.querySelectorAll(".music-link").forEach(link => {
  link.addEventListener("mouseenter", () => {
    document.body.style.filter = "brightness(1.04)";
  });
  link.addEventListener("mouseleave", () => {
    document.body.style.filter = "";
  });
});

/* микродвижение от мыши - портал слегка «плывёт» за курсором */
(() => {
  const portal = document.querySelector(".portal");
  if (!portal) return;

  let raf = null;
  let x = 0, y = 0;

  window.addEventListener("mousemove", (e) => {
    x = (e.clientX / window.innerWidth - 0.5);
    y = (e.clientY / window.innerHeight - 0.5);
    if (raf) return;

    raf = requestAnimationFrame(() => {
      raf = null;
      portal.style.setProperty("--mx", x.toFixed(3));
      portal.style.setProperty("--my", y.toFixed(3));
    });
  });
})();

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
