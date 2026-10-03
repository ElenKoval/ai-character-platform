(() => {
  const keeperWords = [
    "«Никто никогда не приходит спросить о жуке. В этом главная трагедия жуков».",
    "«Я однажды видел рыбу в небе. Или это была мысль о рыбе».",
    "«Ты понимаешь, что говоришь?» — «Редко. Но это не значит, что я ошибаюсь».",
    "«Ноги — это ужасная вещь. Чем их больше, тем труднее притворяться, что ты стоишь на месте».",
    "«У законов, знаешь ли, очень нежная кожа».",
    "«Дети просто существуют так громко, что старые законы начинают чесаться».",
  ];
  let keeperWord = 0;
  const keeperQuote = document.querySelector("#keeper-quote");
  const keeperBtn = document.querySelector("#keeper-murmur");
  if (!keeperBtn || !keeperQuote) return;
  keeperBtn.addEventListener("click", () => {
    keeperQuote.textContent = keeperWords[keeperWord++ % keeperWords.length];
  });
})();
