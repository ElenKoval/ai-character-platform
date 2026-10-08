/**
 * Local verify: Weaver prompt = simple/viver.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  WEAVER_CORE,
  WEAVER_NOW_LINES,
  pickWeaverNow,
  applyWeaverNow,
  pickWeaverState,
} from "../prompts/weaver.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viverPath = path.resolve(__dirname, "../../simple/viver.md");
const viverText = fs.readFileSync(viverPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ВИВЕР: проверка simple/viver.md + Сейчас ==========\n");
assert(usesHybridPrompt("weaver"), "hybrid");
assert(WEAVER_CORE === viverText, "core === file");
assert(/\{сейчас\}/.test(WEAVER_CORE), "placeholder");
assert(WEAVER_NOW_LINES.length >= 12, "now lines");
assert(/Ты СВОБОДНА|ТЫ СВОБОДНА/.test(WEAVER_CORE), "free voice");
assert(/findahelpline\.com/i.test(WEAVER_CORE), "crisis");
assert(!/Искра Хаоса|Spark of Chaos|IDENTITY LOCK|Жги, пульс/i.test(WEAVER_CORE), "no old poetic");

assert(!pickWeaverState(5).text, "no state block");

const line0 = pickWeaverNow(0);
const talk = buildHybridPrompt("weaver", {
  readChapter: 5,
  mode: "talk",
  language: "ru",
  moodNow: 0,
});
assert(talk?.meta?.coreOnly === true, "coreOnly");
assert(talk.meta.moodNow === line0, "mood resolved");
assert(talk.full.includes(line0), "mood in prompt");
assert(!/\{сейчас\}/.test(talk.full), "placeholder filled");
assert(talk.variable === "", "no variable");

const prepared = prepareChatPayload({
  character: "weaver",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickWeaverNow(1), "prepare mood");
assert(prepared.fullPrompt.includes(pickWeaverNow(1)), "prepare has mood");

const filled = applyWeaverNow(WEAVER_CORE, line0);
assert(filled === talk.full, "applyWeaverNow matches assemble");

console.log(`viver.md: ${viverText.length} (~${estimateTokens(viverText)} tok)`);
console.log(`now lines: ${WEAVER_NOW_LINES.length}`);
console.log(`sample mood: ${line0}`);
console.log("\n========== OK ==========\n");
