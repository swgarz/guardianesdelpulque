/**
 * compress-images.js
 * Redimensiona y comprime todas las imágenes de artículos.
 * Uso: node scripts/compress-images.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const MAX_WIDTH = 600;
const MAX_HEIGHT = 1050;
const QUALITY = 72; // reducción ~4x del tamaño original

async function compressImage(imgPath) {
  const before = fs.statSync(imgPath).size;

  // Usar path relativo para evitar límite de 260 chars en Windows
  const relPath = path.relative(process.cwd(), imgPath);
  const buffer = await sharp(relPath)
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: "inside",         // mantiene proporción, no recorta
      withoutEnlargement: true,
    })
    .png({ quality: QUALITY, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(imgPath, buffer);
  const after = fs.statSync(imgPath).size;

  const saved = (((before - after) / before) * 100).toFixed(1);
  const beforeKB = (before / 1024).toFixed(0);
  const afterKB = (after / 1024).toFixed(0);
  return { beforeKB, afterKB, saved };
}

async function main() {
  const postsPath = path.join(ROOT, "posts.json");
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));

  console.log(`Comprimiendo ${posts.length} imágenes (máx ${MAX_WIDTH}x${MAX_HEIGHT}, calidad ${QUALITY})...\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const post of posts) {
    const imgPath = path.join(ROOT, post.cover);
    if (!fs.existsSync(imgPath)) {
      console.log(`  ✗ No encontrada: ${post.cover}`);
      continue;
    }

    const { beforeKB, afterKB, saved } = await compressImage(imgPath);
    totalBefore += parseInt(beforeKB);
    totalAfter += parseInt(afterKB);
    console.log(`  ✓ ${post.title.slice(0, 40).padEnd(40)} ${beforeKB.padStart(5)}KB → ${afterKB.padStart(5)}KB  (-${saved}%)`);
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Total: ${totalBefore}KB → ${totalAfter}KB  (ahorro: ${totalBefore - totalAfter}KB)`);
  console.log(`\nAhora ejecuta:`);
  console.log(`  git add articulos/ && git commit -m "perf: comprimir imágenes" && git push`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
