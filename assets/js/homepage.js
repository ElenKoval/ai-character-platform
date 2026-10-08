(() => {
  function murmurs() {
    const lang = window.SunnyLocale?.getLang?.() || "en";
    const fromDict = window.SunnyI18n?.t?.("keeperMurmurs");
    if (Array.isArray(fromDict) && fromDict.length) return fromDict.slice();
    const en = [
      "“Nobody ever comes to ask about the beetle. That is the great tragedy of beetles.”",
      "“I once saw a fish in the sky. Or it was a thought about a fish.”",
      "“Legs are a terrible thing. The more of them you have, the harder it is to pretend you are standing still.”",
      "“Laws, you know, have very tender skin.”",
      "“Children simply exist so loudly that the old laws start to itch.”",
    ];
    const ru = [
      "«Никто никогда не приходит спросить о жуке. В этом главная трагедия жуков».",
      "«Я однажды видел рыбу в небе. Или это была мысль о рыбе».",
      "«Ноги — это ужасная вещь. Чем их больше, тем труднее притворяться, что ты стоишь на месте».",
      "«У законов, знаешь ли, очень нежная кожа».",
      "«Дети просто существуют так громко, что старые законы начинают чесаться».",
    ];
    return (lang === "ru" ? ru : en).slice();
  }

  let keeperWord = 0;
  let keeperWords = murmurs();
  const keeperQuote = document.querySelector("#keeper-quote");
  const keeperBtn = document.querySelector("#keeper-murmur");
  if (!keeperBtn || !keeperQuote) return;

  document.addEventListener("sunnychimera:i18n-ready", () => {
    keeperWords = murmurs();
    keeperWord = 0;
  });

  keeperBtn.addEventListener("click", () => {
    keeperWords = murmurs();
    keeperQuote.textContent = keeperWords[keeperWord++ % keeperWords.length];
  });
})();
