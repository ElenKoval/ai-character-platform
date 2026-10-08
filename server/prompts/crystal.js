/**
 * Crystal — living prompt from simple/crystal.md + random «Сейчас» line.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CRYSTAL_MD = path.resolve(__dirname, "../../simple/crystal.md");
const CRYSTAL_NOW = path.resolve(__dirname, "../../simple/crystal-now.json");

function loadCrystalPrompt() {
  const text = fs.readFileSync(CRYSTAL_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Crystal prompt: ${CRYSTAL_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(CRYSTAL_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Crystal now-list: ${CRYSTAL_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const CRYSTAL_CORE = loadCrystalPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const CRYSTAL_NOW_LINES = loadNowLines();

export function pickCrystalNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i =
      ((Math.trunc(seed) % CRYSTAL_NOW_LINES.length) + CRYSTAL_NOW_LINES.length) %
      CRYSTAL_NOW_LINES.length;
    return CRYSTAL_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (CRYSTAL_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * CRYSTAL_NOW_LINES.length);
  return CRYSTAL_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyCrystalNow(template, nowLine) {
  const line = String(nowLine || pickCrystalNow()).trim();
  return String(template || CRYSTAL_CORE).split("{сейчас}").join(line);
}

export function pickCrystalState() {
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
  return applyCrystalNow(CRYSTAL_CORE, pickCrystalNow());
}
