import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { getRateLimitMessage } from "./rate-limit-messages.js";
import { prepareChatPayload } from "./chat-prepare.js";
import { getOrCreateConstantCache } from "./gemini-cache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");

dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3000;

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const GROQ_BASE = "https://api.groq.com/openai/v1";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

/** Deploy fingerprint — open /api/build to confirm Render picked up latest git. */
app.get("/api/build", (_req, res) => {
  res.json({
    build: "yt-mist-black",
    servedFrom: path.join(__dirname, ".."),
  });
});

function detectMessageLanguage(text) {
  let latin = 0;
  let cyrillic = 0;
  for (const ch of text) {
    if (/[a-zA-Z]/.test(ch)) latin++;
    else if (/[а-яА-ЯёЁ]/.test(ch)) cyrillic++;
  }
  return latin >= cyrillic && latin > 0 ? "en" : "ru";
}

function isEnglish(text) {
  if (!text || typeof text !== "string") return false;
  return detectMessageLanguage(text) === "en";
}

function isRateLimitError(err) {
  return (
    (err?.message && /429|resource exhausted|quota|rate limit|too many requests/i.test(err.message)) ||
    err?.status === 429
  );
}

function extractUsage(resultOrData) {
  const u =
    resultOrData?.usageMetadata ||
    resultOrData?.usage_metadata ||
    resultOrData?.usage ||
    {};
  const prompt = u.promptTokenCount ?? u.prompt_token_count ?? u.prompt_tokens ?? null;
  const cached =
    u.cachedContentTokenCount ??
    u.cached_content_token_count ??
    u.prompt_tokens_details?.cached_tokens ??
    0;
  return {
    promptTokenCount: prompt,
    cachedContentTokenCount: Number(cached) || 0,
    candidatesTokenCount: u.candidatesTokenCount ?? u.candidates_token_count ?? u.completion_tokens ?? null,
    totalTokenCount: u.totalTokenCount ?? u.total_token_count ?? u.total_tokens ?? null,
    raw: u,
  };
}

function shouldLogRawProvider(characterId, message) {
  if (process.env.DEBUG_RAW_PROVIDER === "1") return true;
  const id = String(characterId || "").toLowerCase();
  const msg = String(message || "").trim().toLowerCase();
  return id === "weaver" && (msg === "привет" || msg === "hello");
}

