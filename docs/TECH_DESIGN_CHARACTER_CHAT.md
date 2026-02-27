## SunnyChimera Character Chat System – Technical Design

### 1. Scope & Goals

- **Purpose**: Provide in‑world, character‑driven chat across the SunnyChimera site (portal, world history, and character pages), backed by LLMs (Gemini and Groq) with strong identity locking via system prompts.
- **Primary goals**
  - Each character (Dream, Weaver, Keeper, Crystal, Liora, etc.) speaks consistently with its narrative prompt.
  - Support multiple frontends:
    - Generic character chat on individual character pages.
    - Paired Nature/Dryad ↔ Keeper chat on the world history page.
  - Allow switching between providers (Groq/Gemini) per chat, with fallback logic on the server.
  - Enforce language and safety constraints (no “assistant” tone, no technical talk, respect gendered voice).
- **Non‑goals**
  - Persistent user accounts, auth, or long‑term conversation storage.
  - Streaming responses (current design is request/response).
  - Multi‑turn routing between characters in a single request (one character per request).

### 2. High‑Level Architecture

**Frontend**
- Static HTML pages under `pages/` (e.g. `weaver.html`, `dream.html`, `keeper.html`, `world.html`, `nature.html`, `crystal.html`).
- Shared CSS in:
  - `assets/css/base.css` – global layout, portal UI.
  - `assets/css/weaver.css` – world/character topbars and layout for world pages.
  - `assets/css/character.css` – character page layouts and chat styling.
  - `assets/css/world-history.css` – world history layout and chat shells for Dryad/Keeper.
- JS:
  - `assets/js/character-chat.js` – generic single‑chat controller used on character pages.
  - `assets/js/world-root-chat.js` – specialised controller for the world history page with two linked chats (Dryad on the left, Keeper on the right).

**Backend**
- Node/Express server in `server/index.js`.
- System prompts under `server/prompts/*.js` with a registry in `server/prompts/registry.js`.
- External providers:
  - **Gemini** via `@google/genai` (model from `GEMINI_MODEL` env).
  - **Groq** via OpenAI‑compatible HTTP API (model from `GROQ_MODEL` env).

### 3. Data Model & Character Identity

#### 3.1 Character identification

- Each chat instance in HTML declares its character via `data-character` on `.chat`:

```html
<div class="chat" data-character="weaver"> … </div>
<div class="chat" data-character="drpak"> … </div>
<div class="chat world-history__chat-box" data-character="keeper" …> … </div>
<div class="chat" data-character="nature"> … </div>
```

- Frontend JS reads `data-character` and sends it unchanged to the backend as `character`.
- Backend normalises IDs to lowercase and replaces spaces with underscores before looking up the prompt:
  - Example: `"DrPak"` → `"drpak"`, `"Shiny Bro"` → `"shiny_bro"`.

#### 3.2 Prompt registry

File: `server/prompts/registry.js`

- Imports `getSystemPrompt` from each character module:

```js
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
```

- Exposes `getSystemPrompt(characterId)`:
  - Normalises `characterId` with `toLowerCase().trim().replace(/\s+/g, "_")`.
  - Looks up in `prompts` map.
  - Falls back to Weaver’s prompt if no match.

**Design implication**: Adding a new character requires:
- New `server/prompts/<character>.js` exporting `getSystemPrompt()`.
- Import and entry in `prompts` in `registry.js`.
- Setting `data-character="<id>"` on the chat container in HTML.

### 4. Backend: Request Lifecycle

Endpoint in `server/index.js`:

```js
app.post("/api/chat", async (req, res) => {
  const { message, history = [], character = "weaver", provider = "gemini" } = req.body;
  …
});
```

1. **Validation**
   - `message` must be a non‑empty string.
2. **Provider selection**
   - `provider` is normalised to lowercase; default `"gemini"`.
   - If `provider === "auto"`:
     - `isEnglish(message)` → `"groq"`.
     - Else → `"gemini"`.
   - Else:
     - `"groq"` → Groq.
     - Any other value → Gemini.
