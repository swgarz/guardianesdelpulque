/**
 * regenerate-images.js
 * Regenera las imágenes de todos los artículos en posts.json
 * usando el nuevo prompt de infografía vertical en acuarela.
 *
 * Uso: node scripts/regenerate-images.js
 *      node scripts/regenerate-images.js --slug bambu-estructural   (solo uno)
 */

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI();
const ROOT = path.join(__dirname, "..");

// ── Paletas por tag ─────────────────────────────────────────────────────────
const TAG_PALETTES = {
  Pulque:         "tonos ocre, ámbar, dorado, blanco hueso y verde maguey",
  Bioconstruccion:"tonos rojo arcilla, terracota, adobe, marrón tierra y beige",
  "Bioconstrucción":"tonos rojo arcilla, terracota, adobe, marrón tierra y beige",
  Naturaleza:     "tonos verde bosque, verde musgo, tierra húmeda, azul agua y café corteza",
  Territorio:     "tonos rojo profundo, negro obsidiana, ocre, dorado y verde selva",
};
const DEFAULT_PALETTE = "tonos tierra, ocre, verde y rojo óxido";

// ── Construir prompt ────────────────────────────────────────────────────────
function buildPrompt(title, tag) {
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;
  return (
    `Infografía vertical de dos paneles, ilustración en acuarela cálida hecha a mano, fondo beige/crema, sobre: "${title}". ` +
    `Estética de manual comunitario rural mexicano, ${palette}. ` +
    `Título grande en negritas centrado arriba en verde oscuro o café, con subtítulo corto describiendo el beneficio principal separado por guiones largos. ` +
    `Panel superior con franja diagonal amarilla titulada CÓMO HACERLO: manos trabajando paso a paso en la construcción o preparación del tema, con herramientas tradicionales, materiales naturales y medidas señaladas, fondo con paisaje rural mexicano con milpa, magueyes, nopal o comunidad con casas de adobe. ` +
    `Panel inferior con franja diagonal amarilla titulada CÓMO FUNCIONA: diagrama en corte transversal o vista explicativa del tema ya terminado y en uso, con flechas indicando proceso o beneficio, entorno vivo con raíces, tierra, plantas o personas de la comunidad aprovechando el resultado. ` +
    `En la parte inferior un diagrama de flujo horizontal simple con flechas: insumo, proceso, resultado, beneficio. ` +
    `Estilo ilustración editorial artesanal, líneas limpias con texturas de acuarela, educativo y comunitario, estética de manual campesino ilustrado, todo en español. NO fotografía, NO render 3D.`
  );
}

function buildFallback(tag) {
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;
  return (
    `Infografía vertical de dos paneles sobre técnicas rurales mexicanas, ilustración en acuarela cálida hecha a mano, fondo beige/crema, ${palette}. ` +
    `Panel superior titulado CÓMO HACERLO con manos trabajando, herramientas tradicionales y paisaje con milpa y magueyes. ` +
    `Panel inferior titulado CÓMO FUNCIONA con diagrama en corte transversal, flechas explicativas y personas de la comunidad. ` +
    `Diagrama de flujo horizontal en la parte inferior: insumo, proceso, resultado, beneficio. ` +
    `Estética de manual campesino ilustrado, todo en español. NO fotografía, NO render 3D.`
  );
}

// ── Generar y guardar una imagen ────────────────────────────────────────────
async function regenerateImage(post, index, total) {
  // Derivar slug y ruta del cover
  const coverPath = path.join(ROOT, post.cover);
  const label = `[${index + 1}/${total}] ${post.title}`;

  console.log(`\n${label}`);
  console.log(`  Cover: ${post.cover}`);

  const basePrompt = buildPrompt(post.title, post.tag);
  const fallbackPrompt = buildFallback(post.tag);

  let imageBuffer;
  for (const [i, prompt] of [[0, basePrompt], [1, fallbackPrompt]]) {
    try {
      console.log(`  Generando${i === 1 ? " (fallback)" : ""}...`);
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1792",
      });
      const imageUrl = imageResponse.data[0].url;
      imageBuffer = Buffer.from(
        await fetch(imageUrl).then((r) => r.arrayBuffer())
      );
      break;
    } catch (e) {
      console.log(`  Prompt rechazado: ${e.message?.slice(0, 80)}`);
    }
  }

  if (!imageBuffer) {
    console.log(`  ✗ No se pudo generar imagen — omitiendo`);
    return false;
  }

  fs.writeFileSync(coverPath, imageBuffer);
  console.log(`  ✓ Guardado`);
  return true;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const postsPath = path.join(ROOT, "posts.json");
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));

  // Filtrar por slug si se pasó argumento
  const slugFilter = process.argv.includes("--slug")
    ? process.argv[process.argv.indexOf("--slug") + 1]
    : null;

  const targets = slugFilter
    ? posts.filter((p) => p.cover.includes(slugFilter))
    : posts;

  if (targets.length === 0) {
    console.log("No se encontraron artículos para regenerar.");
    process.exit(0);
  }

  console.log(`Regenerando imágenes de ${targets.length} artículo(s)...\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < targets.length; i++) {
    const success = await regenerateImage(targets[i], i, targets.length);
    if (success) ok++;
    else fail++;

    // Pausa entre llamadas para respetar rate limits de DALL-E
    if (i < targets.length - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`Completado: ${ok} generadas, ${fail} fallidas`);
  console.log(`─────────────────────────────────`);
  console.log(`\nAhora ejecuta:`);
  console.log(`  git add articulos/ && git commit -m "feat: regenerar imágenes con nuevo estilo infografía" && git push`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
