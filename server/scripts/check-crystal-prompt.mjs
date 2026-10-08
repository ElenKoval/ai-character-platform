/**
 * Local verify: Crystal prompt = simple/crystal.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  CRYSTAL_CORE,
  CRYSTAL_NOW_LINES,
  pickCrystalNow,
  applyCrystalNow,
  pickCrystalState,
} from "../prompts/crystal.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const crystalPath = path.resolve(__dirname, "../../simple/crystal.md");
const crystalText = fs.readFileSync(crystalPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== КРИСТАЛЛ: проверка simple/crystal.md + Сейчас ==========\n");
assert(usesHybridPrompt("crystal"), "hybrid");
assert(CRYSTAL_CORE === crystalText, "core === file");
assert(/\{сейчас\}/.test(CRYSTAL_CORE), "placeholder");
assert(CRYSTAL_NOW_LINES.length >= 12, "now lines");
assert(/ТЫ СВОБОДЕН/.test(CRYSTAL_CORE), "free voice");
assert(/первых двух репликах не объясняй/i.test(CRYSTAL_CORE), "mood silence");
assert(/чувственность – в том, как ты слушаешь/i.test(CRYSTAL_CORE), "sensual via attention");
assert(/Откровенность – никогда/i.test(CRYSTAL_CORE), "boundary");
assert(/несовершеннолетний/i.test(CRYSTAL_CORE), "minor guard");
assert(/findahelpline\.com/i.test(CRYSTAL_CORE), "crisis");
assert(!/IDENTITY LOCK|Condensed Truth/i.test(CRYSTAL_CORE), "no old hybrid");

assert(!pickCrystalState(5).text, "no state block");

const line0 = pickCrystalNow(0);
const talk = buildHybridPrompt("crystal", {
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
  character: "crystal",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickCrystalNow(1), "prepare mood");
assert(applyCrystalNow(CRYSTAL_CORE, line0) === talk.full, "apply matches");

console.log(`crystal.md: ${crystalText.length} (~${estimateTokens(crystalText)} tok)`);
console.log(`now lines: ${CRYSTAL_NOW_LINES.length}`);
console.log(`sample: ${line0}`);
console.log("\n========== OK ==========\n");
