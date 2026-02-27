/**
 * Реестр промптов персонажей: подключает все server/prompts/*.js
 * и экспортирует getSystemPrompt(characterId).
 */
import { getSystemPrompt as getWeaver } from "./weaver.js";
import { getSystemPrompt as getDream } from "./dream.js";
import { getSystemPrompt as getCrystal } from "./crystal.js";
import { getSystemPrompt as getDrpak } from "./drpak.js";
import { getSystemPrompt as getLiora } from "./liora.js";
import { getSystemPrompt as getShiny } from "./shiny.js";
import { getSystemPrompt as getShinyBro } from "./shiny_bro.js";
import { getSystemPrompt as getAngryForest } from "./angry_forest.js";
import { getSystemPrompt as getTalkMushroom } from "./talk_mushroom.js";
import { getSystemPrompt as getNature } from "./nature.js";
import { getSystemPrompt as getKeeper } from "./keeper.js";

const prompts = {
  weaver: getWeaver,
  dream: getDream,
  crystal: getCrystal,
  drpak: getDrpak,
  liora: getLiora,
  shiny: getShiny,
  shiny_bro: getShinyBro,
  angry_forest: getAngryForest,
  talk_mushroom: getTalkMushroom,
  nature: getNature,
  keeper: getKeeper,
};

/**
 * Возвращает системный промпт для персонажа.
 * @param {string} characterId - идентификатор (weaver, dream, crystal, keeper и т.д.)
 * @returns {string} системный промпт
 */
export function getSystemPrompt(characterId) {
  const id = (characterId || "").toLowerCase().trim().replace(/\s+/g, "_");
  const fn = prompts[id];
  if (fn) return fn();
  return getWeaver();
}
