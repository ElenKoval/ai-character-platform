/**
 * Pak — living prompt from simple/pak.md + random «Сейчас» line.
 * API id may be "drpak"; assembly resolves via HYBRID_ALIASES.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAK_MD = path.resolve(__dirname, "../../simple/pak.md");
const PAK_NOW = path.resolve(__dirname, "../../simple/pak-now.json");

function loadPakPrompt() {
  const text = fs.readFileSync(PAK_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Pak prompt: ${PAK_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(PAK_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Pak now-list: ${PAK_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const PAK_CORE = loadPakPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const PAK_NOW_LINES = loadNowLines();

export function pickPakNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i =
      ((Math.trunc(seed) % PAK_NOW_LINES.length) + PAK_NOW_LINES.length) %
      PAK_NOW_LINES.length;
    return PAK_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (PAK_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * PAK_NOW_LINES.length);
  return PAK_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyPakNow(template, nowLine) {
  const line = String(nowLine || pickPakNow()).trim();
  return String(template || PAK_CORE).split("{сейчас}").join(line);
}

export function pickPakState() {
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

export function blockPakThreadMode() {
  return "";
}
