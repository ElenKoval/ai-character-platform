/**
 * Local verify: Brother prompt = simple/shiny_bro.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  SHINY_BRO_CORE,
  SHINY_BRO_NOW_LINES,
  pickShinyBroNow,
  applyShinyBroNow,
  pickShinyBroState,
} from "../prompts/shiny_bro.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const broPath = path.resolve(__dirname, "../../simple/shiny_bro.md");
const broText = fs.readFileSync(broPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== БРАТ: проверка simple/shiny_bro.md + Сейчас ==========\n");
assert(usesHybridPrompt("shiny_bro"), "hybrid");
assert(SHINY_BRO_CORE === broText, "core === file");
assert(/\{сейчас\}/.test(SHINY_BRO_CORE), "placeholder");
assert(SHINY_BRO_NOW_LINES.length >= 12, "now lines");
assert(/ТЫ СВОБОДЕН/.test(SHINY_BRO_CORE), "free voice");
assert(/первых двух репликах не объясняй/i.test(SHINY_BRO_CORE), "mood silence");
assert(/думаешь о нём чаще, чем следует/i.test(SHINY_BRO_CORE), "crystal seed");
assert(/иногда «таки»/i.test(SHINY_BRO_CORE), "speech tick");
assert(/findahelpline\.com/i.test(SHINY_BRO_CORE), "crisis");
assert(!/IDENTITY LOCK|unbreakable wall/i.test(SHINY_BRO_CORE), "no old brother");

assert(!pickShinyBroState(5).text, "no state block");

const line0 = pickShinyBroNow(0);
const talk = buildHybridPrompt("shiny_bro", {
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
  character: "shiny_bro",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickShinyBroNow(1), "prepare mood");
assert(applyShinyBroNow(SHINY_BRO_CORE, line0) === talk.full, "apply matches");

console.log(`shiny_bro.md: ${broText.length} (~${estimateTokens(broText)} tok)`);
console.log(`now lines: ${SHINY_BRO_NOW_LINES.length}`);
console.log(`sample: ${line0}`);
console.log("\n========== OK ==========\n");
