/**
 * Assemble hybrid system prompts: constant prefix (cacheable) + variable tail.
 */
import {
  BLOCK_WORLD,
  BLOCK_VOICE,
  BLOCK_KNOWLEDGE,
  BLOCK_RULES,
  blockModeOnly,
  blockLanguage,
  blockReadProgress,
  chapterMapUpTo,
  isHybridCharacter,
  normalizeCtx,
  resolveHybridId,
} from "./shared.js";
import {
  DREAM_CORE,
  pickDreamState,
  pickDreamNow,
  applyDreamNow,
} from "./dream.js";
import {
  WEAVER_CORE,
  pickWeaverState,
  pickWeaverNow,
  applyWeaverNow,
} from "./weaver.js";
import {
  PAK_CORE,
  pickPakState,
  pickPakNow,
  applyPakNow,
} from "./pak.js";
import {
  LIORA_CORE,
  pickLioraState,
  pickLioraNow,
  applyLioraNow,
} from "./liora.js";
import {
  CAT_CORE,
  pickCatState,
  pickCatNow,
  applyCatNow,
} from "./cat.js";
import {
  CRYSTAL_CORE,
  pickCrystalState,
  pickCrystalNow,
  applyCrystalNow,
} from "./crystal.js";
import {
  SHINY_CORE,
  pickShinyState,
  pickShinyNow,
  applyShinyNow,
} from "./shiny.js";
import {
  SHINY_BRO_CORE,
  pickShinyBroState,
  pickShinyBroNow,
  applyShinyBroNow,
} from "./shiny_bro.js";
import {
  TALK_MUSHROOM_CORE,
  pickTalkMushroomState,
  pickTalkMushroomNow,
  applyTalkMushroomNow,
} from "./talk_mushroom.js";
import {
  ANGRY_FOREST_CORE,
  pickAngryForestState,
  pickAngryForestNow,
  applyAngryForestNow,
} from "./angry_forest.js";
import {
  KEEPER_CORE,
  pickKeeperState,
  pickKeeperNow,
  applyKeeperNow,
} from "./keeper.js";

const CHARACTER_PARTS = {
  dream: {
    core: DREAM_CORE,
    pickState: pickDreamState,
    /** Living core only — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
  weaver: {
    core: WEAVER_CORE,
    pickState: pickWeaverState,
    /** ONLY simple/viver.md — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
  pak: {
    core: PAK_CORE,
    pickState: pickPakState,
    /** Living core only — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
  liora: {
    core: LIORA_CORE,
    pickState: pickLioraState,
    /** Living core only — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
  cat: {
    core: CAT_CORE,
    pickState: pickCatState,
    /** Living core only — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
  crystal: {
    core: CRYSTAL_CORE,
    pickState: pickCrystalState,
    /** Living core only — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
  shiny: {
    core: SHINY_CORE,
    pickState: pickShinyState,
    /** Living core only — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
  shiny_bro: {
    core: SHINY_BRO_CORE,
    pickState: pickShinyBroState,
    /** Living core only — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
  talk_mushroom: {
    core: TALK_MUSHROOM_CORE,
    pickState: pickTalkMushroomState,
    /** Living core only — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
  angry_forest: {
    core: ANGRY_FOREST_CORE,
    pickState: pickAngryForestState,
    /** Living core only — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
  keeper: {
    core: KEEPER_CORE,
    pickState: pickKeeperState,
    /** Living core only — no shared blocks, gender, mode, read, lang. */
    skipSharedBlocks: true,
    skipChapterMap: true,
    coreOnly: true,
  },
};

/**
 * @returns {{ constant: string, variable: string, full: string, meta: object } | null}
 */
