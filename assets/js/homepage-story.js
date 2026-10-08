/**
 * Load homepage story for the active language (en | ru).
 * Keeps a synchronous script insert so window.homepageStory exists for following tags.
 */
(function () {
  function getLang() {
    try {
      var m = /[?&]lang=(en|ru)/i.exec(window.location.search || "");
      if (m) return m[1].toLowerCase();
      var stored = localStorage.getItem("sunnychimera-lang");
      if (stored === "en" || stored === "ru") return stored;
    } catch (e) {}
    var nav = (navigator.language || "").toLowerCase();
    return nav.indexOf("ru") === 0 ? "ru" : "en";
  }

  function scriptBase() {
    var path = (window.location.pathname || "").replace(/\\/g, "/");
    if (/\/pages\//.test(path) || /\/pages$/.test(path)) return "../assets/js/";
    return "assets/js/";
  }

  var lang = getLang();
  var src = scriptBase() + "homepage-story." + lang + ".js";
  document.write('<script src="' + src + '"><\/script>');
})();
