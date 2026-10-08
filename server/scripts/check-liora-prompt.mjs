/**
 * Local verify: Liora living-conversation prompt (core only).
 */
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import { LIORA_CORE, pickLioraState } from "../prompts/liora.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ЛИОРА: проверка нового промпта ==========\n");
assert(usesHybridPrompt("liora"), "hybrid");
assert(/живая женщина в обычном разговоре/i.test(LIORA_CORE), "main rule");
assert(/findahelpline\.com/i.test(LIORA_CORE), "crisis");
assert(!/Spark of Chaos|IDENTITY LOCK|Доступные воспоминания|гибель Лиоры/i.test(LIORA_CORE), "no old/spoilers");

assert(!pickLioraState(5).text, "no state block");

const talk = buildHybridPrompt("liora", { readChapter: 5, mode: "talk", language: "ru" });
assert(talk?.meta?.coreOnly === true, "coreOnly");
assert(talk.full === LIORA_CORE, "full === core");
assert(talk.variable === "", "no variable");

const talk13 = buildHybridPrompt("liora", { readChapter: 13, mode: "talk", language: "ru" });
assert(talk13.full === LIORA_CORE, "n=13 same core");
assert(!/гибель|погиб/i.test(talk13.full), "n=13 no death");

const prepared = prepareChatPayload({
  character: "liora",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
});
assert(prepared.fullPrompt === LIORA_CORE, "prepare = core only");

console.log(`Ядро: ${LIORA_CORE.length} (~${estimateTokens(LIORA_CORE)} tok)`);
console.log("\n========== OK ==========\n");
