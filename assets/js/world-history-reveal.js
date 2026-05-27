/**
 * Scroll Reveal: абзацы на странице «The Root of All Things» плавно проявляются при скролле.
 */
(function () {
  const reveals = document.querySelectorAll(".world-history__reveal");
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { rootMargin: "0px 0px -80px 0px", threshold: 0.1 }
  );

  reveals.forEach(function (el) {
    observer.observe(el);
  });
})();
