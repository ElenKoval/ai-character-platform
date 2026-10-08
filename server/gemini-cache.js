/**
 * Explicit Gemini context cache for hybrid constant prompt prefixes.
 * Keyed by characterId + hash of constant text.
 */
import crypto from "crypto";

/** @type {Map<string, { name: string, constant: string, expireAt: number }>} */
const cachesByKey = new Map();

/** Models where free-tier cached-content quota is known to be 0. */
const disabledModels = new Set();

function keyFor(characterId, constant) {
  const h = crypto.createHash("sha256").update(constant).digest("hex").slice(0, 16);
  return `${characterId}:${h}`;
}

/**
 * @param {import("@google/genai").GoogleGenAI} genAI
 * @param {string} model
 * @param {string} characterId
 * @param {string} constant
 * @returns {Promise<string|null>} cache resource name
 */
export async function getOrCreateConstantCache(genAI, model, characterId, constant) {
  if (!genAI || !constant) return null;
  if (disabledModels.has(model)) return null;

  const key = keyFor(characterId, constant);
  const existing = cachesByKey.get(key);
  if (existing && existing.constant === constant && existing.expireAt > Date.now() + 60_000) {
    return existing.name;
  }

  try {
    const cache = await genAI.caches.create({
      model,
      config: {
        displayName: `sunny-${characterId}-${key.split(":")[1]}`,
        // Constant character prompt — immutable prefix
        systemInstruction: constant,
        // API requires contents; tiny seed turn keeps the cache valid
        contents: [
          {
            role: "user",
            parts: [{ text: "Контекст персонажа загружен." }],
          },
          {
            role: "model",
            parts: [{ text: "Готов." }],
          },
        ],
        ttl: "3600s",
      },
    });

    const name = cache?.name;
    if (!name) return null;

    cachesByKey.set(key, {
      name,
      constant,
      expireAt: Date.now() + 55 * 60 * 1000,
    });
    return name;
  } catch (err) {
    const msg = String(err?.message || err);
    if (/limit=0|FreeTier|TotalCachedContentStorageTokensPerModelFreeTier/i.test(msg)) {
      disabledModels.add(model);
      console.warn(
        `[Gemini cache] explicit cache disabled for ${model} (quota limit=0 / free tier). Falling back to full systemInstruction.`
      );
      return null;
    }
    throw err;
  }
}

export function cacheStats() {
  return [...cachesByKey.entries()].map(([k, v]) => ({
    key: k,
    name: v.name,
    expireAt: new Date(v.expireAt).toISOString(),
  }));
}
