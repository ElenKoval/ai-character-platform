/**
 * Local verify: Liora prompt = simple/liora.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  LIORA_CORE,
  LIORA_NOW_LINES,
  pickLioraNow,
  applyLioraNow,
  pickLioraState,
} from "../prompts/liora.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lioraPath = path.resolve(__dirname, "../../simple/liora.md");
const lioraText = fs.readFileSync(lioraPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ЛИОРА: проверка simple/liora.md + Сейчас ==========\n");
assert(usesHybridPrompt("liora"), "hybrid");
assert(LIORA_CORE === lioraText, "core === file");
assert(/\{сейчас\}/.test(LIORA_CORE), "placeholder");
assert(LIORA_NOW_LINES.length >= 12, "now lines");
assert(/ТЫ СВОБОДНА/.test(LIORA_CORE), "free voice");
assert(/первых двух репликах не объясняй/i.test(LIORA_CORE), "mood silence");
assert(/Не возвращайся к крылу/i.test(LIORA_CORE), "detail variety");
assert(/findahelpline\.com/i.test(LIORA_CORE), "crisis");
assert(!/Spark of Chaos|IDENTITY LOCK|гибель Лиоры/i.test(LIORA_CORE), "no old/spoilers");

assert(!pickLioraState(5).text, "no state block");

const line0 = pickLioraNow(0);
const talk = buildHybridPrompt("liora", {
  readChapter: 5,
  mode: "talk",
  language: "ru",
  moodNow: 0,
});
assert(talk?.meta?.coreOnly === true, "coreOnly");
assert(talk.meta.moodNow === line0, "mood resolved");
assert(talk.full.includes(line0), "mood in prompt");
assert(!/\{сейчас\}/.test(talk.full), "placeholder filled");

const prepared = prepareChatPayload({
  character: "liora",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickLioraNow(1), "prepare mood");
assert(applyLioraNow(LIORA_CORE, line0) === talk.full, "apply matches");

console.log(`liora.md: ${lioraText.length} (~${estimateTokens(lioraText)} tok)`);
console.log(`now lines: ${LIORA_NOW_LINES.length}`);
console.log(`sample: ${line0}`);
console.log("\n========== OK ==========\n");
