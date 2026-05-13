const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const openai = new OpenAI();

// ESTILO POP ART (continuo, sin paneles):
const PANEL_STYLE =
  "Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. " +
  "Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look, vibrant and expressive composition. " +
  "The ENTIRE canvas must be a SINGLE continuous illustrated scene from edge to edge. The scene itself fills 100% of the canvas. No portion of the canvas may be blank, empty, or occupied by abstract color fields. " +
  "ABSOLUTELY FORBIDDEN elements (these must NOT appear anywhere in the image): color palette strips, color swatches, color sample bars, vertical color columns, horizontal color bands, reference color charts, side panels showing colors, isolated rectangles of solid color, color chips, Pantone-style blocks, any design-reference element showing the palette. " +
  "Also forbidden: divisions, panels, grids, borders, frames, vignettes, margins, white space, empty bands, comic panel separators, before/after splits, diptychs, triptychs. " +
  "Forbidden content: photography, 3D render, text, letters, words, labels, typography, writing, signatures, watermarks, urban buildings, cityscape skyline.";

const images = [
  {
    slug: "el-fuego-en-la-cocina-tradicional-mexicana",
    title: "El Fuego en la Cocina Tradicional Mexicana",
    palette: "tonos rojo llama, naranja brasa, negro carbon y amarillo chispa",
    subjects: "fogon de lena encendido, comal con tortillas, brasas rojas, manos echando lena, ollas de barro sobre fuego, humo y chispas",
  },
  {
    slug: "el-arte-tradicional-mexicano-un-legado-cultural-vivo",
    title: "El Arte Tradicional Mexicano",
    palette: "tonos multicolor vivo, rojo carmin, azul indigo y amarillo brillante",
    subjects: "telar con textiles coloridos, barro siendo moldeado, papel amate con disenos, pincel sobre mural, manos bordando, ceramica pintada",
  },
  {
    slug: "la-sabiduria-de-los-insectos-comestibles-en-la-cultura-mexicana",
    title: "Insectos Comestibles en la Cultura Mexicana",
    palette: "tonos verde hoja, ocre, rojo carmin y negro",
    subjects: "chapulines saltando, maguey con gusanos, mercado con insectos, manos sosteniendo chapulines, tacos con insectos, hormiga chicatana",
  },
  {
    slug: "revitalizacion-de-las-lenguas-indigenas-en-mexico",
    title: "Revitalizacion de las Lenguas Indigenas en Mexico",
    palette: "tonos ocre pergamino, negro tinta, rojo y dorado",
    subjects: "anciana enseñando a niños, codice con glifos, boca hablando, manos escribiendo, escuela comunitaria, simbolos indigenas",
  },
  {
    slug: "mujeres-en-el-campo-guardianas-de-saberes-y-vida",
    title: "Mujeres en el Campo: Guardianas de Saberes y Vida",
    palette: "tonos rojo flor, morado, verde jade y dorado",
    subjects: "mujer sembrando, partera con bebe, mujer tejiendo, huerto familiar, mujer curandera con plantas, asamblea comunitaria de mujeres",
  },
  {
    slug: "voces-de-la-tierra-la-musica-tradicional-mexicana",
    title: "Voces de la Tierra: La Musica Tradicional Mexicana",
    palette: "tonos azul profundo, rojo vivo, ocre dorado y negro",
    subjects: "jarana siendo tocada, teponaztle percutido, violin en manos campesinas, grupo de sones jarochos, cantos al atardecer, tambor ritual",
  },
  {
    slug: "el-arte-de-fermentar-chucrut-mexicano-y-sus-beneficios",
    title: "Fermento de Chucrut: el poder ancestral para tu salud",
    palette: "tonos verde col, blanco sal, amarillo mostaza y terracota",
    subjects: "col siendo cortada en tiras, manos masajeando col con sal, frasco de vidrio con chucrut fermentando, burbujas de fermentacion, chucrut terminado sobre taco, frasco en refrigerador",
  },
  {
    slug: "diego-rivera-maestro-del-muralismo-mexicano",
    prompt: "Fresco monumental al estilo del muralismo mexicano, composición continua sin paneles ni divisiones, escena épica de un muralista sobre andamio pintando una pared de cal con figuras de obreros y campesinos, pigmentos minerales visibles en la textura del muro, paleta de ocre dorado, rojo óxido, azul índigo, negro carbón y blanco cal, trazos amplios y volúmenes monumentales, luz dramática desde arriba, sin texto, sin letras, sin palabras.",
  },
  {
    slug: "el-abrazo-verde-agroforesteria-y-sus-beneficios-en-el-territorio-mexicano",
    title: "El Abrazo Verde: Agroforestería en el Territorio Mexicano",
    palette: "deep green, bark brown, moss green, sky blue, golden ochre",
    subjects: "large trees sheltering milpa and cattle, campesinos planting trees beside living fences, deep roots visible under fertile soil, community harvesting agroforestry fruits, birds nesting in canopy",
  },
  {
    slug: "raramuri-cultura-y-resistencia-en-la-sierra-tarahumara",
    title: "Rarámuri: Cultura y Resistencia en la Sierra Tarahumara",
    palette: "vivid red, sky blue, canyon ochre, pine green, white cloud",
    subjects: "barefoot runner on canyon trail, women in colorful skirts weaving and carrying pottery, men in community assembly under pine trees, children playing rarajipari with wooden ball, steep hillside milpa with native corn",
  },
  {
    slug: "las-fibras-naturales-en-mexico-henequen-palma-y-mimbre",
    title: "Las Fibras Naturales en México: Henequén, Palma y Mimbre",
    palette: "natural cream, golden henequen, indigo purple, crimson red, warm ochre",
    subjects: "hands weaving henequen on traditional loom, woman braiding palm under the sun, wicker baskets being shaped, maguey with fibrous leaves in the field, natural textiles hanging to dry",
  },
  {
    slug: "composta-y-lombricomposta-transformando-residuos-en-suelo-fertil",
    title: "Composta y Lombricomposta: Transformando Residuos en Suelo Fértil",
    palette: "deep black humus, dark earth brown, golden ochre, leaf green, worm red",
    subjects: "hands mixing moist compost in layers, red worms in dark fertile soil, compost pile beside worm bin, vigorous plants sprouting from fertilized earth, organic scraps transforming into rich humus",
  },
  {
    slug: "banco-de-semillas-de-svalbard-y-su-relevancia-para-mexico",
    title: "Banco de Semillas de Svalbard",
    palette: "arctic white snow, teal blue glowing light, deep navy sky, silver metal, golden corn yellow",
    subjects: "iconic wedge-shaped concrete vault entrance jutting from a snowy arctic mountain with teal glowing facade, northern lights above, long underground corridor lined with aluminum seed packets on shelves, hands placing colorful native Mexican corn and bean seeds into metal containers",
  },
  {
    slug: "el-valor-de-las-semillas-criollas-en-la-conservacion-del-territorio-mexicano",
    title: "El Valor de las Semillas Criollas en la Conservación del Territorio Mexicano",
    palette: "vivid yellow corn, deep red bean, cream white squash, earth brown, leaf green",
    subjects: "hands selecting native corn seeds, colorful criollo seed varieties spread out, woman storing seeds in clay pot, traditional milpa with corn beans and squash, community seed bank gathering",
  },
  {
    slug: "la-polinizacion-del-maguey-por-murcielagos-magueyeros-un-ejemplo-de-coevolucion",
    title: "La Polinización del Maguey por Murciélagos Magueyeros",
    palette: "pollen yellow, flower pink, stem green, bee gold, deep night blue",
    subjects: "long-nosed bat Leptonycteris flying at night toward a flowering maguey salmiana, tall quiote stalk with open white-yellow blossoms, blue-grey-green fleshy spiky leaves of the agave, pollen dust on bat's fur, full moon and stars, desert landscape with other magueyes, nocturnal Mexican highland scene",
  },
  {
    slug: "migracion-rural-retornos-y-renovaciones-en-comunidades-en-diaspora",
    title: "Migración Rural: Retornos y Renovaciones en Comunidades en Diáspora",
    palette: "road ochre, brick red, indigo blue, hope green, warm cream",
    subjects: "campesino family walking with bundled belongings along a dirt road, rural Mexican village with adobe houses in the distance, milpa with corn in the foreground, elderly grandparents waving welcome at a doorway, hands exchanging a photograph, suitcase beside a bus stop, cross-generational embrace",
  },
  {
    slug: "psicodelicos-sagrados-conexiones-ancestrales-y-espirituales",
    title: "Psicodélicos Sagrados: Conexiones Ancestrales y Espirituales",
    palette: "visionary purple, deep cobalt blue, sacred green, ritual gold, night black",
    subjects: "indigenous wixárika shaman sitting in ceremony beside peyote cacti, hongos sagrados growing from forest floor, temazcal steaming under a starry sky, circle of candles and copal smoke, visionary geometric patterns emerging from the background, sacred plants of power, eyes closed in meditation, Mexican night landscape",
  },
  {
    slug: "patrones-de-turing-en-pieles-la-magia-de-las-manchas-del-jaguar-y-rayas-de-cebra",
    title: "Patrones de Turing en Pieles: La Magia de las Manchas del Jaguar y Rayas de Cebra",
    palette: "cellular green, water blue, pollen yellow, nucleus violet, jaguar gold and deep black",
    subjects: "majestic Mexican jaguar with rosette spot patterns stepping through jungle, zebra beside with bold black-and-white stripes, overlapping waves of reaction-diffusion patterns emerging across both animal skins, spiral and dotted halftone patterns rippling in the background, Turing morphogenesis patterns forming organically on the fur, tropical Mexican foliage, harmony between pure mathematics and living biology",
  },
  {
    slug: "la-endosimbiosis-puerta-a-la-complejidad-de-la-vida-eucariota",
    title: "La Endosimbiosis: Puerta a la Complejidad de la Vida Eucariota",
    palette: "cellular green, water blue, pollen yellow, nucleus violet, bacterial red, bone white",
    subjects: "giant cross-section of a eukaryotic cell filling the entire scene with a huge purple nucleus in the center, elongated magenta mitochondria shaped like ancient bacteria pulsing inside the cytoplasm, emerald-green chloroplasts floating nearby with visible thylakoid stacks, tiny bacterial ancestors merging into larger primitive cells in the background, curved membrane outlines everywhere, depictions of Lynn Margulis's endosymbiosis theory happening across one unified illustration, organic flowing composition edge to edge, absolutely no color swatches or side palette bars",
  },
  {
    slug: "la-danza-de-la-vida-coevolucion-entre-la-yuca-y-la-polilla-yucca",
    title: "La Danza de la Vida: Coevolución entre la Yuca y la Polilla Yucca",
    palette: "pollen yellow, flower pink, stem green, bee gold, deep night blue, desert cream",
    subjects: "giant blooming yucca plant with tall stalk of cream-white bell-shaped flowers at the center of the composition, a small Tegeticula moth hovering inside one open flower collecting pollen on her proboscis, another moth laying eggs inside a developing seed pod, sharp spiky leaves radiating outward, moonlit Mexican desert landscape with saguaros and organ pipe cacti, night sky with stars above, the entire scene is one continuous painting with no empty areas",
  },
  {
    slug: "el-ajolote-de-xochimilco-un-tesoro-biologico-y-medicina-regenerativa",
    title: "El Ajolote de Xochimilco: Un Tesoro Biológico y Medicina Regenerativa",
    palette: "water turquoise, salamander pink, chinampa green, axolotl cream, deep lake blue, pollen yellow",
    subjects: "majestic pink axolotl (Ambystoma mexicanum) smiling in the foreground with external feathery pink gills spread wide, swimming underwater through the canals of Xochimilco, one of its legs actively regenerating with tiny new cells emerging visibly, water lilies and lirios floating above, chinampa agricultural islands with corn and vegetables at the top edge, a trajinera boat silhouetted above the water line, small fish and dragonflies, continuous flowing scene from dark lake depths to bright surface",
  },
  {
    slug: "el-intrincado-mundo-de-la-wood-wide-web-comunicaciones-subterraneas-de-los-bosques",
    title: "El Intrincado mundo de la Wood Wide Web: Comunicaciones Subterráneas de los Bosques",
    palette: "moss green, mushroom cream, deep purple, earth brown, amber glow, root white",
    subjects: "giant vertical cross-section of a Mexican forest showing tall oyamel and oak trees reaching the sky above and their enormous interconnected root systems below ground, a vast network of bright white mycelium threads glowing and weaving between all the root tips like a living web, tiny pulses of amber light flowing along the fungal filaments representing nutrients and alarm signals being shared between trees, cluster of mushrooms fruiting at the forest floor, dark soil layers revealing worms and fungi, the entire composition is one continuous cross-section filling the canvas edge to edge",
  },
  {
    slug: "por-que-tu-hemisferio-derecho-no-es-el-artista-que-te-contaron-y-otras-mentiras-sobre-el-cerebro-bicameral",
    title: "Por qué tu hemisferio derecho no es el artista que te contaron",
    palette: "brain pink, neuron electric yellow, synapse cobalt blue, deep purple, blood red, cream white",
    subjects: "giant anatomical cross-section of a human brain at the center filling the canvas, both hemispheres rendered symmetrically with the thick corpus callosum bridge of nerve fibers crossing the midline, vivid neurons firing in yellow lightning bolts that travel freely between both sides simultaneously, dense network of dendrites and axons weaving across the entire cortex from edge to edge, halftone Ben-Day dot patterns rippling over the brain surface, a pair of hands at the bottom each holding both a paintbrush and a geometric ruler together symbolizing that both hemispheres do both creative and logical tasks, no labels, no diagrams, no anatomical text, no Mexican cultural elements",
  },
];

async function generateImage(img) {
  const prompt = img.prompt ||
    (PANEL_STYLE + ` Subject: "${img.title}" — Mexican rural scene related to this topic. Depicted elements: ${img.subjects}. Color palette: ${img.palette}.`);
  console.log("Generando:", img.slug);
  try {
    const res = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
    });
    const raw = Buffer.from(res.data[0].b64_json, "base64");
    const buf = await sharp(raw).trim({ threshold: 80 }).resize(912).png().toBuffer();
    const dest = path.join(__dirname, "..", "articulos", img.slug, img.slug + ".png");
    fs.writeFileSync(dest, buf);
    console.log("OK:", img.slug);
  } catch (e) {
    console.error("ERROR", img.slug, e.message);
  }
}

(async () => {
  const slugFilter = process.argv[2];
  const toRun = slugFilter ? images.filter(i => i.slug === slugFilter) : images;
  if (slugFilter && !toRun.length) {
    console.error("Slug no encontrado:", slugFilter);
    process.exit(1);
  }
  for (const img of toRun) await generateImage(img);
  console.log("Listo.");
})();
