/**
 * Сообщения при исчерпании лимитов (когда обе модели недоступны).
 * Ключ — data-character с страницы (weaver, dream, crystal, keeper, talk_mushroom и т.д.).
 * Если для персонажа нет текста, используется default.
 */
export const RATE_LIMIT_MESSAGES = {
  default:
    "Лимиты запросов исчерпаны. Попробуйте через несколько минут или переключите модель (Groq / Gemini).",

  weaver: "Вивер уже бежит к тебе…",
  dream: "The thread ends here.",
  crystal: "Lights out. I’m done",
  drpak: "Пак смотрит на тебя, не мигая…",
  pak: "Пак смотрит на тебя, не мигая…",
  liora: "Лиора прислушивается…",
  shiny: "That’s enough. I don’t repeat myself.",
  shiny_bro: "Enough. Conversation ends.",
  angry_forest: "Growth halted.Return later.",
  talk_mushroom: "The soil stops here.Dialogue sealed.",
  dryad: "",
  keeper: "The page tore itself. No more words today",
  cat: "Кот смотрит в окна…",
};

/**
 * @param {string} characterId - идентификатор персонажа (weaver, dream, …)
 * @returns {string} сообщение для пользователя
 */
export function getRateLimitMessage(characterId) {
  const id = (characterId || "").toLowerCase().trim().replace(/\s+/g, "_");
  const msg = RATE_LIMIT_MESSAGES[id] || RATE_LIMIT_MESSAGES.default;
  return (msg && msg.trim()) ? msg : RATE_LIMIT_MESSAGES.default;
}