3. **Language detection**
   - `detectMessageLanguage` counts latin vs cyrillic characters and returns `"en"` or `"ru"`.
4. **Prompt construction**
   - `characterPrompt = getSystemPrompt(character)` from registry.
   - **Identity lock** (in‑world only, no meta/tech talk), language instruction, and character prompt are concatenated:

```js
const identityLock = msgLang === "en"
  ? "You exist as a real character inside the SunnyChimera world. …"
  : "Ты существуешь как реальный персонаж мира SunnyChimera. …";

const languageInstruction = msgLang === "en"
  ? "Reply ONLY in English.\n\n"
  : "Отвечай ТОЛЬКО на русском.\n\n";

const systemPrompt = identityLock + languageInstruction + characterPrompt;
```

5. **Gender instruction**
   - Character ID is normalised again; if it’s in `femaleCharacterIds` (`["weaver", "liora", "shiny", "nature", "talk_mushroom"]`), the system adds a strict feminine or masculine instruction depending on `msgLang`.
   - This ensures consistent “I did / I was” forms (ru/en).
6. **Final system prompt**

```js
const fullPrompt = systemPrompt + genderInstruction;
```

7. **Provider call**
   - **Groq path**:
     - Build `messages` array in OpenAI format: `[ { role: "system", content: fullPrompt }, …history…, { role: "user", content: trimmed } ]`.
     - POST to `${GROQ_BASE}/chat/completions` with `model: GROQ_MODEL`, `temperature`, etc.
     - On non‑OK or network error → log and fall back to Gemini.
   - **Gemini path**:
     - Build `contents` array in Gemini format from history and user message.
     - Call `genAI.models.generateContent({ model: GEMINI_MODEL, contents, config: {...} })`.
8. **Response**
   - Extracts `text` from provider result, trims it, and returns:

```json
{ "text": "<character response>", "provider": "groq" | "gemini" }
```

### 5. Frontend: Generic Character Chat (`character-chat.js`)

Used on: `weaver.html`, `dream.html`, `drpak.html`, `liora.html`, `crystal.html`, `shiny.html`, `keeper.html`, `nature.html`, etc.

#### 5.1 Initialisation

- Selects the first `.chat` on the page and its sub‑elements:
  - `.chat__form`, `.chat__input`, `.chat__send`, `.chat__log`, optional `.chat__hint`.
- Reads `data-character` from `.chat`; default `"weaver"`.
- Sets header text:
  - If character is `"keeper"`:
    - `ASK THE KEEPER ABOUT YOUR ESSENCE`.
  - Else:
    - `ASK ME SOMETHING...`.
- Input placeholder is always `"Seek the truth..."`.
- Configures model source toggles:
  - Roots → Groq, Aether → Gemini.
  - Adds CSS classes `ai-source-roots` / `ai-source-aether` to `.character-chat` roots.

#### 5.2 User interaction

- Form `submit` handler:
  - Prevents default, ignores empty input or if already loading.
  - Sends the user text to `/api/chat` with:
    - `message: text`
    - `history: history.slice(0, -1)` (all prior turns except current user message)
    - `provider: "groq" | "gemini"` based on active source
    - `character`
  - Appends user bubble to log and then appends model reply on success.
  - Expands the chat panel (`.character-chat.is-expanded`), manages scroll, and updates hint text with current provider info.

#### 5.3 Error handling

- If the HTTP response is not OK:
  - Attempts to parse `data.error` or fall back to `res.statusText`.
  - Shows a single generic error bubble (prefixed with `"Ошибка:"` when appropriate).
- On network errors:
  - Shows `"Ошибка сети: …"` bubble and restores previous history state.

### 6. Frontend: World History – Dryad/Keeper Linked Chat

File: `assets/js/world-root-chat.js`

#### 6.1 Layout

On `pages/world.html`:
- Left side: Dryad frame + chat (`.world-history__chat--nature .chat`), with `data-input-only="true"` on the inner chat to denote that replies are displayed on the Keeper side.
- Right side: Keeper frame + chat (`.world-history__chat--keeper .chat`).

