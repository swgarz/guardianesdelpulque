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

// Detecta y recorta franjas planas de color sólido EN LOS BORDES (paletas, marcos
// monocromáticos, columnas/filas de bloques apilados de color) que DALL-E inserta
// a veces y que sharp.trim() no quita porque no rodean toda la imagen.
//
// Dos heurísticas combinadas — una columna/fila es "borde a recortar" si:
//   (a) su desviación estándar de color es muy baja (< stdThreshold) — banda monocroma, o
//   (b) es "piecewise-constant": al recorrerla, la mayoría de píxeles tienen un
//       vecindario lateral pequeño (5px) muy plano (std local < localStdThreshold).
//       Esto detecta paletas verticales/horizontales de bloques de color apilados.
async function cropFlatBorders(buffer, { stdThreshold = 10, maxFraction = 0.18, localStdThreshold = 6, localFlatFrac = 0.85, localWin = 2 } = {}) {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const colStd = (x) => {
    let sR=0,sG=0,sB=0;
    for (let y=0;y<height;y++){const i=(y*width+x)*channels;sR+=data[i];sG+=data[i+1];sB+=data[i+2];}
    const mR=sR/height,mG=sG/height,mB=sB/height;
    let v=0;
    for (let y=0;y<height;y++){const i=(y*width+x)*channels;const dR=data[i]-mR,dG=data[i+1]-mG,dB=data[i+2]-mB;v+=dR*dR+dG*dG+dB*dB;}
    return Math.sqrt(v/height);
  };
  const rowStd = (y) => {
    let sR=0,sG=0,sB=0;
    for (let x=0;x<width;x++){const i=(y*width+x)*channels;sR+=data[i];sG+=data[i+1];sB+=data[i+2];}
    const mR=sR/width,mG=sG/width,mB=sB/width;
    let v=0;
    for (let x=0;x<width;x++){const i=(y*width+x)*channels;const dR=data[i]-mR,dG=data[i+1]-mG,dB=data[i+2]-mB;v+=dR*dR+dG*dG+dB*dB;}
    return Math.sqrt(v/width);
  };
  // Fracción de píxeles en la columna x cuya ventana horizontal [x-w..x+w] es plana.
  const colLocalFlat = (x) => {
    const lo = Math.max(0, x - localWin), hi = Math.min(width - 1, x + localWin);
    const n = hi - lo + 1;
    let flat = 0;
    for (let y=0; y<height; y++) {
      let sR=0,sG=0,sB=0;
      for (let xi=lo; xi<=hi; xi++) { const i=(y*width+xi)*channels; sR+=data[i]; sG+=data[i+1]; sB+=data[i+2]; }
      const mR=sR/n, mG=sG/n, mB=sB/n;
      let v=0;
      for (let xi=lo; xi<=hi; xi++) { const i=(y*width+xi)*channels; const dR=data[i]-mR,dG=data[i+1]-mG,dB=data[i+2]-mB; v+=dR*dR+dG*dG+dB*dB; }
      if (Math.sqrt(v/n) < localStdThreshold) flat++;
    }
    return flat / height;
  };
  // Fracción de píxeles en la fila y cuya ventana vertical [y-w..y+w] es plana.
  const rowLocalFlat = (y) => {
    const lo = Math.max(0, y - localWin), hi = Math.min(height - 1, y + localWin);
    const n = hi - lo + 1;
    let flat = 0;
    for (let x=0; x<width; x++) {
      let sR=0,sG=0,sB=0;
      for (let yi=lo; yi<=hi; yi++) { const i=(yi*width+x)*channels; sR+=data[i]; sG+=data[i+1]; sB+=data[i+2]; }
      const mR=sR/n, mG=sG/n, mB=sB/n;
      let v=0;
      for (let yi=lo; yi<=hi; yi++) { const i=(yi*width+x)*channels; const dR=data[i]-mR,dG=data[i+1]-mG,dB=data[i+2]-mB; v+=dR*dR+dG*dG+dB*dB; }
      if (Math.sqrt(v/n) < localStdThreshold) flat++;
    }
    return flat / width;
  };
  const isBandCol = (x) => colStd(x) < stdThreshold || colLocalFlat(x) > localFlatFrac;
  const isBandRow = (y) => rowStd(y) < stdThreshold || rowLocalFlat(y) > localFlatFrac;
  const maxXTrim = Math.floor(width * maxFraction);
  const maxYTrim = Math.floor(height * maxFraction);
  let left=0;       while (left < maxXTrim && isBandCol(left)) left++;
  let right=width-1; while (width-1-right < maxXTrim && isBandCol(right)) right--;
  let top=0;        while (top < maxYTrim && isBandRow(top)) top++;
  let bottom=height-1; while (height-1-bottom < maxYTrim && isBandRow(bottom)) bottom--;
  const cropW = right - left + 1;
  const cropH = bottom - top + 1;
  if (cropW === width && cropH === height) return buffer;
  console.log(`  cropFlatBorders: L=${left} R=${width-1-right} T=${top} B=${height-1-bottom} -> ${cropW}x${cropH}`);
  return sharp(buffer).extract({ left, top, width: cropW, height: cropH }).toBuffer();
}

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
  Mamiferos:       "fur brown, savanna ochre, mountain green and stone grey",
  Evolucion:       "deep red, ember orange, charcoal black, ochre and bone white",
  Polinizacion:    "cempasuchil orange, flower yellow, leaf green and sky blue",
  Ciencia:         "indigo blue, lab white, vivid red and gold",
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
  "el-fascinante-origen-de-los-alebrijes-un-viaje-onirico-y-artistico":
    " Depict ALEBRIJES: fantastical hybrid creatures from Mexican folk art, invented by Pedro Linares in 1936 from a fever dream. Each alebrije combines parts of multiple animals (e.g. dragon body with eagle wings, lizard tail, donkey ears, jaguar legs, fish scales, goat horns) painted in extremely vivid contrasting colors with intricate dotted and striped patterns covering their skin. Show 2 or 3 large alebrijes in the foreground with elaborate impossible animal anatomy — NOT buildings, NOT churches, NOT colonial architecture. Setting: a workshop in Mexico City with an artisan painting one of the creatures. Single continuous scene, no panels, no divisions.",
  "xoloitzcuintle-companero-prehispanico-y-guardian-del-mictlan":
    " Depict a Xoloitzcuintle dog (Mexican hairless dog): completely HAIRLESS smooth dark grey-black skin (no fur, no mane, no tufts anywhere), slender athletic body, long thin legs, narrow elongated muzzle, large erect bat-like pointed ears standing straight up, slim whip-like tail, calm noble expression. The xolo stands at the entrance of Mictlán (the Aztec underworld) on rocky volcanic terrain at dusk, with stylized prehispanic motifs and a glowing river behind. Absolutely NO fur, NO feathered headdress, NO collar, NO mane — the dog is bald and sleek.",
  "por-que-los-curanderos-siguen-curando-el-susto-en-pleno-2024":
    " Depict a traditional Mexican curandera healing scene — interior of a humble adobe room lit by candles. In the foreground an elderly curandera in a colorful huipil and rebozo passes a bundle of fresh herbs (ruda, romero, albahaca) and a raw egg over the head and chest of a worried-looking child or adult patient seated on a low wooden chair (this is a 'limpia' for susto/mal de ojo). On a small altar nearby: an earthenware copal incense burner emitting white smoke, candles, dried herbs hanging from beams, a glass of water, religious images, beans and a cross. Soft warm light from candles, blue smoke curling. ABSOLUTELY NO comic-book frame borders, NO red side strips, NO palette blocks at edges, NO checkerboard patterns at the top, NO city skyline, NO cacti — just the intimate ritual scene filling the entire canvas edge to edge.",
  "el-quimico-de-la-unam-que-olia-a-laboratorio-y-salvo-el-cielo":
    " Depict Mario Molina, the Mexican Nobel-winning chemist, in his university chemistry laboratory: a man in his fifties with dark wavy hair, mustache, glasses, wearing a white lab coat over a shirt and tie. He stands at a lab bench holding up a glass Erlenmeyer flask of pale liquid, examining it. Around him: more glassware, beakers, test tubes in racks, a fume hood in the background, periodic table on the wall, a chalkboard covered with chemical formulas including the molecule of CFC chlorofluorocarbon and ozone (O3). Through a window behind him: blue sky with white clouds and a stylized representation of the ozone layer healing over Antarctica. ABSOLUTELY NO color palette grid in the corner, NO color swatch boxes, NO Pantone-style chips at the bottom, NO city downtown — only the laboratory scene with the chemist. Single continuous illustration filling the entire canvas.",
  "ocho-mil-pasos-en-zacatlan-el-experimento-mexicano-que-desafia-tu-reloj-biologico":
    " Depict the highland town of Zacatlán de las Manzanas, Puebla — a long continuous outdoor walking scene. In the foreground a diverse group of Mexican townspeople (an older woman in rebozo, a man in straw hat, a middle-aged jogger, a young couple holding hands, a smiling abuelo with cane) walk along a cobbled mountain street through the town. Behind them: traditional Puebla houses with red-tile roofs and bougainvillea, an apple orchard (Zacatlán is famous for apples and sidra) with red and green apples on branches, a clock tower of the floral clock of Zacatlán visible in the distance, and rolling Sierra Norte de Puebla mountain ranges with pine forest and morning mist. Sunlight, movement and vitality. ABSOLUTELY NO trains, NO locomotives, NO eyes floating in the sky, NO color palette strips on the sides, NO color blocks at the edges, NO city downtown — this is a small mountain town with people walking, not a metropolis. Single continuous illustrated scene from edge to edge.",
  "las-plantas-que-aprendieron-a-mantener-despierto-a-medio-planeta":
    " Depict a lush tropical highland plantation scene — NOT a city, NOT colonial buildings, NOT urban architecture. In the foreground large coffee shrubs (Coffea arabica) heavy with bright red ripe coffee cherries beside cacao trees (Theobroma cacao) with pods of yellow, orange and deep purple growing directly on the trunks. A few fat green caterpillars and beetles try to bite the leaves but recoil — show small wavy lines suggesting bitterness around their mouths. Around the plants, large stylized molecular structures of caffeine and theobromine float as decorative motifs (hexagonal rings with dots representing nitrogen atoms). A campesino in white cotton clothes and straw hat picks coffee cherries into a wicker basket. Background: misty mountain ridges of Veracruz/Chiapas with banana trees and shade canopy. The scene is one continuous tropical landscape from edge to edge. ABSOLUTELY NO buildings, NO cityscape, NO churches, NO cars, NO street.",
  "cuando-la-selva-alimenta-la-cosecha-oculta-de-los-frutos-mayas":
    " Depict the Maya jungle (selva maya) in Calakmul, Campeche: a tall lush tropical canopy of ramón trees (Brosimum alicastrum) with broad oval leaves, chicozapote trees with round brown sapodilla fruits, mamey trees with reddish-brown rough fruits hanging, clusters of small yellow guaya fruits, pitahaya cactus climbing a trunk, and zapote negro fruits on branches. In the foreground a young Tzeltal Maya boy in white cotton clothes carries a hand-woven palm-leaf basket overflowing with ramón seeds, guaya bunches and chicozapotes; he reaches up to pick fruit. Howler monkeys, a keel-billed toucan and a quetzal perch on branches. Limestone karst boulders and ancient Maya stone steps emerge from the green undergrowth. ABSOLUTELY NO magueys, NO agaves, NO cacti other than the climbing pitahaya, NO desert plants — this is dense humid tropical Yucatán/Petén jungle, not arid highlands. The entire canvas is one continuous illustrated jungle scene from edge to edge.",
};

