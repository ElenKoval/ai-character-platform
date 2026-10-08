/**
 * Local verify: Pak living-conversation prompt (core only).
 */
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import { PAK_CORE, pickPakState } from "../prompts/pak.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ПАК: проверка нового промпта ==========\n");
assert(usesHybridPrompt("drpak"), "hybrid alias");
assert(usesHybridPrompt("pak"), "hybrid");
assert(/живой человек в обычном разговоре/i.test(PAK_CORE), "main rule");
assert(/findahelpline\.com/i.test(PAK_CORE), "crisis");
assert(!/Spark of Chaos|IDENTITY LOCK|Доступные воспоминания/i.test(PAK_CORE), "no old hybrid");

assert(!pickPakState(5).text, "no state block");

const talk = buildHybridPrompt("drpak", { readChapter: 5, mode: "talk", language: "ru" });
assert(talk?.meta?.coreOnly === true, "coreOnly");
assert(talk.full === PAK_CORE, "full === core");
assert(talk.variable === "", "no variable");
assert(!/## 1\. МИР|\[Род\]|## Прочитано/i.test(talk.full), "no tails");

const prepared = prepareChatPayload({
  character: "pak",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
});
assert(prepared.fullPrompt === PAK_CORE, "prepare = core only");

console.log(`Ядро: ${PAK_CORE.length} (~${estimateTokens(PAK_CORE)} tok)`);
console.log("\n========== OK ==========\n");
