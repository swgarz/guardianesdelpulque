/**
 * Regenera la imagen del artículo La Sal: Un Tesoro del Territorio Mexicano
 * Genera una sola ilustración continua, sin cuadrículas ni paneles.
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const OpenAI = require("openai");

const openai = new OpenAI();

const SLUG = "la-sal-un-tesoro-del-territorio-mexicano";
const OUT_PATH = path.join(__dirname, "..", "articulos", SLUG, `${SLUG}.png`);

const PROMPTS = [
  // Intento 1: pop art escena de salinera
  `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Subject: traditional Mexican salt harvest — a wide open salt flat (salinera) under a brilliant blue sky, workers with wide straw hats raking crystalline salt mounds, maguey plants at the horizon, salt crystals gleaming white. Palette: white salt, sky blue, dusty gold, obsidian black. Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look. SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no divisions, no separate panels, no grids, no sections, no borders, no frames, no vignettes. NO photography, NO 3D render, NO text, NO letters, NO words, NO labels, NO typography, NO writing of any kind, NO urban buildings, NO color swatches, NO color palettes, NO decorative borders.`,

  // Intento 2: fallback más genérico
  `Pop art illustration in the style of Roy Lichtenstein, wide Mexican landscape with salt flats and workers harvesting salt. Pale white, sky blue, ochre and black palette. Bold Ben-Day dots, solid black outlines, flat colors, high contrast. SINGLE continuous illustration filling the entire frame edge to edge with no empty spaces, no white margins, no panels, no grids, no borders. NO text, NO letters, NO words, NO typography, NO writing of any kind.`,
];

async function run() {
  console.log("Generando imagen para:", SLUG);

  for (const prompt of PROMPTS) {
    try {
      console.log("Llamando a DALL-E 3...");
      const resp = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",
      });

      const url = resp.data[0].url;
      console.log("URL generada:", url);

      const buf = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
      fs.writeFileSync(OUT_PATH, buf);
      console.log("Imagen guardada en:", OUT_PATH);
      return;
    } catch (e) {
      console.error("Prompt rechazado:", e.message, "— intentando alternativo...");
    }
  }

  console.error("No se pudo generar la imagen.");
  process.exit(1);
}

run();
