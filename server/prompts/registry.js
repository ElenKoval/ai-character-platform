/**
 * Реестр промптов персонажей.
 */
import { isHybrid as dreamHybrid } from "./dream.js";
import { isHybrid as weaverHybrid } from "./weaver.js";
import { isHybrid as pakHybrid } from "./pak.js";
import { isHybrid as lioraHybrid } from "./liora.js";
import { isHybrid as catHybrid } from "./cat.js";
import { getSystemPrompt as getCrystal } from "./crystal.js";
import { getSystemPrompt as getShiny } from "./shiny.js";
import { getSystemPrompt as getShinyBro } from "./shiny_bro.js";
import { getSystemPrompt as getAngryForest } from "./angry_forest.js";
import { getSystemPrompt as getTalkMushroom } from "./talk_mushroom.js";
import { getSystemPrompt as getDryad } from "./dryad.js";
import { getSystemPrompt as getKeeper } from "./keeper.js";
import { isHybridCharacter, resolveHybridId } from "./shared.js";
import { buildHybridPrompt } from "./assemble.js";

const legacyPrompts = {
  crystal: getCrystal,
  shiny: getShiny,
  shiny_bro: getShinyBro,
  angry_forest: getAngryForest,
  talk_mushroom: getTalkMushroom,
  nature: getDryad,
  dryad: getDryad,
  keeper: getKeeper,
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
    Boolean(catHybrid && canon === "cat")
  );
}
