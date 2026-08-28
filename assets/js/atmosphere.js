/**
 * Тёмная атмосфера: туман, дым, луч — на всех страницах с base.css
 */
(function () {
  var CLOUDS =
    '<div class="smoke-cloud smoke-cloud--1"></div>' +
    '<div class="smoke-cloud smoke-cloud--2"></div>' +
    '<div class="smoke-cloud smoke-cloud--3"></div>' +
    '<div class="smoke-cloud smoke-cloud--4"></div>' +
    '<div class="smoke-cloud smoke-cloud--5"></div>' +
    '<div class="smoke-cloud smoke-cloud--6"></div>';

  function assetBase() {
    var path = window.location.pathname.replace(/\\/g, "/");
    if (/\/pages\//.test(path) || /\/pages$/.test(path)) return "../assets/";
    return "assets/";
  }

  function insertLayers() {
    var first = document.body.firstChild;

    if (!document.querySelector(".portal-ambient")) {
      var ambient = document.createElement("div");
      ambient.className = "portal-ambient";
      ambient.setAttribute("aria-hidden", "true");
      document.body.insertBefore(ambient, first);
      first = ambient.nextSibling;
    }

    if (!document.querySelector(".smoke-layer")) {
      var smoke = document.createElement("div");
      smoke.className = "smoke-layer";
      smoke.setAttribute("aria-hidden", "true");
      smoke.innerHTML = CLOUDS;
      document.body.insertBefore(smoke, first);
      first = smoke.nextSibling;
    }

    if (!document.querySelector(".sunbeam-layer")) {
      var beam = document.createElement("div");
      beam.className = "sunbeam-layer";
      beam.setAttribute("aria-hidden", "true");
      beam.innerHTML = '<div class="sunbeam sunbeam--main"></div>';
      document.body.insertBefore(beam, first);
    }
  }

  function initParallax() {
    var root = document.documentElement;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var raf = null;
    var x = 0;
    var y = 0;

    function apply() {
      raf = null;
      if (reduceMotion.matches) {
        root.style.setProperty("--mx", "0");
        root.style.setProperty("--my", "0");
        return;
      }
      root.style.setProperty("--mx", x.toFixed(3));
      root.style.setProperty("--my", y.toFixed(3));
    }

    window.addEventListener("mousemove", function (e) {
      x = e.clientX / window.innerWidth - 0.5;
      y = e.clientY / window.innerHeight - 0.5;
      if (raf) return;
      raf = requestAnimationFrame(apply);
    });

    reduceMotion.addEventListener("change", apply);
  }

  if (document.body) {
    insertLayers();
    initParallax();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      insertLayers();
      initParallax();
    });
  }
})();
