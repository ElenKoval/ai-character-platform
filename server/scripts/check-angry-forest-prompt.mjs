/**
 * Local verify: Angry Forest prompt = simple/angry_forest.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  ANGRY_FOREST_CORE,
  ANGRY_FOREST_NOW_LINES,
  pickAngryForestNow,
  applyAngryForestNow,
  pickAngryForestState,
} from "../prompts/angry_forest.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.resolve(__dirname, "../../simple/angry_forest.md");
const mdText = fs.readFileSync(mdPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ЗЛОЙ ЛЕС: проверка simple/angry_forest.md + Сейчас ==========\n");
assert(usesHybridPrompt("angry_forest"), "hybrid");
assert(usesHybridPrompt("forest"), "hybrid alias");
assert(ANGRY_FOREST_CORE === mdText, "core === file");
assert(/\{сейчас\}/.test(ANGRY_FOREST_CORE), "placeholder");
assert(ANGRY_FOREST_NOW_LINES.length >= 12, "now lines");
assert(/ТЫ СВОБОДЕН/.test(ANGRY_FOREST_CORE), "free voice");
assert(/первых двух репликах не объясняй/i.test(ANGRY_FOREST_CORE), "mood silence");
assert(/брошенные мечты/i.test(ANGRY_FOREST_CORE), "conversation hook");
assert(/Не пугай человека/i.test(ANGRY_FOREST_CORE), "no threats");
assert(/findahelpline\.com/i.test(ANGRY_FOREST_CORE), "crisis");
assert(!/IDENTITY LOCK|neural network of roots|Golden Hypocrite/i.test(ANGRY_FOREST_CORE), "no old forest");

assert(!pickAngryForestState(5).text, "no state block");

const line0 = pickAngryForestNow(0);
const talk = buildHybridPrompt("angry_forest", {
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
  character: "angry_forest",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickAngryForestNow(1), "prepare mood");
assert(applyAngryForestNow(ANGRY_FOREST_CORE, line0) === talk.full, "apply matches");

console.log(`angry_forest.md: ${mdText.length} (~${estimateTokens(mdText)} tok)`);
console.log(`now lines: ${ANGRY_FOREST_NOW_LINES.length}`);
console.log(`sample: ${line0}`);
console.log("\n========== OK ==========\n");
