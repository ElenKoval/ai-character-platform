/**
 * Local verify: Keeper prompt = simple/keeper.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  KEEPER_CORE,
  KEEPER_NOW_LINES,
  pickKeeperNow,
  applyKeeperNow,
  pickKeeperState,
} from "../prompts/keeper.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.resolve(__dirname, "../../simple/keeper.md");
const mdText = fs.readFileSync(mdPath, "utf8").trim();

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("\n========== КИПЕР: проверка simple/keeper.md + Сейчас ==========\n");
assert(usesHybridPrompt("keeper"), "hybrid");
assert(KEEPER_CORE === mdText, "core === file");
assert(/\{сейчас\}/.test(KEEPER_CORE), "placeholder");
assert(KEEPER_NOW_LINES.length >= 12, "now lines");
assert(/ТЫ СВОБОДЕН/.test(KEEPER_CORE), "free voice");
assert(/первых двух репликах не объясняй/i.test(KEEPER_CORE), "mood silence");
assert(/смешная и тёплая/i.test(KEEPER_CORE), "warm weirdness");
assert(/не рассказываешь, что будет дальше/i.test(KEEPER_CORE), "no spoilers");
assert(/минута ясности/i.test(KEEPER_CORE), "clarity minute");
assert(/findahelpline\.com/i.test(KEEPER_CORE), "crisis");
assert(!/IDENTITY LOCK|Law of Recurrence|ancient Watcher/i.test(KEEPER_CORE), "no old keeper");

assert(!pickKeeperState(5).text, "no state block");

const line0 = pickKeeperNow(0);
const talk = buildHybridPrompt("keeper", {
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
  character: "keeper",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickKeeperNow(1), "prepare mood");
assert(applyKeeperNow(KEEPER_CORE, line0) === talk.full, "apply matches");

console.log(`keeper.md: ${mdText.length} (~${estimateTokens(mdText)} tok)`);
console.log(`now lines: ${KEEPER_NOW_LINES.length}`);
console.log(`sample: ${line0}`);
console.log("\n========== OK ==========\n");
