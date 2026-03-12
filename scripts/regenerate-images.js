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

// ── Notas visuales por tag ───────────────────────────────────────────────────
const TAG_NOTES = {
  Pulque:    " El pulque es una bebida fermentada mexicana tradicional de color blanco lechoso — represéntalo blanco y opaco. El maguey pulquero es el Agave salmiana: planta enorme con pencas largas, anchas, carnosas y de color verde grisáceo con espinas en los bordes.",
  Naturaleza:" El maguey pulquero (Agave salmiana) tiene pencas largas, anchas, carnosas y verde grisáceas — úsalo si aparece maguey.",
  Territorio:" El maguey pulquero (Agave salmiana) tiene pencas largas, anchas, carnosas y verde grisáceas — úsalo si aparece maguey.",
};

// ── Construir prompt ────────────────────────────────────────────────────────
function buildPrompt(title, tag) {
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;
  const pulqueNote = TAG_NOTES[tag] || "";
  return (
    `Ilustración pop art al estilo de Roy Lichtenstein y Andy Warhol, sobre: "${title}".${pulqueNote} ` +
    `${palette}. Puntos Ben-Day gruesos, contornos negros sólidos, colores planos y vivos, tramas de medios tonos, ` +
    `estética de cómic, alto contraste, aspecto de serigrafía, composición vibrante y expresiva. ` +
    `UNA SOLA ilustración continua que llene completamente todo el encuadre de borde a borde, sin espacios vacíos, sin márgenes blancos, sin divisiones, sin paneles separados, sin cuadrículas, sin secciones, sin recuadros, sin viñetas. SIN fotografía, SIN render 3D, SIN texto, SIN letras, SIN palabras, SIN etiquetas, SIN tipografía, SIN escritura de ningún tipo, SIN edificios, SIN construcciones urbanas, SIN ciudad, SIN muestras de color, SIN paletas de colores, SIN cuadros de colores, SIN bordes decorativos, SIN marcos.`
  );
}

function buildFallback(tag) {
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;
  return (
    `Ilustración pop art al estilo de Roy Lichtenstein y Andy Warhol, paisaje rural mexicano. ` +
    `${palette}. Puntos Ben-Day gruesos, contornos negros sólidos, colores planos y vivos, tramas de medios tonos, alto contraste. ` +
    `UNA SOLA ilustración continua que llene completamente todo el encuadre de borde a borde, sin espacios vacíos, sin márgenes blancos, sin divisiones, sin paneles separados, sin cuadrículas, sin secciones, sin recuadros, sin viñetas. SIN fotografía, SIN render 3D, SIN texto, SIN letras, SIN palabras, SIN etiquetas, SIN tipografía, SIN escritura de ningún tipo, SIN edificios, SIN construcciones urbanas, SIN ciudad, SIN muestras de color, SIN paletas de colores, SIN cuadros de colores, SIN bordes decorativos, SIN marcos.`
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
        size: "1792x1024",
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
