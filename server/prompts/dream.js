/**
 * Dream — living prompt from simple/dream.md + random «Сейчас» line.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DREAM_MD = path.resolve(__dirname, "../../simple/dream.md");
const DREAM_NOW = path.resolve(__dirname, "../../simple/dream-now.json");

function loadDreamPrompt() {
  const text = fs.readFileSync(DREAM_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Dream prompt: ${DREAM_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(DREAM_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Dream now-list: ${DREAM_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const DREAM_CORE = loadDreamPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const DREAM_NOW_LINES = loadNowLines();

export function pickDreamNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i =
      ((Math.trunc(seed) % DREAM_NOW_LINES.length) + DREAM_NOW_LINES.length) %
      DREAM_NOW_LINES.length;
    return DREAM_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (DREAM_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * DREAM_NOW_LINES.length);
  return DREAM_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyDreamNow(template, nowLine) {
  const line = String(nowLine || pickDreamNow()).trim();
  return String(template || DREAM_CORE).split("{сейчас}").join(line);
}

export function pickDreamState() {
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

export function blockDreamThreadMode() {
  return "";
}
