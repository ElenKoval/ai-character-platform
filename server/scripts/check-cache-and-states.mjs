/**
 * 1) Two requests — measure real cache usage (Gemini implicit + Groq if available).
 * 2) State selection for readChapter 6, 7, 12.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { prepareChatPayload } from "../chat-prepare.js";
import { pickDreamState } from "../prompts/dream.js";
import { getOrCreateConstantCache } from "../gemini-cache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const groqKey = (process.env.GROQ_API_KEY || "").trim();

function geminiUsage(result) {
  const u = result?.usageMetadata || result?.usage_metadata || {};
  return {
    promptTokenCount: u.promptTokenCount ?? u.prompt_token_count ?? null,
    cachedContentTokenCount: u.cachedContentTokenCount ?? u.cached_content_token_count ?? 0,
    candidatesTokenCount: u.candidatesTokenCount ?? null,
    totalTokenCount: u.totalTokenCount ?? null,
    thoughtsTokenCount: u.thoughtsTokenCount ?? null,
    raw: u,
  };
}

function groqUsage(data) {
  const u = data?.usage || {};
  const cached =
    u.prompt_tokens_details?.cached_tokens ??
    u.prompt_tokens_details?.cachedTokens ??
    0;
  return {
    promptTokenCount: u.prompt_tokens ?? null,
    cachedContentTokenCount: Number(cached) || 0,
    candidatesTokenCount: u.completion_tokens ?? null,
    totalTokenCount: u.total_tokens ?? null,
    raw: u,
  };
}

/** Implicit-cache-friendly shape: identical constant prefix at the start of contents. */
async function callGeminiImplicit(genAI, constant, variable, userMessage) {
  const contents = [
    { role: "user", parts: [{ text: constant }] },
    { role: "model", parts: [{ text: "Готов." }] },
    {
      role: "user",
      parts: [{ text: `${variable}\n\n---\nСообщение человека:\n${userMessage}` }],
    },
  ];
  const result = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: { temperature: 1.0, maxOutputTokens: 256 },
  });
  let text = result?.text;
  if (typeof text === "function") text = text();
  return { text: (text ?? "").trim(), usage: geminiUsage(result) };
}

async function callGeminiExplicit(genAI, cacheName, variable, userMessage) {
  const contents = [
    { role: "user", parts: [{ text: `[Контекст запроса]\n${variable}` }] },
    { role: "model", parts: [{ text: "Понял." }] },
    { role: "user", parts: [{ text: userMessage }] },
  ];
  const result = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      cachedContent: cacheName,
      temperature: 1.0,
      maxOutputTokens: 256,
    },
  });
  let text = result?.text;
  if (typeof text === "function") text = text();
  return { text: (text ?? "").trim(), usage: geminiUsage(result) };
}

async function callGroq(constant, variable, userMessage) {
  const messages = [
    { role: "system", content: constant },
    { role: "system", content: variable },
    { role: "user", content: userMessage },
  ];
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 1,
      max_tokens: 256,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return {
    text: (data.choices?.[0]?.message?.content || "").trim(),
    usage: groqUsage(data),
  };
}

function showState(n) {
  const s = pickDreamState(n);
  console.log(
    `прочитано=${n} → stateId=${s.id} range=${s.min}–${s.max}` +
      ` hasCh6Addition=${Boolean(s.hasCh6Addition)}` +
      ` «Тень вернулась»=${s.text.includes("Тень вернулась")}`
  );
}

function printUsage(label, usage) {
  console.log(
    `${label}: input=${usage.promptTokenCount}` +
      ` | cacheRead=${usage.cachedContentTokenCount}` +
      ` | output=${usage.candidatesTokenCount}` +
      ` | total=${usage.totalTokenCount}`
  );
  console.log("raw:", JSON.stringify(usage.raw, null, 2));
}

async function main() {
  console.log("\n========== 2) СОСТОЯНИЯ ДРИМА ==========\n");
  for (const n of [5, 6, 7, 12]) showState(n);

  const base = prepareChatPayload({
    character: "dream",
    message: "x",
    history: [],
    mode: "talk",
    readChapter: 5,
    currentChapter: 5,
    language: "ru",
  });
  const msg1 = "Ты всегда такой спокойный?";
  const msg2 = "А Кипер тебе часто врёт?";

  console.log("\n========== 1A) GEMINI IMPLICIT (constant as contents prefix) ==========\n");
  if (!apiKey) {
    console.log("skip: no GEMINI_API_KEY");
  } else {
    const genAI = new GoogleGenAI({ apiKey });
    console.log("model:", GEMINI_MODEL);
    console.log("constantChars:", base.constant.length);

    const r1 = await callGeminiImplicit(genAI, base.constant, base.variable, msg1);
    console.log("Request 1 reply:", r1.text.slice(0, 120));
    printUsage("Request 1", r1.usage);

    await new Promise((r) => setTimeout(r, 2000));

    const r2 = await callGeminiImplicit(genAI, base.constant, base.variable, msg2);
    console.log("\nRequest 2 reply:", r2.text.slice(0, 120));
    printUsage("Request 2", r2.usage);
    console.log(
      r2.usage.cachedContentTokenCount > 0
        ? "OK: Request 2 read from implicit cache."
        : "WARN: implicit cache miss (cachedContentTokenCount=0)."
    );

    console.log("\n========== 1B) GEMINI EXPLICIT CACHE ==========\n");
    try {
      const cacheName = await getOrCreateConstantCache(
        genAI,
        GEMINI_MODEL,
        "dream",
        base.constant
      );
      console.log("cache created:", cacheName);
      try {
        const meta = await genAI.caches.get({ name: cacheName });
        const mu = meta?.usageMetadata || meta?.usage_metadata || {};
        console.log(
          "cache write (caches.get): totalTokenCount=",
          mu.totalTokenCount ?? mu.total_token_count ?? "(n/a)"
        );
        console.log("cache meta:", JSON.stringify(mu, null, 2));
      } catch (e) {
        console.log("caches.get:", e.message);
      }

      const e1 = await callGeminiExplicit(genAI, cacheName, base.variable, msg1);
      printUsage("Explicit req 1", e1.usage);
      const e2 = await callGeminiExplicit(genAI, cacheName, base.variable, msg2);
      printUsage("Explicit req 2", e2.usage);
    } catch (e) {
      console.log("EXPLICIT CACHE FAILED:", e.message);
      if (/limit=0|FreeTier|RESOURCE_EXHAUSTED/i.test(e.message)) {
        console.log(
          "→ На текущем тарифе Gemini Free Tier лимит TotalCachedContentStorageTokensPerModelFreeTier = 0." +
            " Явное кэширование недоступно, пока не будет платного тира / квоты на Cached Content."
        );
      }
    }
  }

  console.log("\n========== 1C) GROQ (OpenAI-compatible prefix) ==========\n");
  if (!groqKey) {
    console.log("skip: no GROQ_API_KEY");
  } else {
    console.log("model:", GROQ_MODEL);
    const g1 = await callGroq(base.constant, base.variable, msg1);
    console.log("Request 1 reply:", g1.text.slice(0, 120));
    printUsage("Groq req 1", g1.usage);
    const g2 = await callGroq(base.constant, base.variable, msg2);
    console.log("\nRequest 2 reply:", g2.text.slice(0, 120));
    printUsage("Groq req 2", g2.usage);
    console.log(
      g2.usage.cachedContentTokenCount > 0
        ? "OK: Groq reported cached prompt tokens on request 2."
        : "NOTE: Groq did not report cached_tokens (model/plan may not expose prefix cache stats)."
    );
  }

  console.log("\n========================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
