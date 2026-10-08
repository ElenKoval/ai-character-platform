/**
 * Angry Forest (Злой Лес) — living prompt from simple/angry_forest.md + «Сейчас».
 * API id: angry_forest (story-meta forest).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOREST_MD = path.resolve(__dirname, "../../simple/angry_forest.md");
const FOREST_NOW = path.resolve(__dirname, "../../simple/angry_forest-now.json");

function loadForestPrompt() {
  const text = fs.readFileSync(FOREST_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Angry Forest prompt: ${FOREST_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(FOREST_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Angry Forest now-list: ${FOREST_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const ANGRY_FOREST_CORE = loadForestPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const ANGRY_FOREST_NOW_LINES = loadNowLines();

export function pickAngryForestNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i =
      ((Math.trunc(seed) % ANGRY_FOREST_NOW_LINES.length) +
        ANGRY_FOREST_NOW_LINES.length) %
      ANGRY_FOREST_NOW_LINES.length;
    return ANGRY_FOREST_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (ANGRY_FOREST_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * ANGRY_FOREST_NOW_LINES.length);
  return ANGRY_FOREST_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyAngryForestNow(template, nowLine) {
  const line = String(nowLine || pickAngryForestNow()).trim();
  return String(template || ANGRY_FOREST_CORE).split("{сейчас}").join(line);
}

export function pickAngryForestState() {
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
  return applyAngryForestNow(ANGRY_FOREST_CORE, pickAngryForestNow());
}
