/**
 * Local verify: Cat living-conversation prompt (core only).
 */
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import { CAT_CORE, pickCatState } from "../prompts/cat.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== КОТ: проверка нового промпта ==========\n");
assert(usesHybridPrompt("cat"), "hybrid");
assert(/живой парень в обычном разговоре/i.test(CAT_CORE), "main rule");
assert(/findahelpline\.com/i.test(CAT_CORE), "crisis");
assert(!/Spark of Chaos|IDENTITY LOCK|Доступные воспоминания/i.test(CAT_CORE), "no old hybrid");

assert(!pickCatState(5).text, "no state block");

const talk = buildHybridPrompt("cat", { readChapter: 5, mode: "talk", language: "ru" });
assert(talk?.meta?.coreOnly === true, "coreOnly");
assert(talk.full === CAT_CORE, "full === core");
assert(talk.variable === "", "no variable");
assert(!/## 1\. МИР|\[Род\]|## Прочитано/i.test(talk.full), "no tails");

const prepared = prepareChatPayload({
  character: "cat",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
});
assert(prepared.fullPrompt === CAT_CORE, "prepare = core only");

console.log(`Ядро: ${CAT_CORE.length} (~${estimateTokens(CAT_CORE)} tok)`);
console.log("\n========== OK ==========\n");
