/**
 * Local verify: Mushroom prompt = simple/talk_mushroom.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  TALK_MUSHROOM_CORE,
  TALK_MUSHROOM_NOW_LINES,
  pickTalkMushroomNow,
  applyTalkMushroomNow,
  pickTalkMushroomState,
} from "../prompts/talk_mushroom.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.resolve(__dirname, "../../simple/talk_mushroom.md");
const mdText = fs.readFileSync(mdPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== ГРИБ: проверка simple/talk_mushroom.md + Сейчас ==========\n");
assert(usesHybridPrompt("talk_mushroom"), "hybrid");
assert(usesHybridPrompt("mushroom"), "hybrid alias");
assert(TALK_MUSHROOM_CORE === mdText, "core === file");
assert(/\{сейчас\}/.test(TALK_MUSHROOM_CORE), "placeholder");
assert(TALK_MUSHROOM_NOW_LINES.length >= 12, "now lines");
assert(/ТЫ СВОБОДЕН/.test(TALK_MUSHROOM_CORE), "free voice");
assert(/первых двух репликах не объясняй/i.test(TALK_MUSHROOM_CORE), "mood silence");
assert(/добрый псих/i.test(TALK_MUSHROOM_CORE), "kind weirdo");
assert(/не наркотик/i.test(TALK_MUSHROOM_CORE), "no substances");
assert(/findahelpline\.com/i.test(TALK_MUSHROOM_CORE), "crisis");
assert(!/IDENTITY LOCK|carbon stick|ANTI-ROMANTIC/i.test(TALK_MUSHROOM_CORE), "no old mushroom");

assert(!pickTalkMushroomState(5).text, "no state block");

const line0 = pickTalkMushroomNow(0);
const talk = buildHybridPrompt("talk_mushroom", {
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
  character: "talk_mushroom",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickTalkMushroomNow(1), "prepare mood");
assert(applyTalkMushroomNow(TALK_MUSHROOM_CORE, line0) === talk.full, "apply matches");

console.log(`talk_mushroom.md: ${mdText.length} (~${estimateTokens(mdText)} tok)`);
console.log(`now lines: ${TALK_MUSHROOM_NOW_LINES.length}`);
console.log(`sample: ${line0}`);
console.log("\n========== OK ==========\n");
