/**
 * Direct Gemini call OUTSIDE the site stack.
 * System prompt = simple/viver.md only. User message = «привет».
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const promptPath = path.resolve(__dirname, "../../simple/viver.md");
const systemInstruction = fs.readFileSync(promptPath, "utf8").trim();

if (!apiKey) {
  console.error("GEMINI_API_KEY missing");
  process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });
const userMessage = "привет";

const request = {
  model,
  contents: [{ role: "user", parts: [{ text: userMessage }] }],
  config: {
    systemInstruction,
    temperature: 1.0,
    maxOutputTokens: 8192,
    thinkingConfig: { thinkingLevel: "low" },
  },
};

console.log("\n========== DIRECT GEMINI (simple/viver.md) ==========");
console.log("model:", model);
console.log("systemInstruction chars:", systemInstruction.length);
console.log("systemInstruction starts:", systemInstruction.slice(0, 80).replace(/\n/g, " | "));
console.log("user:", userMessage);
console.log("field: config.systemInstruction (SDK → system_instruction)\n");

let result;
try {
  result = await genAI.models.generateContent(request);
} catch (err) {
  if (/thinking|ThinkingLevel|unknown/i.test(String(err?.message || err))) {
    delete request.config.thinkingConfig;
    result = await genAI.models.generateContent(request);
  } else {
    console.error("ERROR:", err.message || err);
    process.exit(1);
  }
}

let text = result?.text;
if (typeof text === "function") text = text();
if (!text) {
  const parts = result?.candidates?.[0]?.content?.parts || [];
  text = parts
    .filter((p) => p && !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
}

console.log("--- REPLY ---");
console.log((text || "").trim() || "(empty)");
console.log("--- END ---\n");
