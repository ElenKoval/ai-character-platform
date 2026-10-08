/**
 * Local verify: Dream prompt = simple/dream.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  DREAM_CORE,
  DREAM_NOW_LINES,
  pickDreamNow,
  applyDreamNow,
  pickDreamState,
} from "../prompts/dream.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dreamPath = path.resolve(__dirname, "../../simple/dream.md");
const dreamText = fs.readFileSync(dreamPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ДРИМ: проверка simple/dream.md + Сейчас ==========\n");
assert(usesHybridPrompt("dream"), "hybrid");
assert(DREAM_CORE === dreamText, "core === file");
assert(/\{сейчас\}/.test(DREAM_CORE), "placeholder");
assert(DREAM_NOW_LINES.length >= 12, "now lines");
assert(/ТЫ СВОБОДЕН/.test(DREAM_CORE), "free voice");
assert(/первых двух репликах не объясняй/i.test(DREAM_CORE), "mood silence");
assert(/Не возвращайся к Нити/i.test(DREAM_CORE), "detail variety");
assert(/findahelpline\.com/i.test(DREAM_CORE), "crisis");
assert(!/Spark of Chaos|IDENTITY LOCK|Доступные воспоминания/i.test(DREAM_CORE), "no old hybrid");

assert(!pickDreamState(5).text, "no state block");

const line0 = pickDreamNow(0);
const talk = buildHybridPrompt("dream", {
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
  character: "dream",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickDreamNow(1), "prepare mood");
assert(applyDreamNow(DREAM_CORE, line0) === talk.full, "apply matches");

console.log(`dream.md: ${dreamText.length} (~${estimateTokens(dreamText)} tok)`);
console.log(`now lines: ${DREAM_NOW_LINES.length}`);
console.log(`sample: ${line0}`);
console.log("\n========== OK ==========\n");
