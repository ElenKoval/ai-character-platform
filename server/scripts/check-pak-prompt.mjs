/**
 * Local verify: Pak prompt = simple/pak.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  PAK_CORE,
  PAK_NOW_LINES,
  pickPakNow,
  applyPakNow,
  pickPakState,
} from "../prompts/pak.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pakPath = path.resolve(__dirname, "../../simple/pak.md");
const pakText = fs.readFileSync(pakPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ПАК: проверка simple/pak.md + Сейчас ==========\n");
assert(usesHybridPrompt("drpak"), "hybrid alias");
assert(usesHybridPrompt("pak"), "hybrid");
assert(PAK_CORE === pakText, "core === file");
assert(/\{сейчас\}/.test(PAK_CORE), "placeholder");
assert(PAK_NOW_LINES.length >= 12, "now lines");
assert(/ТЫ СВОБОДЕН/.test(PAK_CORE), "free voice");
assert(/первых двух репликах не объясняй/i.test(PAK_CORE), "mood silence");
assert(/Не возвращайся к Лиоре/i.test(PAK_CORE), "detail variety");
assert(/findahelpline\.com/i.test(PAK_CORE), "crisis");
assert(!/Spark of Chaos|IDENTITY LOCK|Доступные воспоминания/i.test(PAK_CORE), "no old hybrid");

assert(!pickPakState(5).text, "no state block");

const line0 = pickPakNow(0);
const talk = buildHybridPrompt("drpak", {
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
  character: "pak",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickPakNow(1), "prepare mood");
assert(applyPakNow(PAK_CORE, line0) === talk.full, "apply matches");

console.log(`pak.md: ${pakText.length} (~${estimateTokens(pakText)} tok)`);
console.log(`now lines: ${PAK_NOW_LINES.length}`);
console.log(`sample: ${line0}`);
console.log("\n========== OK ==========\n");
