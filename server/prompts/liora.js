/**
 * Liora — living prompt from simple/liora.md + random «Сейчас» line.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIORA_MD = path.resolve(__dirname, "../../simple/liora.md");
const LIORA_NOW = path.resolve(__dirname, "../../simple/liora-now.json");

function loadLioraPrompt() {
  const text = fs.readFileSync(LIORA_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Liora prompt: ${LIORA_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(LIORA_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Liora now-list: ${LIORA_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const LIORA_CORE = loadLioraPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const LIORA_NOW_LINES = loadNowLines();

export function pickLioraNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i =
      ((Math.trunc(seed) % LIORA_NOW_LINES.length) + LIORA_NOW_LINES.length) %
      LIORA_NOW_LINES.length;
    return LIORA_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (LIORA_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * LIORA_NOW_LINES.length);
  return LIORA_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyLioraNow(template, nowLine) {
  const line = String(nowLine || pickLioraNow()).trim();
  return String(template || LIORA_CORE).split("{сейчас}").join(line);
}

export function pickLioraState() {
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

export function blockLioraThreadMode() {
  return "";
}
