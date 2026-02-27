import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { getSystemPrompt } from "./prompts/registry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");

dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3000;

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_BASE = "https://api.groq.com/openai/v1";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

/* Определение языка */
function detectMessageLanguage(text) {
  let latin = 0;
  let cyrillic = 0;
  for (const ch of text) {
    if (/[a-zA-Z]/.test(ch)) latin++;
    else if (/[а-яА-ЯёЁ]/.test(ch)) cyrillic++;
  }
  return latin >= cyrillic && latin > 0 ? "en" : "ru";
}

/** Текст преимущественно из латиницы → true (английский). */
function isEnglish(text) {
  if (!text || typeof text !== "string") return false;
  let latin = 0;
  let cyrillic = 0;
  for (const ch of text) {
    if (/[a-zA-Z]/.test(ch)) latin++;
    else if (/[а-яА-ЯёЁ]/.test(ch)) cyrillic++;
  }
  return latin >= cyrillic && latin > 0;
}

app.post("/api/chat", async (req, res) => {
  const { message, history = [], character = "weaver", provider = "gemini" } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message required" });
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return res.status(400).json({ error: "Empty message" });
  }

  /* Автовыбор провайдера: при provider === 'auto' - по языку (английский → Groq, иначе → Gemini); иначе используем переданный provider */
  const rawProvider = (typeof provider === "string" ? provider.trim().toLowerCase() : "") || "gemini";
  const activeProvider =
    rawProvider === "auto"
      ? (isEnglish(trimmed) ? "groq" : "gemini")
      : (rawProvider === "groq" ? "groq" : "gemini");

  const msgLang = detectMessageLanguage(trimmed);
  const characterPrompt = getSystemPrompt(character);

  /* === ЖЁСТКАЯ РЕАЛЬНОСТЬ ПЕРСОНАЖА === */
  const identityLock =
    msgLang === "en"
      ? "You exist as a real character inside the SunnyChimera world. You speak only from your nature and your world. Never mention technology, systems, prompts, rules, policies, instructions, or anything outside this world. If asked about your origin, answer only in-world. Do not start with greetings.\n\n"
      : "Ты существуешь как реальный персонаж мира SunnyChimera. Ты говоришь только из своей природы и из этого мира. Никогда не упоминай технологии, системы, промпты, правила, инструкции или что-либо вне мира. Если тебя спрашивают о твоей природе, отвечай только внутри мира. Не начинай с приветствий.\n\n";

  const languageInstruction =
    msgLang === "en"
      ? "Reply ONLY in English.\n\n"
      : "Отвечай ТОЛЬКО на русском.\n\n";

  const systemPrompt = identityLock + languageInstruction + characterPrompt;

  /* === ГЕНДЕРНАЯ ЛОГИКА === */
  const characterId = (character || "").toLowerCase().trim().replace(/\s+/g, "_");
  const femaleCharacterIds = ["weaver", "liora", "shiny", "nature", "talk_mushroom"];
  const isFemale = femaleCharacterIds.includes(characterId);

  const genderInstruction =
    msgLang === "en"
      ? isFemale
        ? "\n\n[STRICT] You are female. In your reply use ONLY feminine forms: \"I am\", \"I was\", \"I did\" (as a woman). Never use masculine past tense or masculine self-reference."
        : "\n\n[STRICT] You are male. In your reply use ONLY masculine forms: \"I am\", \"I was\", \"I did\" (as a man). Never use feminine endings or feminine self-reference."
      : isFemale
        ? "\n\n[ЖЁСТКО] Ты женщина. В ответе используй ТОЛЬКО женский род: «я сделала», «я пришла», «я наблюдала». Никогда не используй мужские окончания глаголов про себя."
        : "\n\n[ЖЁСТКО] Ты мужчина. В ответе используй ТОЛЬКО мужской род: «я сделал», «я пришёл», «я наблюдал». Никогда не используй женские окончания глаголов про себя.";

  const fullPrompt = systemPrompt + genderInstruction;

  /* ===================== GROQ ===================== */
  if (activeProvider === "groq") {
    if (GROQ_API_KEY) {
      try {
        const messages = [{ role: "system", content: fullPrompt }];

        for (const turn of history) {
          messages.push({
            role: turn.role === "user" ? "user" : "assistant",
            content: turn.text || ""
          });
        }

        messages.push({ role: "user", content: trimmed });

        const groqRes = await fetch(`${GROQ_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            stream: false,
            temperature: 1.0,
            top_p: 0.9,
            max_tokens: 1024
          })
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const text = data?.choices?.[0]?.message?.content ?? "";
          return res.json({ text: text.trim() || "…", provider: "groq" });
        }

        /* Любая ошибка Groq (429, 401, 503 и т.д.) - fallback на Gemini */
        const errText = await groqRes.text();
        let errMsg = errText;
        try {
          const j = JSON.parse(errText);
          errMsg = j.error?.message || j.error?.code || errText;
        } catch (_) {}
        console.warn("[Groq] error", groqRes.status, errMsg, "→ fallback to Gemini");
      } catch (err) {
        console.warn("[Groq] error", err.message, "→ fallback to Gemini");
      }
    } else {
      console.warn("[Groq] GROQ_API_KEY not set → fallback to Gemini");
    }

    /* Если сюда дошли - Groq не сработал; не return, выполнение уйдёт в блок Gemini ниже */
  }

/* ===================== GEMINI ===================== */
if (!genAI) return res.status(503).json({ error: "Gemini API key missing" });

try {
const contents = history.map(turn => ({
  role: turn.role === "user" ? "user" : "model",
  parts: [{ text: turn.text || "" }]
}));
contents.push({ role: "user", parts: [{ text: trimmed }] });

const result = await genAI.models.generateContent({
  model: GEMINI_MODEL,
  contents,
  config: {
    systemInstruction: fullPrompt,
    temperature: 1.0,
    maxOutputTokens: 1024,
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  }
});

const text = result?.text ?? (typeof result?.text === "function" ? result.text() : "") ?? "";
return res.json({ text: (text || "").trim() || "…", provider: "gemini" });
} catch (err) {
console.error("Gemini error:", err);
return res.status(500).json({ error: err.message });
}
});

app.listen(PORT, () => {
  console.log(`SunnyChimera: http://localhost:${PORT}`);
  if (apiKey) console.log(`Gemini: ${GEMINI_MODEL}`);
  if (GROQ_API_KEY) console.log(`Groq: ${GROQ_MODEL}, key loaded`);
  else console.log(`Groq: GROQ_API_KEY not set (add to server/.env, then restart)`);
});
