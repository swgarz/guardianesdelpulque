/**
 * regenerate-images.js
 * Regenera las imágenes de todos los artículos en posts.json
 * con el estilo pop art validado (prompts en inglés).
 *
 * Uso: node scripts/regenerate-images.js
 *      node scripts/regenerate-images.js --slug bambu-estructural   (solo uno)
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const OpenAI = require("openai");
const sharp = require("sharp");

const IMAGE_WIDTH = 912;

const openai = new OpenAI();
const ROOT = path.join(__dirname, "..");

// ── Paletas por tag ─────────────────────────────────────────────────────────
const TAG_PALETTES = {
  Pulque:          "ochre, amber, gold, bone white and maguey green",
  Bioconstruccion: "red clay, terracotta, adobe, earth brown and beige",
  "Bioconstrucción":"red clay, terracotta, adobe, earth brown and beige",
  Naturaleza:      "forest green, moss green, damp earth, water blue and bark brown",
  Territorio:      "deep red, obsidian black, ochre, gold and jungle green",
  Semillas:        "light green, golden yellow, earth brown and milk white",
  Agroforesteria:  "deep green, bark brown, moss, sky blue and earth",
  Medicina:        "medicinal green, flower purple, white and golden ochre",
  Agua:            "turquoise blue, water green, stone grey and foam white",
  Fuego:           "flame red, ember orange, charcoal black and spark yellow",
  Comunidad:       "ochre, brick red, olive green and sky blue",
  Arte:            "vivid multicolor, crimson red, indigo blue and bright yellow",
  Economia:        "jade green, gold, coffee brown and ochre",
  Ganaderia:       "meadow green, leather brown, cream and sky blue",
  Cosmologia:      "night black, indigo blue, star gold and cosmic purple",
  Permacultura:    "leaf green, damp earth, sky blue and sun yellow",
  Hongos:          "ivory, mushroom brown, moss green and dark purple",
  Aves:            "sky blue, forest green, feather brown and ochre",
  Pesca:           "lake blue, water green, stone grey and sand ochre",
  Barro:           "red clay, terracotta, ochre and ash grey",
  Madera:          "mahogany brown, ochre, pine yellow and forest green",
  Fibras:          "natural cream, golden henequen, indigo purple and red grana",
  Colorantes:      "indigo blue, red grana, cempasuchil yellow and leaf green",
  Sal:             "white salt, stone grey, sky blue and desert ochre",
  Cacao:           "dark chocolate brown, cacao brown, gold and jungle green",
  Pan:             "golden bread, wheat ochre, burnt crust brown and red ember",
  Insectos:        "leaf green, ochre, crimson red and black",
  Suelo:           "humus black, earth brown, ochre and vibrant green",
  Energia:         "solar yellow, sky blue, green and orange",
  Migracion:       "path ochre, brick red, indigo blue and hope green",
  Lenguas:         "parchment ochre, ink black, red and gold",
  Infancia:        "sunflower yellow, tender green, sky blue and ochre",
  Mujeres:         "flower red, purple, jade green and gold",
  Musica:          "deep blue, vivid red, golden ochre and black",
  Psicodelicos:    "visionary purple, deep blue, sacred green, gold and black",
  Fermentos:       "purple cabbage, magenta, lime green and salt white",
};
const DEFAULT_PALETTE = "earth tones, ochre, green and oxide red";

// ── Notas visuales por tag ───────────────────────────────────────────────────
const TAG_NOTES = {
  Pulque:    " Pulque is a traditional Mexican fermented drink, milky white and opaque — depict it white and cloudy. The maguey pulquero is Agave salmiana: a massive plant with long, wide, fleshy, blue-grey-green leaves with spines along the edges.",
  Naturaleza:" The maguey pulquero (Agave salmiana) has long, wide, fleshy, blue-grey-green leaves — use it if maguey appears.",
  Territorio:" The maguey pulquero (Agave salmiana) has long, wide, fleshy, blue-grey-green leaves — use it if maguey appears.",
};

// ── Notas visuales específicas por slug ────────────────────────────────────
const SLUG_NOTES = {
  "diego-rivera-maestro-del-muralismo-mexicano":
    " Mexican fresco mural style illustration: a dense crowd scene on a rough lime-plaster wall texture — a tall elegant female skeleton (La Catrina) wearing a wide feathered hat and dress stands at the center, surrounded by indigenous Mexicans in huipiles, mestizo workers in overalls, children, and a mustachioed painter in overalls holding brushes. Earthy fresco palette: ochre, raw sienna, burnt umber, cobalt blue, deep red oxide, olive green. Flat simplified monumental figures with bold black outlines, no shading gradients, rough plaster surface texture visible throughout. Dense packed composition filling the entire frame edge to edge, panoramic format.",
  "raramuri-cultura-y-resistencia-en-la-sierra-tarahumara":
    " Depict a traditional Rarámuri rarajípari ball race: several Rarámuri men running barefoot or in huarache sandals through the dramatic canyon landscape of the Barrancas del Cobre (Copper Canyon), Chihuahua, Mexico, kicking a small wooden ball (bola) along a mountain trail. Men wear white loincloths (tagora) and colorful headbands. The background shows towering canyon walls, pine trees and a vast deep ravine under a vivid sky. Foreground details include the wooden ball mid-kick and the runners' powerful stride. Energy, movement and endurance are the mood.",
};

// ── Construir prompt ────────────────────────────────────────────────────────
function buildPrompt(title, tag, slug) {
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;
  const tagNote = SLUG_NOTES[slug] || TAG_NOTES[tag] || "";
  return (
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Subject: "${title}" — Mexican rural landscape scene related to this topic.${tagNote} ` +
    `Color palette: ${palette}. ` +
    `Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look, vibrant and expressive composition. ` +
    `SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no divisions, no separate panels, no grids, no sections, no borders, no frames, no vignettes. ` +
    `NO photography, NO 3D render, NO text, NO letters, NO words, NO labels, NO typography, NO writing of any kind, NO urban buildings, NO city, NO color swatches, NO color palettes, NO decorative borders.`
  );
}

function buildFallback(tag) {
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;
  return (
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Wide Mexican rural landscape. ` +
    `Color palette: ${palette}. ` +
    `Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, high contrast, screen-print look. ` +
    `SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no divisions, no separate panels, no grids, no sections, no borders, no frames. ` +
    `NO text, NO letters, NO words, NO typography, NO writing of any kind, NO urban buildings, NO color swatches.`
  );
}

// ── Generar y guardar una imagen ────────────────────────────────────────────
async function regenerateImage(post, index, total) {
  // Derivar slug y ruta del cover
  const coverPath = path.join(ROOT, post.cover);
  const label = `[${index + 1}/${total}] ${post.title}`;

  console.log(`\n${label}`);
  console.log(`  Cover: ${post.cover}`);

  const slug = post.cover.split("/")[1];
  const basePrompt = buildPrompt(post.title, post.tag, slug);
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
      imageBuffer = await sharp(imageBuffer).resize(IMAGE_WIDTH).toBuffer();
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
  console.log(`  git add articulos/ && git commit -m "feat: regenerar imágenes con estilo pop art" && git push`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
