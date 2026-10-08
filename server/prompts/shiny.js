/**
 * Shiny — living prompt from simple/shiny.md + random «Сейчас» line.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHINY_MD = path.resolve(__dirname, "../../simple/shiny.md");
const SHINY_NOW = path.resolve(__dirname, "../../simple/shiny-now.json");

function loadShinyPrompt() {
  const text = fs.readFileSync(SHINY_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Shiny prompt: ${SHINY_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(SHINY_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Shiny now-list: ${SHINY_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const SHINY_CORE = loadShinyPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const SHINY_NOW_LINES = loadNowLines();

export function pickShinyNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i =
      ((Math.trunc(seed) % SHINY_NOW_LINES.length) + SHINY_NOW_LINES.length) %
      SHINY_NOW_LINES.length;
    return SHINY_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (SHINY_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * SHINY_NOW_LINES.length);
  return SHINY_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyShinyNow(template, nowLine) {
  const line = String(nowLine || pickShinyNow()).trim();
  return String(template || SHINY_CORE).split("{сейчас}").join(line);
}

export function pickShinyState() {
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
  return applyShinyNow(SHINY_CORE, pickShinyNow());
}
