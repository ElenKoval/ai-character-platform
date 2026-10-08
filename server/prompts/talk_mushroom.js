/**
 * Mushroom (Гриб) — living prompt from simple/talk_mushroom.md + random «Сейчас» line.
 * API id: talk_mushroom (story-meta mushroom).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MUSHROOM_MD = path.resolve(__dirname, "../../simple/talk_mushroom.md");
const MUSHROOM_NOW = path.resolve(__dirname, "../../simple/talk_mushroom-now.json");

function loadMushroomPrompt() {
  const text = fs.readFileSync(MUSHROOM_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Mushroom prompt: ${MUSHROOM_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(MUSHROOM_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Mushroom now-list: ${MUSHROOM_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const TALK_MUSHROOM_CORE = loadMushroomPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const TALK_MUSHROOM_NOW_LINES = loadNowLines();

export function pickTalkMushroomNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i =
      ((Math.trunc(seed) % TALK_MUSHROOM_NOW_LINES.length) +
        TALK_MUSHROOM_NOW_LINES.length) %
      TALK_MUSHROOM_NOW_LINES.length;
    return TALK_MUSHROOM_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (TALK_MUSHROOM_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * TALK_MUSHROOM_NOW_LINES.length);
  return TALK_MUSHROOM_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyTalkMushroomNow(template, nowLine) {
  const line = String(nowLine || pickTalkMushroomNow()).trim();
  return String(template || TALK_MUSHROOM_CORE).split("{сейчас}").join(line);
}

export function pickTalkMushroomState() {
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
  return applyTalkMushroomNow(TALK_MUSHROOM_CORE, pickTalkMushroomNow());
}