#### 6.2 Behaviour

- Shared configuration:
  - Both chats use the same **character ID**: `"keeper"`.
  - Shared `keeperHistory` array holds turns for both sides.
  - Model source toggles (Roots/Aether) are synced across both chat panels.
- Headers and placeholders:
  - Both headers show `"ASK THE KEEPER ABOUT YOUR ESSENCE"`.
  - Both inputs use `"Seek the truth..."`.

#### 6.3 Message flow

- `sendMessage(userText, appendReplyToKeeperLog, askedInChat)`:
  - Pushes `{ role: "user", text: userText }` into `keeperHistory`.
  - Computes provider (Groq/Gemini) based on current AI source.
  - POSTs to `/api/chat` with:
    - `message: userText`
    - `history: keeperHistory.slice(0, -1)`
    - `provider`
    - `character: "keeper"`
    - `askedInChat: "nature" | "keeper"` (for future conditional behaviour).
  - On success:
    - Appends reply bubble only to the **Keeper** log (right side) if `appendReplyToKeeperLog` is `true`.
    - Pushes `{ role: "model", text: reply }` into `keeperHistory`.
- Form handlers:
  - Nature form:
    - Appends the user message to Nature’s log.
    - Sends message with `askedInChat = "nature"`; reply appears in Keeper log.
  - Keeper form:
    - Appends the user message to Keeper’s log.
    - Sends message with `askedInChat = "keeper"`; reply also appears in Keeper log.

### 7. Chat UI & Styling

Key CSS: `assets/css/character.css`, `assets/css/world-history.css`.

- `.character-chat .chat` and `.world-history__chat .chat` share a glassmorphism style with:
  - Dark gradient background.
  - Rounded corners.
  - Header containing source toggles and an “eye” button to expand/collapse.
- Log:
  - `.chat__log` scrolls independently from page layout.
  - Bubbles differentiate NPC vs user via background and border color.
  - **First NPC message** in a log has a pulsing glow (`chatGreetingGlow`) to guide the user’s attention:

```css
.character-chat .chat__log .chat__msg--npc:first-child .chat__bubble {
  animation: chatGreetingGlow 2.5s ease-in-out infinite;
}
```

### 8. Configuration & Environment

- `.env` file in `server/.env` (referenced via `dotenv.config({ path: envPath })`).
- Important variables:
  - `GEMINI_API_KEY` – required for Gemini.
  - `GEMINI_MODEL` – default `"gemini-2.0-flash"`.
  - `GROQ_API_KEY` – optional; if absent, Groq path auto‑falls back to Gemini.
  - `GROQ_MODEL` – default `"llama-3.3-70b-versatile"`.
  - `PORT` – Express server port (defaults to `3000`).

### 9. Extensibility & Future Work

**Adding a new character**
- Create a new prompt file in `server/prompts/<name>.js` with `export function getSystemPrompt() { … }`.
- Register it in `server/prompts/registry.js` and use the normalised ID as the `prompts` map key.
- Add or reuse a character page in `pages/` with:

```html
<aside class="character-chat">
  <div class="chat" data-character="<id>">…</div>
</aside>
```

**Potential improvements**
- Support per‑character provider preferences (e.g. some characters always use a specific model).
- Add streaming support from providers for more responsive UX.
- Introduce rate limiting and basic abuse protection on `/api/chat`.
- Optionally persist conversation history per session (e.g. in memory or a lightweight store) instead of relying solely on the client.

### 10. Risks & Considerations

- **Prompt drift**: Character prompts can become overly long or conflicting over time; periodic review is necessary to keep tone consistent.
- **Provider differences**: Groq vs Gemini may interpret prompts differently; test key characters on both providers.
- **Latency**: World‑history page uses shared history; large histories will increase token count and latency. May require history truncation or summarisation in the future.
- **Language detection edge cases**: `detectMessageLanguage` is heuristic; mixed‑script inputs may produce unexpected language selection (and thus different instructions).

