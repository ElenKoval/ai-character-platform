/**
 * Legacy entrypoint — Pak is hybrid now (see pak.js).
 * Kept so old imports don't break; prefer buildHybridPrompt("drpak"|"pak").
 */
import { buildHybridPrompt } from "./assemble.js";

export function getSystemPrompt(ctx = {}) {
  return buildHybridPrompt("pak", ctx)?.full || "";
}
