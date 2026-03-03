/**
 * Вшивает EXIF-ориентацию в пиксели dryad.jpeg, чтобы картинка везде открывалась вертикально.
 * Запуск из корня проекта: node scripts/fix-dryad-orientation.js
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Запуск из корня проекта: node scripts/fix-dryad-orientation.js
const root = join(__dirname, "..");
const inputPath = join(root, "assets", "img", "dryad.jpeg");
const outputPath = inputPath;

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch (e) {
    console.error("Установите sharp: npm install sharp");
    process.exit(1);
  }
  const buf = readFileSync(inputPath);
  await sharp(buf)
    .rotate() // применяет EXIF orientation и сбрасывает тег
    .toFile(outputPath);
  console.log("Готово: assets/img/dryad.jpeg пересохранён с правильной ориентацией.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
