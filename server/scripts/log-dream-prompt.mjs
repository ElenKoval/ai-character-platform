/**
 * One-shot: assemble Dream prompt (readChapter=5, mode=talk) and log tokens.
 */
import { prepareChatPayload } from "../chat-prepare.js";

const message = "Привет. Ты всегда такой спокойный?";
const prepared = prepareChatPayload({
  character: "dream",
  message,
  history: [],
  mode: "talk",
  readChapter: 5,
  currentChapter: 5,
  language: "ru",
});

console.log("\n========== TEST: Dream | прочитано=5 | режим=Разговор ==========\n");
console.log("META:", JSON.stringify(prepared.meta, null, 2));
console.log("\n----- CONSTANT (cacheable prefix) -----\n");
console.log(prepared.constant);
console.log("\n----- VARIABLE -----\n");
console.log(prepared.variable);
console.log("\n----- FULL SYSTEM PROMPT -----\n");
console.log(prepared.fullPrompt);
console.log("\n----- INPUT TOKEN ESTIMATE -----");
console.log(`inputTokensEst: ${prepared.meta.inputTokensEst}`);
console.log(`constantChars: ${prepared.meta.constantChars}`);
console.log(`variableChars: ${prepared.meta.variableChars}`);
console.log(`fullChars: ${prepared.meta.fullChars}`);
console.log(`state: ${prepared.meta.stateId} [${prepared.meta.stateRange}]`);
console.log(`chapter map lines: 0..${prepared.meta.readChapter}`);
console.log("\n==============================================================\n");
