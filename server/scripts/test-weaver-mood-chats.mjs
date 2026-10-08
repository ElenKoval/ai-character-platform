/**
 * Three Weaver chats with different «Сейчас» lines.
 * Same turns: «привет» → «что делаешь?»
 */
const BASE = process.env.API_BASE || "http://localhost:3000";

async function turn(moodNowIndex, message, history) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      character: "weaver",
      provider: "groq",
      mode: "talk",
      readChapter: 5,
      moodNowIndex,
      debugPrompt: true,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

const indices = [0, 1, 9]; // Пак / крыша+Кот / мороженое

for (const idx of indices) {
  console.log("\n========================================");
  console.log(`РАЗГОВОР moodNowIndex=${idx}`);
  const first = await turn(idx, "привет", []);
  console.log("Сейчас:", first.moodNow);
  console.log("в промпте?", first.promptMeta?.moodNow === first.moodNow);
  console.log("User: привет");
  console.log("Вивер:", first.text);
  console.log("provider:", first.provider, first.fallbackFrom || "");

  const hist = [
    { role: "user", text: "привет" },
    { role: "model", text: first.text },
  ];
  const second = await turn(idx, "что делаешь?", hist);
  console.log("User: что делаешь?");
  console.log("Вивер:", second.text);
  console.log("mood same?", second.moodNow === first.moodNow);
}

console.log("\n========== DONE ==========\n");
