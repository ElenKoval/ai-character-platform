/**
 * Реестр промптов персонажей.
 */
import { isHybrid as dreamHybrid } from "./dream.js";
import { isHybrid as weaverHybrid } from "./weaver.js";
import { isHybrid as pakHybrid } from "./pak.js";
import { isHybrid as lioraHybrid } from "./liora.js";
import { isHybrid as catHybrid } from "./cat.js";
import { isHybrid as crystalHybrid } from "./crystal.js";
import { isHybrid as shinyHybrid } from "./shiny.js";
import { isHybrid as shinyBroHybrid } from "./shiny_bro.js";
import { isHybrid as talkMushroomHybrid } from "./talk_mushroom.js";
import { isHybrid as angryForestHybrid } from "./angry_forest.js";
import { isHybrid as keeperHybrid } from "./keeper.js";
import { getSystemPrompt as getDryad } from "./dryad.js";
import { isHybridCharacter, resolveHybridId } from "./shared.js";
import { buildHybridPrompt } from "./assemble.js";

const legacyPrompts = {
  nature: getDryad,
  dryad: getDryad,
};

/**
 * @param {string} characterId
 * @param {object} [ctx]
 * @returns {string}
 */
export function getSystemPrompt(characterId, ctx = {}) {
  const id = (characterId || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (usesHybridPrompt(id)) {
    const assembled = buildHybridPrompt(id, ctx);
    return assembled?.full || "";
  }
  const fn = legacyPrompts[id];
  if (fn) return fn(ctx);
  return "";
}

export function getAssembledPrompt(characterId, ctx = {}) {
  const id = (characterId || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (usesHybridPrompt(id)) return buildHybridPrompt(id, ctx);
  const full = getSystemPrompt(id, ctx);
  return { constant: full, variable: "", full, meta: { characterId: id, hybrid: false } };
}

export function usesHybridPrompt(characterId) {
  const id = (characterId || "").toLowerCase().trim().replace(/\s+/g, "_");
  const canon = resolveHybridId(id);
  return (
    isHybridCharacter(id) ||
    Boolean(dreamHybrid && canon === "dream") ||
    Boolean(weaverHybrid && canon === "weaver") ||
    Boolean(pakHybrid && canon === "pak") ||
    Boolean(lioraHybrid && canon === "liora") ||
    Boolean(catHybrid && canon === "cat") ||
    Boolean(crystalHybrid && canon === "crystal") ||
    Boolean(shinyHybrid && canon === "shiny") ||
    Boolean(shinyBroHybrid && canon === "shiny_bro") ||
    Boolean(talkMushroomHybrid && canon === "talk_mushroom") ||
    Boolean(angryForestHybrid && canon === "angry_forest") ||
    Boolean(keeperHybrid && canon === "keeper")
  );
}
