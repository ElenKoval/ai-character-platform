/**
 * Keeper (Кипер) — living prompt from simple/keeper.md + random «Сейчас» line.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEEPER_MD = path.resolve(__dirname, "../../simple/keeper.md");
const KEEPER_NOW = path.resolve(__dirname, "../../simple/keeper-now.json");

function loadKeeperPrompt() {
  const text = fs.readFileSync(KEEPER_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Keeper prompt: ${KEEPER_MD}`);
  return text;
}

function loadNowLines() {
  const raw = JSON.parse(fs.readFileSync(KEEPER_NOW, "utf8"));
  if (!Array.isArray(raw) || !raw.length) {
    throw new Error(`Empty Keeper now-list: ${KEEPER_NOW}`);
  }
  return raw.map((s) => String(s || "").trim()).filter(Boolean);
}

/** Template with `{сейчас}` placeholder. */
export const KEEPER_CORE = loadKeeperPrompt();

/** Mood lines for the СЕЙЧАС block. */
export const KEEPER_NOW_LINES = loadNowLines();

export function pickKeeperNow(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const i =
      ((Math.trunc(seed) % KEEPER_NOW_LINES.length) + KEEPER_NOW_LINES.length) %
      KEEPER_NOW_LINES.length;
    return KEEPER_NOW_LINES[i];
  }
  if (typeof seed === "string" && seed.trim()) {
    const exact = seed.trim();
    if (KEEPER_NOW_LINES.includes(exact)) return exact;
  }
  const i = Math.floor(Math.random() * KEEPER_NOW_LINES.length);
  return KEEPER_NOW_LINES[i];
}

/** Fill `{сейчас}` in the template. */
export function applyKeeperNow(template, nowLine) {
  const line = String(nowLine || pickKeeperNow()).trim();
  return String(template || KEEPER_CORE).split("{сейчас}").join(line);
}

export function pickKeeperState() {
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
  return applyKeeperNow(KEEPER_CORE, pickKeeperNow());
}