export function buildHybridPrompt(characterId, rawCtx = {}) {
  const id = resolveHybridId(characterId);
  if (!isHybridCharacter(id)) return null;
  const parts = CHARACTER_PARTS[id];
  if (!parts) return null;

  const ctx = normalizeCtx(rawCtx);
  const state = parts.pickState(ctx.readChapter);

  // Living cores: character file only (* fill {сейчас} where supported).
  if (parts.coreOnly) {
    let constant = String(parts.core || "").trim();
    let moodNow = null;
    if (id === "weaver") {
      moodNow = pickWeaverNow(ctx.moodNow);
      constant = applyWeaverNow(constant, moodNow);
    } else if (id === "dream") {
      moodNow = pickDreamNow(ctx.moodNow);
      constant = applyDreamNow(constant, moodNow);
    } else if (id === "pak") {
      moodNow = pickPakNow(ctx.moodNow);
      constant = applyPakNow(constant, moodNow);
    } else if (id === "liora") {
      moodNow = pickLioraNow(ctx.moodNow);
      constant = applyLioraNow(constant, moodNow);
    } else if (id === "crystal") {
      moodNow = pickCrystalNow(ctx.moodNow);
      constant = applyCrystalNow(constant, moodNow);
    } else if (id === "cat") {
      moodNow = pickCatNow(ctx.moodNow);
      constant = applyCatNow(constant, moodNow);
    } else if (id === "shiny") {
      moodNow = pickShinyNow(ctx.moodNow);
      constant = applyShinyNow(constant, moodNow);
    } else if (id === "shiny_bro") {
      moodNow = pickShinyBroNow(ctx.moodNow);
      constant = applyShinyBroNow(constant, moodNow);
    } else if (id === "talk_mushroom") {
      moodNow = pickTalkMushroomNow(ctx.moodNow);
      constant = applyTalkMushroomNow(constant, moodNow);
    } else if (id === "angry_forest") {
      moodNow = pickAngryForestNow(ctx.moodNow);
      constant = applyAngryForestNow(constant, moodNow);
    } else if (id === "keeper") {
      moodNow = pickKeeperNow(ctx.moodNow);
      constant = applyKeeperNow(constant, moodNow);
    }
    return {
      constant,
      variable: "",
      full: constant,
      meta: {
        characterId: id,
        stateId: state.id,
        stateRange: [state.min, state.max],
        stateLabel: state.label || null,
        coreOnly: true,
        moodNow,
        hasCh6Addition: false,
        memoryCount: 0,
        personalChapter: null,
        readChapter: ctx.readChapter,
        currentChapter: ctx.currentChapter,
        mode: ctx.mode,
        language: ctx.language,
        hasThreadExtra: false,
        constantChars: constant.length,
        variableChars: 0,
        coreChars: constant.length,
        stateChars: 0,
        fullChars: constant.length,
      },
    };
  }

  const modeExtra =
    typeof parts.modeExtra === "function" ? parts.modeExtra(ctx) : "";
  const chapterMap = parts.skipChapterMap
    ? ""
    : typeof parts.chapterMap === "function"
      ? parts.chapterMap(ctx)
      : chapterMapUpTo(ctx.readChapter);
  const readProgress =
    typeof parts.readProgress === "function"
      ? parts.readProgress(ctx)
      : blockReadProgress(ctx);

  // Constant: shared 1–5 + core, or character-only core when skipSharedBlocks.
  const constant = (
    parts.skipSharedBlocks
      ? [parts.core, parts.genderConstant]
      : [
          BLOCK_WORLD,
          BLOCK_VOICE,
          BLOCK_KNOWLEDGE,
          BLOCK_RULES,
          parts.core,
          parts.genderConstant,
        ]
  )
    .filter(Boolean)
    .join("\n\n")
    .trim();

  // Variable: state → chapter map → mode → (character mode extra) → read → language
  const variable = [
    state.text,
    chapterMap,
    blockModeOnly(ctx),
    modeExtra,
    readProgress,
    blockLanguage(ctx),
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return {
    constant,
    variable,
    full: `${constant}\n\n${variable}`,
    meta: {
      characterId: id,
      stateId: state.id,
      stateRange: [state.min, state.max],
      stateLabel: state.label || null,
      hasCh6Addition: Boolean(state.hasCh6Addition),
      memoryCount: Array.isArray(state.memories) ? state.memories.length : null,
      personalChapter: state.personalChapter ?? null,
      readChapter: ctx.readChapter,
      currentChapter: ctx.currentChapter,
      mode: ctx.mode,
      language: ctx.language,
      hasThreadExtra: Boolean(modeExtra),
      constantChars: constant.length,
      variableChars: variable.length,
      coreChars: (parts.core || "").length,
      stateChars: (state.text || "").length,
      fullChars: constant.length + 2 + variable.length,
    },
  };
}

/** Anthropic-style system blocks (cache first part). */
export function toAnthropicSystem(assembled) {
  if (!assembled) return null;
  return [
    {
      type: "text",
      text: assembled.constant,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: assembled.variable,
    },
  ];
}

/** Single system string with stable cacheable prefix (OpenAI / Groq). */
export function toOpenAISystem(assembled) {
  return assembled?.full || "";
}

export function estimateTokens(text) {
  const s = String(text || "");
  // Mixed RU/EN: ~2.2 chars/token for Cyrillic-heavy text is a common heuristic.
  const cyr = (s.match(/[а-яА-ЯёЁ]/g) || []).length;
  const ratio = cyr > s.length * 0.3 ? 2.2 : 4;
  return Math.max(1, Math.ceil(s.length / ratio));
}