// ── Construir prompt ────────────────────────────────────────────────────────
function buildPrompt(title, tag, slug) {
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;
  const tagNote = SLUG_NOTES[slug] || TAG_NOTES[tag] || "";
  return (
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Subject: "${title}" — Mexican scene related to this topic.${tagNote} ` +
    `Use these color families in the illustration: ${palette}. ` +
    `Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look, vibrant and expressive composition. ` +
    `The ENTIRE 1792x1024 canvas must be a SINGLE continuous illustrated scene from edge to edge. The scene itself fills 100% of the canvas. No portion of the canvas may be blank, empty, or occupied by abstract color fields. ` +
    `ABSOLUTELY FORBIDDEN elements (these must NOT appear anywhere in the image): color palette strips, color swatches, color sample bars, vertical color columns, horizontal color bands, reference color charts, side panels showing colors, isolated rectangles of solid color, color chips, Pantone-style blocks, any design-reference element showing the palette. ` +
    `Also forbidden: divisions, panels, grids, borders, frames, vignettes, margins, white space, empty bands, comic panel separators, before/after splits, diptychs, triptychs. ` +
    `Forbidden content: photography, 3D render, text, letters, words, labels, typography, writing, signatures, watermarks, urban buildings, cityscape skyline.`
  );
}

function buildFallback(tag) {
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;
  return (
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Wide Mexican rural scene filling the entire canvas. ` +
    `Use these color families within the illustration: ${palette}. ` +
    `Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, high contrast, screen-print look. ` +
    `SINGLE continuous illustrated scene from edge to edge filling 100% of the canvas. ` +
    `ABSOLUTELY FORBIDDEN: color palette strips, color swatches, color bars, vertical color columns, side panels with color samples, reference color charts, isolated color blocks, divisions, grids, panels, borders, frames, margins, text, letters, typography.`
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
      let buf = await sharp(imageBuffer).trim({ threshold: 30 }).toBuffer();
      buf = await cropFlatBorders(buf);
      imageBuffer = await sharp(buf).resize(IMAGE_WIDTH).toBuffer();
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
