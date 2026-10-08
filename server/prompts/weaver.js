/**
 * Weaver — living prompt from simple/viver.md + random «Сейчас» line.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIVER_MD = path.resolve(__dirname, "../../simple/viver.md");
const VIVER_NOW = path.resolve(__dirname, "../../simple/viver-now.json");

function loadViverPrompt() {
  const text = fs.readFileSync(VIVER_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Weaver prompt: ${VIVER_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(VIVER_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Weaver now-list: ${VIVER_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const WEAVER_CORE = loadViverPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const WEAVER_NOW_LINES = loadNowLines();

export function pickWeaverNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i = ((Math.trunc(seed) % WEAVER_NOW_LINES.length) + WEAVER_NOW_LINES.length) %
      WEAVER_NOW_LINES.length;
    return WEAVER_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (WEAVER_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * WEAVER_NOW_LINES.length);
  return WEAVER_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyWeaverNow(template, nowLine) {
  const line = String(nowLine || pickWeaverNow()).trim();
  return String(template || WEAVER_CORE).split("{сейчас}").join(line);
}

export function pickWeaverState() {
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

export function blockWeaverThreadMode() {
  return "";
}
