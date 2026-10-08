/**
 * Local verify: Dream living-conversation prompt (core only).
 */
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import { DREAM_CORE, pickDreamState } from "../prompts/dream.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ДРИМ: проверка нового промпта ==========\n");
assert(usesHybridPrompt("dream"), "hybrid");
assert(/живой человек в обычном разговоре/i.test(DREAM_CORE), "main rule");
assert(/findahelpline\.com/i.test(DREAM_CORE), "crisis");
assert(!/Spark of Chaos|IDENTITY LOCK|Доступные воспоминания/i.test(DREAM_CORE), "no old hybrid");

assert(!pickDreamState(5).text, "no state block");

const talk = buildHybridPrompt("dream", { readChapter: 5, mode: "talk", language: "ru" });
assert(talk?.meta?.coreOnly === true, "coreOnly");
assert(talk.full === DREAM_CORE, "full === core");
assert(talk.variable === "", "no variable");
assert(!/## 1\. МИР|\[Род\]|## Прочитано/i.test(talk.full), "no tails");

const prepared = prepareChatPayload({
  character: "dream",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
});
assert(prepared.fullPrompt === DREAM_CORE, "prepare = core only");

console.log(`Ядро: ${DREAM_CORE.length} (~${estimateTokens(DREAM_CORE)} tok)`);
console.log("\n========== OK ==========\n");
