/**
 * Cap chat history: last 14 turns + optional extractive summary of older ones.
 * Summary refreshed every 10 new messages (per conversation key).
 */

const RECENT_LIMIT = 10;
const SUMMARY_EVERY = 10;

/** @type {Map<string, { summary: string, atLength: number }>} */
const summaryStore = new Map();

function clip(text, max = 180) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

/** Cheap extractive summary (no LLM): 3–5 sentences from older turns. */
export function buildExtractiveSummary(olderTurns, lang = "ru") {
  const users = olderTurns.filter((t) => t.role === "user").map((t) => clip(t.text, 160));
  const models = olderTurns.filter((t) => t.role !== "user").map((t) => clip(t.text, 120));

  const aboutSelf = users.slice(0, 3);
  const topics = users.slice(-3);
  const replies = models.slice(-2);

  const sentences = [];
  if (lang === "en") {
    if (aboutSelf.length) {
      sentences.push(`The person shared: ${aboutSelf.join("; ")}.`);
    }
    if (topics.length && topics.join() !== aboutSelf.join()) {
      sentences.push(`They also talked about: ${topics.join("; ")}.`);
    }
    if (replies.length) {
      sentences.push(`The character answered briefly about: ${replies.join("; ")}.`);
    }
    if (!sentences.length) sentences.push("Earlier they exchanged a few short remarks.");
  } else {
    if (aboutSelf.length) {
      sentences.push(`Человек рассказал о себе: ${aboutSelf.join("; ")}.`);
    }
    if (topics.length && topics.join() !== aboutSelf.join()) {
      sentences.push(`Ещё речь шла о: ${topics.join("; ")}.`);
    }
    if (replies.length) {
      sentences.push(`Персонаж коротко отвечал про: ${replies.join("; ")}.`);
    }
    if (!sentences.length) sentences.push("Ранее они обменялись несколькими короткими репликами.");
  }

  return sentences.slice(0, 5).join(" ");
}

/**
 * @param {Array<{role: string, text: string}>} history
 * @param {{ conversationKey?: string, language?: string, clientSummary?: string, clientSummaryAt?: number }} opts
 * @returns {{ recent: Array, summary: string|null, injected: Array }}
 */
export function prepareHistory(history, opts = {}) {
  const turns = Array.isArray(history)
    ? history.filter((t) => t && (t.text || t.content))
    : [];
  const normalized = turns.map((t) => ({
    role: t.role === "user" ? "user" : "model",
    text: String(t.text || t.content || ""),
  }));

  if (normalized.length <= RECENT_LIMIT) {
    return { recent: normalized, summary: null, injected: normalized };
  }

  const older = normalized.slice(0, -RECENT_LIMIT);
  const recent = normalized.slice(-RECENT_LIMIT);
  const key = opts.conversationKey || "default";
  const lang = opts.language === "en" ? "en" : "ru";

  let entry = summaryStore.get(key);
  const totalLen = normalized.length;

  const clientSummary =
    typeof opts.clientSummary === "string" && opts.clientSummary.trim()
      ? opts.clientSummary.trim()
      : "";
  const clientAt = Number(opts.clientSummaryAt);

  if (clientSummary && Number.isFinite(clientAt)) {
    entry = { summary: clientSummary, atLength: clientAt };
    summaryStore.set(key, entry);
  }

  if (!entry || totalLen - entry.atLength >= SUMMARY_EVERY) {
    entry = {
      summary: buildExtractiveSummary(older, lang),
      atLength: totalLen,
    };
    summaryStore.set(key, entry);
  }

  return {
    recent,
    summary: entry.summary,
    injected: recent,
    summaryAtLength: entry.atLength,
  };
}

export function summaryAsSystemNote(summary, lang = "ru") {
  if (!summary) return null;
  const label =
    lang === "en"
      ? "Earlier in this conversation (compressed):"
      : "Ранее в этом разговоре (сжато):";
  return `${label}\n${summary}`;
}

export const HISTORY_LIMITS = { RECENT_LIMIT, SUMMARY_EVERY };
