/**
 * Regenera las imágenes de 3 artículos con el estilo pop art validado (inglés).
 * Artículos:
 *   - El Arte del Pan: De la Masa Madre al Pan de Muerto
 *   - El Maguey: Tesoro de Usos y Saberes del Agave
 *   - El Arte del Barro: Tradición y Futuro de la Alfarería Mexicana
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const OpenAI = require("openai");
const sharp = require("sharp");

const IMAGE_WIDTH = 912;

const openai = new OpenAI();
const ROOT = path.join(__dirname, "..");

const ARTICLES = [
  {
    slug: "el-arte-del-pan-de-la-masa-madre-al-pan-de-muerto",
    title: "El Arte del Pan: De la Masa Madre al Pan de Muerto",
    palette: "golden bread, wheat ochre, burnt crust brown and red ember",
    prompts: [
      `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Subject: "El Arte del Pan: De la Masa Madre al Pan de Muerto" — a Mexican baker pulling golden pan de muerto from a wood-fired clay oven, marigold flowers and round loaves decorated with bone shapes, wheat stalks in the foreground, warm glowing hearth. Color palette: golden bread, wheat ochre, burnt crust brown and red ember. Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look, vibrant and expressive composition. SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no divisions, no separate panels, no grids, no sections, no borders, no frames, no vignettes. NO photography, NO 3D render, NO text, NO letters, NO words, NO labels, NO typography, NO writing of any kind, NO urban buildings, NO city, NO color swatches, NO color palettes, NO decorative borders.`,
      `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Wide Mexican scene of traditional bread baking, pan de muerto loaves on wooden table, wood-fired oven glowing, wheat and marigolds. Golden bread, ochre and ember palette. Bold Ben-Day dots, solid black outlines, flat vivid colors, high contrast. SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no panels, no grids, no borders. NO text, NO letters, NO words, NO typography, NO writing of any kind.`,
    ],
  },
  {
    slug: "el-maguey-tesoro-de-usos-y-saberes-del-agave",
    title: "El Maguey: Tesoro de Usos y Saberes del Agave",
    palette: "natural cream, golden henequen, indigo purple and red grana",
    prompts: [
      `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Subject: "El Maguey: Tesoro de Usos y Saberes del Agave" — Mexican rural scene with large Agave salmiana maguey plants (the pulque maguey — huge plants with long, wide, fleshy grey-green leaves with spine-edged margins, NOT the thin-leaved mezcal agave), workers harvesting ixtle fibers, weaving on a traditional loom, fiber bundles in the foreground, wide open highland landscape. Color palette: natural cream, golden henequen, indigo purple and red grana. Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look, vibrant and expressive composition. SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no divisions, no separate panels, no grids, no sections, no borders, no frames, no vignettes. NO photography, NO 3D render, NO text, NO letters, NO words, NO labels, NO typography, NO writing of any kind, NO urban buildings, NO city, NO color swatches, NO color palettes, NO decorative borders.`,
      `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Wide Mexican highland landscape with large Agave salmiana maguey plants, fiber workers, traditional loom weaving. Natural cream, golden henequen, indigo and red grana palette. Bold Ben-Day dots, solid black outlines, flat vivid colors, high contrast. SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no panels, no grids, no borders. NO text, NO letters, NO words, NO typography, NO writing of any kind.`,
    ],
  },
  {
    slug: "el-arte-del-barro-tradicion-y-futuro-de-la-alfareria-mexicana",
    title: "El Arte del Barro: Tradición y Futuro de la Alfarería Mexicana",
    palette: "red clay, terracotta, ochre and ash grey",
    prompts: [
      `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Subject: "El Arte del Barro: Tradición y Futuro de la Alfarería Mexicana" — a Mexican potter shaping clay on a traditional wheel, shelves of painted ceramic vessels and pots, clay coils and tools in the foreground, a wood-fired kiln glowing in the background, rural workshop setting. Color palette: red clay, terracotta, ochre and ash grey. Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look, vibrant and expressive composition. SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no divisions, no separate panels, no grids, no sections, no borders, no frames, no vignettes. NO photography, NO 3D render, NO text, NO letters, NO words, NO labels, NO typography, NO writing of any kind, NO urban buildings, NO city, NO color swatches, NO color palettes, NO decorative borders.`,
      `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Wide Mexican pottery workshop scene, potter at clay wheel, ceramic vessels, barro rojo pots, wood-fired kiln. Red clay, terracotta and ochre palette. Bold Ben-Day dots, solid black outlines, flat vivid colors, high contrast. SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no panels, no grids, no borders. NO text, NO letters, NO words, NO typography, NO writing of any kind.`,
    ],
  },
];

async function regenerateImage(article, index, total) {
  const outPath = path.join(
    ROOT,
    "articulos",
    article.slug,
    `${article.slug}.png`
  );
  console.log(`\n[${index + 1}/${total}] ${article.title}`);
  console.log(`  Salida: ${outPath}`);

  for (const [i, prompt] of article.prompts.entries()) {
    try {
      console.log(`  Generando${i === 1 ? " (fallback)" : ""}...`);
      const resp = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",
      });
      const url = resp.data[0].url;
      let buf = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
      buf = await sharp(buf).resize(IMAGE_WIDTH).toBuffer();
      fs.writeFileSync(outPath, buf);
      console.log(`  ✓ Guardado`);
      return true;
    } catch (e) {
      console.log(`  Prompt rechazado: ${e.message?.slice(0, 80)}`);
    }
  }

  console.log(`  ✗ No se pudo generar imagen`);
  return false;
}

async function main() {
  console.log("Regenerando imágenes de 3 artículos con estilo pop art...\n");
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < ARTICLES.length; i++) {
    const success = await regenerateImage(ARTICLES[i], i, ARTICLES.length);
    if (success) ok++;
    else fail++;
    if (i < ARTICLES.length - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`Completado: ${ok} generadas, ${fail} fallidas`);
  console.log(`─────────────────────────────────`);
  if (ok > 0) {
    console.log(`\nAhora ejecuta:`);
    console.log(
      `  git add articulos/ && git commit -m "feat: regenerar imágenes pan, maguey-fibras y barro con estilo pop art" && git push`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
