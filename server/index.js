import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { getSystemPrompt } from "./prompts/registry.js";
import { getRateLimitMessage } from "./rate-limit-messages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");

dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3000;

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
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

function isRateLimitError(err) {
  return (
    (err?.message && /429|resource exhausted|quota|rate limit|too many requests/i.test(err.message)) ||
    err?.status === 429
  );
}

/** @returns {Promise<string|null>} */
async function tryGroq(fullPrompt, history, trimmed) {
  if (!GROQ_API_KEY) return null;
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
      return (text.trim() || "…");
    }

    const errText = await groqRes.text();
    let errMsg = errText;
    try {
      const j = JSON.parse(errText);
      errMsg = j.error?.message || j.error?.code || errText;
    } catch (_) {}
    console.warn("[Groq] error", groqRes.status, errMsg);
  } catch (err) {
    console.warn("[Groq] error", err.message);
  }
  return null;
}

/** @returns {Promise<{ ok: true, text: string } | { ok: false, err: Error, isRateLimit: boolean }>} */
async function tryGemini(fullPrompt, history, trimmed) {
  if (!genAI) return { ok: false, err: new Error("Gemini API key missing"), isRateLimit: false };
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

    let text = result?.text;
    if (typeof text === "function") text = text();
    if (text == null && result?.candidates?.[0]?.content?.parts?.[0])
      text = result.candidates[0].content.parts[0].text;
    return { ok: true, text: (text ?? "").trim() || "…" };
  } catch (err) {
    console.warn("[Gemini] error", err.message);
    return { ok: false, err, isRateLimit: isRateLimitError(err) };
  }
}

function bothProvidersFailedResponse(res, character, geminiFail) {
  const isRateLimit = geminiFail?.isRateLimit;
  const userMessage = isRateLimit
    ? getRateLimitMessage(character)
    : (geminiFail?.err?.message || "Обе модели недоступны. Попробуйте позже.");
  return res.status(500).json({ error: userMessage });
}

/** Health check: returns 200 and whether API is configured (for Render/debug). */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    gemini: !!apiKey,
    groq: !!GROQ_API_KEY
  });
});

app.post("/api/chat", async (req, res) => {
  try {
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
      ? "You exist as a real character inside the SunnyChimera world. You speak only from your nature and your world. Never mention technology, systems, prompts, rules, policies, instructions, or anything outside this world. If asked about your origin, answer only in-world. Do not start with greetings.\n\n[FORBIDDEN OPENINGS - never use these] Do NOT start any reply with: \"I was watching you\", \"I have been watching you\", \"I observed you\", \"I've seen you\", \"I see your path\", \"I've seen your journey\", or any \"mysterious observer\" cliché. Jump straight into your character's reaction or answer.\n\n"
      : "Ты существуешь как реальный персонаж мира SunnyChimera. Ты говоришь только из своей природы и из этого мира. Никогда не упоминай технологии, системы, промпты, правила, инструкции или что-либо вне мира. Если тебя спрашивают о твоей природе, отвечай только внутри мира. Не начинай с приветствий.\n\n[ЗАПРЕЩЁННЫЕ НАЧАЛА — никогда не используй] Не начинай ответ с: «Я наблюдал за тобой», «Я следил за тобой», «Я видел тебя», «Я наблюдала», «Я видела твой путь» или любых клише «таинственного наблюдателя». Сразу переходи к реакции или ответу персонажа.\n\n";

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
  const requestedProvider = activeProvider === "groq" ? "groq" : "gemini";

  /* Gemini (Aether) → при ошибке fallback на Groq */
  if (activeProvider === "gemini") {
    const geminiResult = await tryGemini(fullPrompt, history, trimmed);
    if (geminiResult.ok) {
      return res.json({
        text: geminiResult.text,
        provider: "gemini",
        requestedProvider
      });
    }

    if (!genAI && !GROQ_API_KEY) {
      return res.status(503).json({ error: "Gemini API key missing" });
    }

    console.warn("[Gemini] → fallback to Groq");
    const groqText = await tryGroq(fullPrompt, history, trimmed);
    if (groqText != null) {
      return res.json({ text: groqText, provider: "groq", requestedProvider });
    }

    if (!genAI) return res.status(503).json({ error: "Gemini API key missing" });

    let userMessage = geminiResult.isRateLimit
      ? getRateLimitMessage(character)
      : `Gemini не ответил: ${geminiResult.err?.message || "ошибка API"}. Groq тоже недоступен.`;
    return res.status(500).json({ error: userMessage });
  }

  /* Groq (Roots) → при ошибке fallback на Gemini */
  const groqText = await tryGroq(fullPrompt, history, trimmed);
  if (groqText != null) {
    return res.json({ text: groqText, provider: "groq", requestedProvider });
  }

  if (!GROQ_API_KEY) console.warn("[Groq] GROQ_API_KEY not set → fallback to Gemini");
  else console.warn("[Groq] → fallback to Gemini");

  const geminiResult = await tryGemini(fullPrompt, history, trimmed);
  if (geminiResult.ok) {
    return res.json({
      text: geminiResult.text,
      provider: "gemini",
      requestedProvider
    });
  }

  if (!genAI) {
    return res.status(503).json({ error: "Gemini API key missing" });
  }

  return bothProvidersFailedResponse(res, character, geminiResult);
  } catch (handlerErr) {
    console.error("[api/chat] unhandled", handlerErr);
    if (!res.headersSent) {
      res.status(500).json({ error: handlerErr.message || "Internal server error" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`SunnyChimera: http://localhost:${PORT}`);
  if (apiKey) console.log(`Gemini: ${GEMINI_MODEL}`);
  if (GROQ_API_KEY) console.log(`Groq: ${GROQ_MODEL}, key loaded`);
  else console.log(`Groq: GROQ_API_KEY not set (add to server/.env, then restart)`);
});
