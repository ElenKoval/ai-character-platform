/**
 * Cat — living prompt from simple/cat.md + random «Сейчас» line.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAT_MD = path.resolve(__dirname, "../../simple/cat.md");
const CAT_NOW = path.resolve(__dirname, "../../simple/cat-now.json");

function loadCatPrompt() {
  const text = fs.readFileSync(CAT_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Cat prompt: ${CAT_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(CAT_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Cat now-list: ${CAT_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const CAT_CORE = loadCatPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const CAT_NOW_LINES = loadNowLines();

export function pickCatNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i =
      ((Math.trunc(seed) % CAT_NOW_LINES.length) + CAT_NOW_LINES.length) %
      CAT_NOW_LINES.length;
    return CAT_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (CAT_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * CAT_NOW_LINES.length);
  return CAT_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyCatNow(template, nowLine) {
  const line = String(nowLine || pickCatNow()).trim();
  return String(template || CAT_CORE).split("{сейчас}").join(line);
}

export function pickCatState() {
  return {
    id: "live",
    min: 0,
    max: 13,
    label: "Живой разговор",
    memories: [],
    emotionText: "",
    text: "",
  };
}

/** Legacy export — hybrid path uses assemble. */
export function getSystemPrompt() {
  return applyCatNow(CAT_CORE, pickCatNow());
}

/** Thread / ask_more: keep short, same restless voice. */
export function blockCatThreadMode(ctx = {}) {
  const mode = String(ctx.mode || "talk").toLowerCase().trim();
  const isThread =
    mode === "thread" ||
    mode === "твоя нить" ||
    mode === "your_thread" ||
    mode === "your-thread" ||
    mode === "ask_more" ||
    mode === "ask-more" ||
    mode === "спросить ещё" ||
    mode === "crew";
  if (!isThread) return "";

  const label =
    mode === "ask_more" || mode === "ask-more" || mode === "спросить ещё" || mode === "crew"
      ? "Спросить ещё"
      : "Твоя Нить";

  return `## Режим «${label}»
Человек назвал, чего хочет слишком сильно. Спроси одно: что именно. Можно коротко про след на Нити – «было так, стало иначе», без вреда телу. Одно простое действие. Без метафор, без утешений, максимум два коротких предложения.`;
}
