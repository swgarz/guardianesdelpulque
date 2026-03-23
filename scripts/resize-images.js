/**
 * Redimensiona imágenes existentes a 912px de ancho.
 * Uso: node scripts/resize-images.js [slug1] [slug2] ...
 * Sin argumentos: redimensiona TODAS las imágenes de artículos.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const WIDTH = 912;
const articulosDir = path.join(__dirname, "..", "articulos");

async function resizeImage(imgPath) {
  const buf = fs.readFileSync(imgPath);
  const meta = await sharp(buf).metadata();
  if (meta.width === WIDTH) {
    console.log(`Ya es ${WIDTH}px: ${path.basename(imgPath)}`);
    return;
  }
  const resized = await sharp(buf).resize(WIDTH).toBuffer();
  fs.writeFileSync(imgPath, resized);
  console.log(`${meta.width}px → ${WIDTH}px: ${path.basename(imgPath)}`);
}

async function run() {
  const slugs = process.argv.slice(2);
  let targets = [];

  if (slugs.length > 0) {
    targets = slugs.map((s) => path.join(articulosDir, s, `${s}.png`));
  } else {
    targets = fs.readdirSync(articulosDir)
      .map((dir) => path.join(articulosDir, dir, `${dir}.png`))
      .filter((p) => fs.existsSync(p));
  }

  for (const imgPath of targets) {
    try {
      await resizeImage(imgPath);
    } catch (e) {
      console.error(`Error en ${imgPath}: ${e.message}`);
    }
  }
  console.log("Listo.");
}

run();
