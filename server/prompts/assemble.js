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
import { DREAM_CORE, pickDreamState } from "./dream.js";
import { WEAVER_CORE, pickWeaverState } from "./weaver.js";
import { PAK_CORE, pickPakState } from "./pak.js";
import { LIORA_CORE, pickLioraState } from "./liora.js";
import { CAT_CORE, pickCatState } from "./cat.js";

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

  // Weaver (and any coreOnly): system prompt = character core file only.
  if (parts.coreOnly) {
    const constant = String(parts.core || "").trim();
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
