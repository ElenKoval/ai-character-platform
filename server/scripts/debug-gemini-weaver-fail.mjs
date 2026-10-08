/**
 * Reproduce site Gemini path for Weaver and print the exact error.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { prepareChatPayload } from "../chat-prepare.js";
import { getOrCreateConstantCache } from "../gemini-cache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const genAI = new GoogleGenAI({ apiKey });

const prepared = prepareChatPayload({
  character: "weaver",
  message: "привет",
  history: [],
  mode: "talk",
  readChapter: 5,
  language: "ru",
});

const fullPrompt = prepared.fullPrompt;
const assembled = { constant: prepared.constant, variable: prepared.variable };
const characterId = "weaver";
const trimmed = "привет";

const contents = [];
const config = {
  temperature: 1.0,
  maxOutputTokens: 8192,
  thinkingConfig: { thinkingLevel: "low" },
  safetySettings: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  ],
};

const useCache = Boolean(assembled?.constant && characterId && assembled.variable);
console.log("useCache:", useCache, "variableLen:", assembled.variable.length);

let cacheName = null;
if (useCache) {
  cacheName = await getOrCreateConstantCache(genAI, GEMINI_MODEL, characterId, assembled.constant);
}

if (cacheName) {
  config.cachedContent = cacheName;
} else {
  config.systemInstruction = fullPrompt;
}
contents.push({ role: "user", parts: [{ text: trimmed }] });

const requestBody = {
  model: GEMINI_MODEL,
  contents,
  config: {
    ...config,
    systemInstructionPreview: config.systemInstruction
      ? String(config.systemInstruction).slice(0, 120)
      : null,
    systemInstructionChars: config.systemInstruction
      ? String(config.systemInstruction).length
      : 0,
  },
};

console.log("\n========== RAW GEMINI REQUEST (site path) ==========");
console.log(
  JSON.stringify(
    {
      provider: "gemini",
      url: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      model: GEMINI_MODEL,
      systemInstructionPath: cacheName
        ? "cachedContent.systemInstruction"
        : "config.systemInstruction",
      cacheName,
      contents,
      config: {
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
        thinkingConfig: config.thinkingConfig,
        safetySettings: config.safetySettings,
        cachedContent: config.cachedContent || null,
        hasSystemInstruction: Boolean(config.systemInstruction),
        systemInstructionChars: config.systemInstruction
          ? String(config.systemInstruction).length
          : 0,
        systemInstructionHead: config.systemInstruction
          ? String(config.systemInstruction).slice(0, 200)
          : null,
      },
    },
    null,
    2
  )
);

try {
  const result = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config,
  });
  let text = result?.text;
  if (typeof text === "function") text = text();
  console.log("\n========== RAW GEMINI RESPONSE ==========");
  console.log(
    JSON.stringify(
      {
        text: text || null,
        candidates: result?.candidates,
        usageMetadata: result?.usageMetadata,
        promptFeedback: result?.promptFeedback,
      },
      null,
      2
    )
  );
} catch (err) {
  console.log("\n========== RAW GEMINI ERROR ==========");
  console.log(
    JSON.stringify(
      {
        message: err?.message,
        status: err?.status,
        code: err?.code,
        name: err?.name,
        stack: err?.stack?.split("\n").slice(0, 8),
        error: err,
      },
      null,
      2
    )
  );
}