/** Per-character sampling. Living Weaver/Dream: open variety, no penalties. */
function samplingForCharacter(characterId) {
  const id = String(characterId || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (
    id === "weaver" ||
    id === "dream" ||
    id === "pak" ||
    id === "drpak" ||
    id === "liora" ||
    id === "crystal" ||
    id === "cat" ||
    id === "shiny" ||
    id === "shiny_bro" ||
    id === "talk_mushroom" ||
    id === "mushroom" ||
    id === "angry_forest" ||
    id === "forest" ||
    id === "keeper" ||
    id === "kiper"
  ) {
    return {
      temperature: 1.0,
      topP: 0.95,
      frequencyPenalty: null,
      presencePenalty: null,
    };
  }
  return {
    temperature: 1.0,
    topP: 0.9,
    frequencyPenalty: null,
    presencePenalty: null,
  };
}

function logRawProvider(label, payload) {
  console.log(`\n========== [RAW ${label}] ==========`);
  console.log(JSON.stringify(payload, null, 2));
  console.log(`========== [END RAW ${label}] ==========\n`);
}

/**
 * Groq = OpenAI-compatible. Constant prefix first for automatic prompt-prefix caching.
 * @returns {Promise<{ ok: true, text: string, usage: object } | { ok: false, isRateLimit: boolean, err?: Error }>}
 */
async function tryGroq(fullPrompt, recentHistory, trimmed, assembled, logCtx = {}) {
  if (!GROQ_API_KEY) {
    return { ok: false, isRateLimit: false, err: new Error("GROQ_API_KEY not set") };
  }
  try {
    const messages = [];
    if (assembled?.constant) {
      messages.push({ role: "system", content: assembled.constant });
      if (assembled.variable) {
        messages.push({ role: "system", content: assembled.variable });
      }
    } else {
      messages.push({ role: "system", content: fullPrompt });
    }
    for (const turn of recentHistory) {
      messages.push({
        role: turn.role === "user" ? "user" : "assistant",
        content: turn.text || "",
      });
    }
    messages.push({ role: "user", content: trimmed });

    const url = `${GROQ_BASE}/chat/completions`;
    const sample = samplingForCharacter(logCtx.characterId);
    const body = {
      model: GROQ_MODEL,
      messages,
      stream: false,
      temperature: sample.temperature,
      top_p: sample.topP,
      max_completion_tokens: 8192,
      reasoning_effort: "low",
    };
    if (sample.frequencyPenalty != null) body.frequency_penalty = sample.frequencyPenalty;
    if (sample.presencePenalty != null) body.presence_penalty = sample.presencePenalty;

    if (shouldLogRawProvider(logCtx.characterId, trimmed)) {
      logRawProvider("GROQ REQUEST", {
        provider: "groq",
        url,
        model: GROQ_MODEL,
        body,
      });
    }

    // gpt-oss spends completion budget on reasoning first. A low max_tokens
    // often returns truncated/empty message.content with finish_reason=length.
    const groqRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (groqRes.ok) {
      const data = await groqRes.json();
      if (shouldLogRawProvider(logCtx.characterId, trimmed)) {
        logRawProvider("GROQ RESPONSE", {
          provider: "groq",
          status: groqRes.status,
          data,
        });
      }
      const choice = data?.choices?.[0];
      const message = choice?.message || {};
      let text = message.content ?? "";
      // Some reasoning payloads put the visible answer only after empty content.
      if (!String(text).trim() && typeof message.reasoning === "string") {
        // Never show chain-of-thought; treat as empty and fall through.
        text = "";
      }
      const finish = choice?.finish_reason || choice?.finishReason || "";
      if (!String(text).trim() && /length/i.test(finish)) {
        console.warn("[Groq] empty/truncated content (finish=length); reasoning likely ate the budget");
      }
      return {
        ok: true,
        text: String(text).trim() || "…",
        usage: extractUsage(data),
        finishReason: finish || undefined,
      };
    }

    const errText = await groqRes.text();
    if (shouldLogRawProvider(logCtx.characterId, trimmed)) {
      logRawProvider("GROQ RESPONSE ERROR", {
        provider: "groq",
        status: groqRes.status,
        body: errText,
      });
    }
    let errMsg = errText;
    try {
      const j = JSON.parse(errText);
      errMsg = j.error?.message || j.error?.code || errText;
    } catch (_) {}
    console.warn("[Groq] error", groqRes.status, errMsg);
    const isRateLimit =
      groqRes.status === 429 || /rate limit|too many requests|quota/i.test(errMsg);
    return {
      ok: false,
      isRateLimit,
      err: new Error(errMsg),
    };
  } catch (err) {
    console.warn("[Groq] error", err.message);
    return { ok: false, isRateLimit: isRateLimitError(err), err };
  }
}

function rateLimitResponse(res, character, lang) {
  const waitPhrase = getRateLimitMessage(character);
  return res.status(429).json({
    code: "rate_limit",
    waitPhrase,
    retryHint:
      lang === "en" ? "Try again in a minute" : "Попробуй ещё раз через минуту",
  });
}

function bothFailedResponse(res, character, lang, geminiFail, groqFail) {
  // After fallback: both providers hit the limit → soft wait UI, no technical error.
  if (geminiFail?.isRateLimit && groqFail?.isRateLimit) {
    return rateLimitResponse(res, character, lang);
  }
  // Only one provider configured and it hit the limit
  if (geminiFail?.isRateLimit && !GROQ_API_KEY) {
    return rateLimitResponse(res, character, lang);
  }
  if (groqFail?.isRateLimit && !genAI) {
    return rateLimitResponse(res, character, lang);
  }
  const msg =
    lang === "en"
      ? "Could not reach the character. Try again later."
      : "Не удалось достучаться до персонажа. Попробуй позже.";
  return res.status(500).json({ error: msg });
}

/**
 * Gemini with explicit cache for hybrid constant prefix when available.
 * @returns {Promise<{ ok: true, text: string, usage: object, cacheName?: string } | { ok: false, err: Error, isRateLimit: boolean }>}
 */
async function tryGemini(fullPrompt, recentHistory, trimmed, opts = {}) {
  if (!genAI) return { ok: false, err: new Error("Gemini API key missing"), isRateLimit: false };
  try {
    const contents = recentHistory.map((turn) => ({
      role: turn.role === "user" ? "user" : "model",
      parts: [{ text: turn.text || "" }],
    }));

    const { assembled, characterId } = opts;
    let cacheName = null;
    const sample = samplingForCharacter(characterId);
    // maxOutputTokens includes thinking tokens on Gemini 3.x. A low cap
    // (e.g. 1024) often cuts the visible reply mid-sentence (MAX_TOKENS).
    const config = {
      temperature: sample.temperature,
      topP: sample.topP,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingLevel: "low" },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };
    if (sample.frequencyPenalty != null) config.frequencyPenalty = sample.frequencyPenalty;
    if (sample.presencePenalty != null) config.presencePenalty = sample.presencePenalty;

    // coreOnly / empty variable: always put prompt in systemInstruction (no cache).
    const useCache = Boolean(assembled?.constant && characterId && assembled.variable);
    if (useCache) {
      try {
        cacheName = await getOrCreateConstantCache(
          genAI,
          GEMINI_MODEL,
          characterId,
          assembled.constant
        );
      } catch (cacheErr) {
        console.warn("[Gemini cache] create failed, falling back:", cacheErr.message);
      }
    }

    if (cacheName) {
      config.cachedContent = cacheName;
      // Variable tail (state/mode/map/lang) goes before the user turn
      if (assembled.variable) {
        contents.push({
          role: "user",
          parts: [{ text: `[Контекст запроса]\n${assembled.variable}` }],
        });
        contents.push({
          role: "model",
          parts: [{ text: "Понял." }],
        });
      }
      contents.push({ role: "user", parts: [{ text: trimmed }] });
    } else {
      // Official field for @google/genai SDK → maps to system_instruction
      config.systemInstruction = fullPrompt;
      contents.push({ role: "user", parts: [{ text: trimmed }] });
    }

    const requestPayload = {
      provider: "gemini",
      url: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      model: GEMINI_MODEL,
      systemInstructionPath: cacheName
        ? "cachedContent.systemInstruction (set at cache create)"
        : "config.systemInstruction",
      cacheName: cacheName || null,
      body: {
        model: GEMINI_MODEL,
        contents,
        config: {
          ...config,
          systemInstruction: config.systemInstruction
            ? String(config.systemInstruction).slice(0, 200) +
              (String(config.systemInstruction).length > 200
                ? `…[${String(config.systemInstruction).length} chars]`
                : "")
            : undefined,
          // full system text logged separately below when debugging
        },
        systemInstructionFull: config.systemInstruction || null,
      },
    };

    if (shouldLogRawProvider(characterId, trimmed)) {
      logRawProvider("GEMINI REQUEST", requestPayload);
    }

    let result;
    try {
      result = await genAI.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config,
      });
    } catch (thinkErr) {
      const msg = String(thinkErr?.message || thinkErr);
      // Older SDK / model mismatch: retry without thinkingConfig.
      if (config.thinkingConfig && /thinking|ThinkingLevel|unknown/i.test(msg)) {
        console.warn("[Gemini] thinkingConfig rejected, retrying without it:", thinkErr.message);
        delete config.thinkingConfig;
        result = await genAI.models.generateContent({
          model: GEMINI_MODEL,
          contents,
          config,
        });
      } else if (
        (config.frequencyPenalty != null || config.presencePenalty != null) &&
        /frequencyPenalty|presencePenalty|Unknown name|invalid/i.test(msg)
      ) {
        console.warn("[Gemini] penalties rejected, retrying without them:", thinkErr.message);
        delete config.frequencyPenalty;
        delete config.presencePenalty;
        result = await genAI.models.generateContent({
          model: GEMINI_MODEL,
          contents,
          config,
        });
      } else {
        throw thinkErr;
      }
    }

    if (shouldLogRawProvider(characterId, trimmed)) {
      logRawProvider("GEMINI RESPONSE", {
        provider: "gemini",
        model: GEMINI_MODEL,
        text: typeof result?.text === "function" ? result.text() : result?.text,
        candidates: result?.candidates,
        usageMetadata: result?.usageMetadata,
        promptFeedback: result?.promptFeedback,
      });
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
    return {
      ok: true,
      text: (text ?? "").trim() || "…",
      usage: extractUsage(result),
      cacheName: cacheName || undefined,
    };
  } catch (err) {
    console.warn("[Gemini] error", err.message);
    if (shouldLogRawProvider(opts.characterId, trimmed)) {
      logRawProvider("GEMINI RESPONSE ERROR", {
        provider: "gemini",
        error: String(err?.message || err),
        status: err?.status,
      });
    }
    return { ok: false, err, isRateLimit: isRateLimitError(err) };
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    gemini: !!apiKey,
    groq: !!GROQ_API_KEY,
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      history = [],
      character = "weaver",
      provider = "gemini",
      systemExtra = "",
      mode = "talk",
      readChapter,
      currentChapter,
      conversationKey,
      conversationSummary,
      conversationSummaryAt,
      moodNow = null,
      moodNowIndex = null,
      debugPrompt = false,
    } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message required" });
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return res.status(400).json({ error: "Empty message" });
    }

    const rawProvider = (typeof provider === "string" ? provider.trim().toLowerCase() : "") || "gemini";
    const activeProvider =
      rawProvider === "auto"
        ? isEnglish(trimmed)
          ? "groq"
          : "gemini"
        : rawProvider === "groq"
          ? "groq"
          : "gemini";

    const msgLang = detectMessageLanguage(trimmed);
    const prepared = prepareChatPayload({
      character,
      message: trimmed,
      history,
      mode,
      readChapter,
      currentChapter,
      language: msgLang,
      systemExtra,
      conversationKey: conversationKey || `${character}`,
      clientSummary: conversationSummary,
      clientSummaryAt: conversationSummaryAt,
      moodNow,
      moodNowIndex,
    });

    const resolvedMoodNow = prepared.meta?.moodNow || null;

    const {
      fullPrompt,
      recentHistory,
      assembled,
      meta,
    } = prepared;

    if (debugPrompt || process.env.DEBUG_PROMPT === "1") {
      console.log("\n========== [PROMPT DEBUG] ==========");
      console.log(JSON.stringify(meta, null, 2));
      console.log("--- FULL SYSTEM PROMPT ---");
      console.log(fullPrompt);
      console.log("--- END PROMPT ---");
      console.log(`inputTokensEst=${meta.inputTokensEst} recentTurns=${meta.recentTurns}`);
      console.log("====================================\n");
    }

    const requestedProvider = activeProvider === "groq" ? "groq" : "gemini";
    const hybridAssembled = prepared.hybrid
      ? { constant: prepared.constant, variable: prepared.variable }
      : null;

    const geminiOpts = {
      assembled: hybridAssembled,
      characterId: (character || "").toLowerCase().trim().replace(/\s+/g, "_"),
    };

    const groqLog = { characterId: geminiOpts.characterId };

    const withMood = (payload) =>
      resolvedMoodNow ? { ...payload, moodNow: resolvedMoodNow } : payload;

    if (activeProvider === "gemini") {
      const geminiResult = await tryGemini(fullPrompt, recentHistory, trimmed, geminiOpts);
      if (geminiResult.ok) {
        return res.json(
          withMood({
            text: geminiResult.text,
            provider: "gemini",
            requestedProvider,
            usage: geminiResult.usage,
            promptMeta: debugPrompt ? meta : undefined,
          })
        );
      }

      if (!genAI && !GROQ_API_KEY) {
        return res.status(503).json({ error: "Gemini API key missing" });
      }

      console.warn(
        "[Gemini] → fallback to Groq",
        geminiResult.err?.message || geminiResult.err || ""
      );
      const groqResult = await tryGroq(
        fullPrompt,
        recentHistory,
        trimmed,
        hybridAssembled,
        groqLog
      );
      if (groqResult.ok) {
        return res.json(
          withMood({
            text: groqResult.text,
            provider: "groq",
            requestedProvider,
            usage: groqResult.usage,
            fallbackFrom: "gemini",
            promptMeta: debugPrompt ? meta : undefined,
          })
        );
      }

      if (!genAI && !GROQ_API_KEY) {
        return res.status(503).json({ error: "Gemini API key missing" });
      }
      return bothFailedResponse(res, character, msgLang, geminiResult, groqResult);
    }

    const groqResult = await tryGroq(
      fullPrompt,
      recentHistory,
      trimmed,
      hybridAssembled,
      groqLog
    );
    if (groqResult.ok) {
      return res.json(
        withMood({
          text: groqResult.text,
          provider: "groq",
          requestedProvider,
          usage: groqResult.usage,
          promptMeta: debugPrompt ? meta : undefined,
        })
      );
    }

    if (!GROQ_API_KEY) console.warn("[Groq] GROQ_API_KEY not set → fallback to Gemini");
    else console.warn("[Groq] → fallback to Gemini");

    const geminiResult = await tryGemini(fullPrompt, recentHistory, trimmed, geminiOpts);
    if (geminiResult.ok) {
      return res.json(
        withMood({
          text: geminiResult.text,
          provider: "gemini",
          requestedProvider,
          usage: geminiResult.usage,
          fallbackFrom: "groq",
          promptMeta: debugPrompt ? meta : undefined,
        })
      );
    }

    if (!genAI && !GROQ_API_KEY) {
      return res.status(503).json({ error: "Gemini API key missing" });
    }

    return bothFailedResponse(res, character, msgLang, geminiResult, groqResult);
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
