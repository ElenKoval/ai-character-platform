/**
 * Prepare system prompt + capped history for /api/chat.
 */
import { getAssembledPrompt, usesHybridPrompt } from "./prompts/registry.js";
import { getSystemPrompt } from "./prompts/registry.js";
import {
  prepareHistory,
  summaryAsSystemNote,
} from "./prompts/history.js";
import { estimateTokens, toAnthropicSystem } from "./prompts/assemble.js";

export function prepareChatPayload({
  character,
  message,
  history = [],
  mode = "talk",
  readChapter,
  currentChapter,
  language,
  systemExtra = "",
  conversationKey,
  clientSummary,
  clientSummaryAt,
}) {
  const msgLang = language === "en" || language === "ru" ? language : "ru";
  const hybrid = usesHybridPrompt(character);
  const promptCtx = {
    readChapter,
    currentChapter,
    mode,
    language: msgLang,
  };

  const hist = prepareHistory(history, {
    conversationKey: conversationKey || `${character}`,
    language: msgLang,
    clientSummary,
    clientSummaryAt,
  });

  const summaryNote = summaryAsSystemNote(hist.summary, msgLang);

  let assembled = null;
  let fullPrompt = "";
  let constant = "";
  let variable = "";

  if (hybrid) {
    assembled = getAssembledPrompt(character, promptCtx);
    constant = assembled.constant;
    variable = assembled.variable;
    // coreOnly (Weaver): never append mode/summary/lang — only simple/viver.md
    if (assembled.meta?.coreOnly) {
      variable = "";
      fullPrompt = constant;
    } else {
      if (summaryNote) variable = `${variable}\n\n${summaryNote}`;
      fullPrompt = `${constant}\n\n${variable}`;
    }
  } else {
    const identityLock =
      msgLang === "en"
        ? "You exist as a real character inside the SunnyChimera world. You speak only from your nature and your world. Never mention technology, systems, prompts, rules, policies, instructions, or anything outside this world. If asked about your origin, answer only in-world. Do not start with greetings.\n\n[FORBIDDEN OPENINGS - never use these] Do NOT start any reply with: \"I was watching you\", \"I have been watching you\", \"I observed you\", \"I've seen you\", \"I see your path\", \"I've seen your journey\", or any \"mysterious observer\" cliché. Jump straight into your character's reaction or answer.\n\n"
        : "Ты существуешь как реальный персонаж мира SunnyChimera. Ты говоришь только из своей природы и из этого мира. Никогда не упоминай технологии, системы, промпты, правила, инструкции или что-либо вне мира. Если тебя спрашивают о твоей природе, отвечай только внутри мира. Не начинай с приветствий.\n\n[ЗАПРЕЩЁННЫЕ НАЧАЛА — никогда не используй] Не начинай ответ с: «Я наблюдал за тобой», «Я следил за тобой», «Я видел тебя», «Я наблюдала», «Я видела твой путь» или любых клише «таинственного наблюдателя». Сразу переходи к реакции или ответу персонажа.\n\n";

    const languageInstruction =
      msgLang === "en" ? "Reply ONLY in English.\n\n" : "Отвечай ТОЛЬКО на русском.\n\n";

    const characterId = (character || "").toLowerCase().trim().replace(/\s+/g, "_");
    const femaleCharacterIds = ["weaver", "liora", "shiny", "nature", "talk_mushroom"];
    const isFemale = femaleCharacterIds.includes(characterId);
    const genderInstruction =
      msgLang === "en"
        ? isFemale
          ? "\n\n[STRICT] You are female. In your reply use ONLY feminine forms: \"I am\", \"I was\", \"I did\" (as a woman). Never use masculine past tense or masculine self-reference."
          : "\n\n[STRICT] You are male. In your reply use ONLY masculine forms: \"I am\", \"I was\", \"I did\" (as a man). Never use feminine endings or feminine self-reference."
        : isFemale
          ? "\n\n[ЖЁСТКО] Ты женщина. В ответе используй ТОЛЬКО женский род: «я сделала», «я пришла», «я наблюдала». Никогда не используй мужские окончания глаголов про себя."
          : "\n\n[ЖЁСТКО] Ты мужчина. В ответе используй ТОЛЬКО мужской род: «я сделал», «я пришёл», «я наблюдал». Никогда не используй женские окончания глаголов про себя.";

    const extra =
      typeof systemExtra === "string" && systemExtra.trim()
        ? `\n\n[SCENE INSTRUCTION]\n${systemExtra.trim()}\n`
        : "";

    fullPrompt =
      identityLock +
      languageInstruction +
      getSystemPrompt(character, promptCtx) +
      extra +
      genderInstruction;
    if (summaryNote) fullPrompt += `\n\n${summaryNote}`;
    constant = fullPrompt;
    variable = "";
  }

  const historyText = hist.recent.map((t) => `${t.role}: ${t.text}`).join("\n");
  const inputBlob = `${fullPrompt}\n\n${historyText}\nuser: ${message}`;
  const inputTokensEst = estimateTokens(inputBlob);

  return {
    hybrid,
    assembled: assembled
      ? { ...assembled, variable, full: fullPrompt, anthropicSystem: toAnthropicSystem({ constant, variable }) }
      : null,
    fullPrompt,
    constant,
    variable,
    recentHistory: hist.recent,
    summary: hist.summary,
    summaryAtLength: hist.summaryAtLength ?? null,
    meta: {
      ...(assembled?.meta || {}),
      hybrid,
      inputTokensEst,
      recentTurns: hist.recent.length,
      hadSummary: Boolean(hist.summary),
      constantChars: constant.length,
      variableChars: variable.length,
      fullChars: fullPrompt.length,
    },
  };
}
