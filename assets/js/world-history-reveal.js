/**
 * Scroll Reveal: абзацы на странице «The Root of All Things» плавно проявляются при скролле.
 */
(function () {
  var observer;

  function observeReveals() {
    var reveals = document.querySelectorAll(".world-history__reveal:not(.is-reveal-watched)");
    if (!reveals.length) return;

    if (!observer) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
            }
          });
        },
        { rootMargin: "0px 0px -80px 0px", threshold: 0.05 }
      );
    }

    reveals.forEach(function (el) {
      el.classList.add("is-reveal-watched");
      observer.observe(el);
      /* Уже в зоне видимости — показать сразу (важно после подгрузки текста i18n) */
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-visible");
      }
    });
  }

  window.initWorldHistoryReveal = observeReveals;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeReveals);
  } else {
    observeReveals();
  }

  document.addEventListener("sunnychimera:world-story-loaded", observeReveals);
})();
