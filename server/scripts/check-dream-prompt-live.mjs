/**
 * Local verify: Dream living-conversation prompt (no chapter states).
 */
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import { DREAM_CORE, pickDreamState, blockDreamThreadMode } from "../prompts/dream.js";
import { usesHybridPrompt } from "../prompts/registry.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ДРИМ: проверка нового промпта ==========\n");
assert(usesHybridPrompt("dream"), "hybrid");
assert(/живой человек/i.test(DREAM_CORE), "main rule");
assert(/Максимум три коротких предложения/i.test(DREAM_CORE), "length");
assert(/findahelpline\.com/i.test(DREAM_CORE), "crisis");
assert(/только через ИИ/i.test(DREAM_CORE), "AI honesty");
assert(!/## 6\. ДРИМ – ядро|Ранний Дрим|После «Цены»/i.test(DREAM_CORE), "no old hybrid states");

const state = pickDreamState(5);
assert(!state.text, "no state block");

const talk = buildHybridPrompt("dream", { readChapter: 5, mode: "talk", language: "ru" });
assert(talk, "assemble");
assert(!/## 1\. МИР/i.test(talk.full), "no shared world");
assert(!/## 2\. ГОЛОС/i.test(talk.full), "no shared voice");
assert(/## ДРИМ/i.test(talk.full), "has dream core");

const thread = buildHybridPrompt("dream", { readChapter: 5, mode: "thread", language: "ru" });
assert(thread.meta.hasThreadExtra, "thread extra");
assert(/Режим «Твоя Нить»/i.test(blockDreamThreadMode({ mode: "thread" })), "thread text");

console.log(`Ядро: ${DREAM_CORE.length} символов (~${estimateTokens(DREAM_CORE)} tok)`);
console.log(
  `constant: ${talk.meta.constantChars} | variable: ${talk.meta.variableChars} | full: ${talk.meta.fullChars} (~${estimateTokens(talk.full)} tok)`
);
console.log("\n========== OK ==========\n");
