/**
 * Shiny's Brother — living prompt from simple/shiny_bro.md + random «Сейчас» line.
 * API id: shiny_bro (story-meta shinyBro).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRO_MD = path.resolve(__dirname, "../../simple/shiny_bro.md");
const BRO_NOW = path.resolve(__dirname, "../../simple/shiny_bro-now.json");

function loadBroPrompt() {
  const text = fs.readFileSync(BRO_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Brother prompt: ${BRO_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(BRO_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Brother now-list: ${BRO_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const SHINY_BRO_CORE = loadBroPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const SHINY_BRO_NOW_LINES = loadNowLines();

export function pickShinyBroNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i =
      ((Math.trunc(seed) % SHINY_BRO_NOW_LINES.length) +
        SHINY_BRO_NOW_LINES.length) %
      SHINY_BRO_NOW_LINES.length;
    return SHINY_BRO_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (SHINY_BRO_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * SHINY_BRO_NOW_LINES.length);
  return SHINY_BRO_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyShinyBroNow(template, nowLine) {
  const line = String(nowLine || pickShinyBroNow()).trim();
  return String(template || SHINY_BRO_CORE).split("{сейчас}").join(line);
}

export function pickShinyBroState() {
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
  return applyShinyBroNow(SHINY_BRO_CORE, pickShinyBroNow());
}
