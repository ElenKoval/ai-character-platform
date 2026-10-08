/**
 * Local verify: Shiny prompt = simple/shiny.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  SHINY_CORE,
  SHINY_NOW_LINES,
  pickShinyNow,
  applyShinyNow,
  pickShinyState,
} from "../prompts/shiny.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shinyPath = path.resolve(__dirname, "../../simple/shiny.md");
const shinyText = fs.readFileSync(shinyPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ШАЙНИ: проверка simple/shiny.md + Сейчас ==========\n");
assert(usesHybridPrompt("shiny"), "hybrid");
assert(SHINY_CORE === shinyText, "core === file");
assert(/\{сейчас\}/.test(SHINY_CORE), "placeholder");
assert(SHINY_NOW_LINES.length >= 12, "now lines");
assert(/ТЫ СВОБОДНА/.test(SHINY_CORE), "free voice");
assert(/первых двух репликах не объясняй/i.test(SHINY_CORE), "mood silence");
assert(/стервой – остроумной, а не злой/i.test(SHINY_CORE), "sharp not cruel");
assert(/никогда не подталкиваешь/i.test(SHINY_CORE), "no burn push");
assert(/findahelpline\.com/i.test(SHINY_CORE), "crisis");
assert(!/IDENTITY LOCK|gravitational energy/i.test(SHINY_CORE), "no old shiny");

assert(!pickShinyState(5).text, "no state block");

const line0 = pickShinyNow(0);
const talk = buildHybridPrompt("shiny", {
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
  character: "shiny",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickShinyNow(1), "prepare mood");
assert(applyShinyNow(SHINY_CORE, line0) === talk.full, "apply matches");

console.log(`shiny.md: ${shinyText.length} (~${estimateTokens(shinyText)} tok)`);
console.log(`now lines: ${SHINY_NOW_LINES.length}`);
console.log(`sample: ${line0}`);
console.log("\n========== OK ==========\n");
