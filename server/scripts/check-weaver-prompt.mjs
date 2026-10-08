/**
 * Local verify: Weaver prompt = simple/viver.md only.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import { WEAVER_CORE, pickWeaverState } from "../prompts/weaver.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viverPath = path.resolve(__dirname, "../../simple/viver.md");
const viverText = fs.readFileSync(viverPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ВИВЕР: проверка simple/viver.md ==========\n");
assert(usesHybridPrompt("weaver"), "hybrid");
assert(WEAVER_CORE === viverText, "core === file");
assert(/Говоришь от первого лица в женском роде/i.test(WEAVER_CORE), "voice");
assert(/Живость – в конкретных мелочах/i.test(WEAVER_CORE), "alive detail rule");
assert(/findahelpline\.com/i.test(WEAVER_CORE), "crisis");
assert(!/Искра Хаоса|Spark of Chaos|IDENTITY LOCK|Жги, пульс/i.test(WEAVER_CORE), "no old poetic");

const state = pickWeaverState(5);
assert(!state.text, "no state block");

const talk = buildHybridPrompt("weaver", { readChapter: 5, mode: "talk", language: "ru" });
assert(talk, "assemble");
assert(talk.meta.coreOnly === true, "coreOnly");
assert(talk.full === viverText, "full === viver.md only");
assert(talk.variable === "", "no variable tail");
assert(!/## 1\. МИР/i.test(talk.full), "no shared world");
assert(!/\[Род\]/i.test(talk.full), "no gender line");
assert(!/## Прочитано/i.test(talk.full), "no read progress");
assert(!/## 4\. РЕЖИМ/i.test(talk.full), "no mode block");

const prepared = prepareChatPayload({
  character: "weaver",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
});
assert(prepared.fullPrompt === viverText, "prepareChatPayload = viver.md only");

console.log(`viver.md: ${viverText.length} символов (~${estimateTokens(viverText)} tok)`);
console.log(`full: ${talk.meta.fullChars} (~${estimateTokens(talk.full)} tok)`);
console.log("\n========== OK ==========\n");
