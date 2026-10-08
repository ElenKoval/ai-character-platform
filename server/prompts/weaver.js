/**
 * Weaver — living-conversation prompt loaded ONLY from simple/viver.md.
 * No shared blocks, gender line, mode/read/lang tails, or chapter states.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const isHybrid = true;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIVER_MD = path.resolve(__dirname, "../../simple/viver.md");

function loadViverPrompt() {
  const text = fs.readFileSync(VIVER_MD, "utf8").trim();
  if (!text) throw new Error(`Empty Weaver prompt: ${VIVER_MD}`);
  return text;
}

/** Full character instruction — sole system prompt for Weaver. */
export const WEAVER_CORE = loadViverPrompt();

/** No chapter-state block. */
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

/** Kept for API compatibility; assemble skips modeExtra when coreOnly. */
export function blockWeaverThreadMode() {
  return "";
}
