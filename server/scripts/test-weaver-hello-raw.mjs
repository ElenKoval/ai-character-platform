/**
 * One-shot: call /api/chat for Weaver «привет» and print provider + text.
 * Also dumps prepared prompt length to prove coreOnly.
 */
import { prepareChatPayload } from "../chat-prepare.js";

const prepared = prepareChatPayload({
  character: "weaver",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
});

console.log("prepared.fullPrompt === viver?", /живая девушка/.test(prepared.fullPrompt));
console.log("coreOnly:", prepared.meta?.coreOnly);
console.log("fullChars:", prepared.fullPrompt.length);
console.log("has old poetic?", /Искра Хаоса|бездна|Жги, пульс/.test(prepared.fullPrompt));
console.log("has shared blocks?", /## 1\. МИР|## 4\. РЕЖИМ|## Прочитано/.test(prepared.fullPrompt));

const res = await fetch("http://localhost:3000/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "привет",
    character: "weaver",
    provider: "gemini",
    history: [],
    mode: "talk",
    readChapter: 5,
    debugPrompt: true,
  }),
});

const data = await res.json();
console.log("\n--- /api/chat ---");
console.log("status:", res.status);
console.log("provider:", data.provider);
console.log("requestedProvider:", data.requestedProvider);
console.log("fallbackFrom:", data.fallbackFrom || null);
console.log("promptMeta:", JSON.stringify(data.promptMeta, null, 2));
console.log("text:", data.text);
