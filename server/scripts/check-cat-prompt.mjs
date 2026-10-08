/**
 * Local verify: Cat prompt = simple/cat.md + {сейчас}.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildHybridPrompt, estimateTokens } from "../prompts/assemble.js";
import {
  CAT_CORE,
  CAT_NOW_LINES,
  pickCatNow,
  applyCatNow,
  pickCatState,
} from "../prompts/cat.js";
import { usesHybridPrompt } from "../prompts/registry.js";
import { prepareChatPayload } from "../chat-prepare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const catPath = path.resolve(__dirname, "../../simple/cat.md");
const catText = fs.readFileSync(catPath, "utf8").trim();

console.log("\n========== КОТ: проверка simple/cat.md + Сейчас ==========\n");
assert(usesHybridPrompt("cat"), "hybrid");
assert(CAT_CORE === catText, "core === file");
assert(/\{сейчас\}/.test(CAT_CORE), "has {сейчас}");
assert(CAT_NOW_LINES.length >= 10, "now lines");
assert(/Вивер – это любовь/i.test(CAT_CORE), "weaver is love");
assert(/Пак и Дрим для тебя авторитеты/i.test(CAT_CORE), "authorities");
assert(/findahelpline\.com/i.test(CAT_CORE), "crisis");
assert(!/Spark of Chaos|IDENTITY LOCK|Доступные воспоминания/i.test(CAT_CORE), "no old hybrid");

assert(!pickCatState(5).text, "no state block");

const line0 = pickCatNow(0);
const talk = buildHybridPrompt("cat", {
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
assert(!/## 1\. МИР|\[Род\]|## Прочитано/i.test(talk.full), "no tails");

const prepared = prepareChatPayload({
  character: "cat",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
  moodNowIndex: 1,
});
assert(prepared.meta.moodNow === pickCatNow(1), "prepare mood");
assert(applyCatNow(CAT_CORE, line0) === talk.full, "apply matches");

console.log(`cat.md: ${catText.length} (~${estimateTokens(catText)} tok)`);
console.log(`now lines: ${CAT_NOW_LINES.length}`);
console.log(`sample: ${line0}`);
console.log("\n========== OK ==========\n");
