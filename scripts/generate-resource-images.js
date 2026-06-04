// Genera las imágenes de portada de los RECURSOS (recetarios y documentos).
// Análogo a regen-images.js pero escribe en recursos/{recetarios|documentos}/{slug}/{slug}.png
// Uso:  node scripts/generate-resource-images.js            (todas)
//       node scripts/generate-resource-images.js <slug>     (solo una)
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const openai = new OpenAI();

const IMAGE_WIDTH = 912;

// Mismo estilo pop art que regen-images.js
const PANEL_STYLE =
  "Vintage pop art screen-print illustration in the style of Roy Lichtenstein and Andy Warhol, with the look of a 1960s comic-book splash page. " +
  "DENSE Ben-Day halftone dots must saturate EVERY surface of the image — not only the subjects but also the sky, walls, ground, shadows and objects. Dots vary in size and density to suggest gradients. Halftone is the dominant visual texture. " +
  "Thick solid black outlines on every figure and object, flat saturated comic-book colors with no soft shading, high contrast, vibrant screen-print aesthetic with a slight off-register vintage feel. " +
  "Multi-plane composition with strong depth: a bold close-up element in the foreground, mid-ground figures or action, and a distant background. " +
  "The ENTIRE canvas must be a SINGLE continuous illustrated scene from edge to edge. No portion of the canvas may be blank, empty, or occupied by abstract color fields. " +
  "ABSOLUTELY FORBIDDEN elements (these must NOT appear anywhere in the image): color palette strips, color swatches, color sample bars, vertical color columns, horizontal color bands, reference color charts, side panels showing colors, isolated rectangles of solid color, color chips, Pantone-style blocks. " +
  "Also forbidden: divisions, panels, grids, borders, frames, vignettes, margins, white space, empty bands, comic panel separators, before/after splits, diptychs, triptychs. " +
  "Forbidden content: photography, 3D render, text, letters, words, labels, typography, writing, signatures, watermarks, cityscape skyline.";

// Detecta y recorta franjas planas de color sólido EN LOS BORDES que sharp.trim() no quita.
// (Copiado de scripts/generate-post.js para mantener el mismo recorte.)
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

const resources = [
  {
    dir: "recursos/recetarios/recetario-de-fermentos-vivos",
    slug: "recetario-de-fermentos-vivos",
    title: "Recetario de fermentos vivos",
    palette: "cabbage purple-green, carrot orange, chile red, brine cream, jar glass blue, salt white, garlic ivory",
    subjects: "a rustic wooden kitchen table with three clear glass fermentation jars side by side in one continuous still-life — a jar of shredded green-and-purple chucrut bubbling in cloudy brine, a jar of pickled vegetables in escabeche with bright orange carrot sticks, cauliflower florets and green jalapeños, and a jar of deep-red fermented chile sauce with rising bubbles; a woman's hands in the foreground massaging shredded cabbage with salt in a clay bowl, a halved purple cabbage and whole carrots and chiles around, tiny halftone bubbles of fermentation drifting up, an adobe kitchen with a clay pot and hanging garlic braids behind",
  },
  {
    dir: "recursos/recetarios/recetario-de-la-milpa",
    slug: "recetario-de-la-milpa",
    title: "Recetario de la milpa",
    palette: "corn kernel gold, bean red-brown, squash blossom orange, epazote leaf green, clay terracotta, tortilla cream, sky cyan",
    subjects: "a wooden table laid with a Mexican cornfield harvest in one continuous still-life — a wide clay bowl of steaming corn kernels (esquites) with a sprig of green epazote herb, a clay pot of simmering beans with a wooden spoon, a plate of diced squash with corn topped with an orange squash blossom, a stack of warm corn tortillas in a cloth-lined basket; whole native maize cobs in yellow, red and blue, green bean vines and a broad squash leaf across the table, a friendly woman in a colorful rebozo shawl serving from the bowl, a green cornfield seen through the window behind",
  },
  {
    dir: "recursos/recetarios/recetario-de-salsas-de-molcajete",
    slug: "recetario-de-salsas-de-molcajete",
    title: "Recetario de salsas de molcajete",
    palette: "salsa red, tomatillo green, chile-de-arbol dark red, molcajete volcanic grey, garlic ivory, cilantro green, comal black, masa cream",
    subjects: "a big dark volcanic-stone mortar (molcajete) at the foreground center full of freshly ground red tomato salsa, the round stone pestle resting in it, surrounded on a wooden table by fresh ingredients in one continuous still-life — a pile of green tomatillos, ripe red tomatoes, a few dried red peppers, fresh green serrano peppers, garlic cloves and a bunch of cilantro, a round clay griddle (comal) behind with tomatoes and peppers gently roasting, a hand resting on the mortar, a stack of warm tortillas at the side, an adobe kitchen behind",
  },
  {
    dir: "recursos/recetarios/recetario-de-panes-y-masa-madre",
    slug: "recetario-de-panes-y-masa-madre",
    title: "Recetario de panes y masa madre",
    palette: "wheat gold, golden crust brown, flour white, sourdough starter cream, concha pink-and-yellow, brick-oven amber, anise yellow",
    subjects: "a panadería counter in one continuous scene — at the center a round rustic sourdough boule with a crackled scored crust on a wooden board, beside it a clear glass jar of bubbling masa madre sourdough starter full of halftone bubbles, a tray of Mexican pan dulce conchas with pink-and-yellow sugar shells, hands kneading a ball of dough on a flour-dusted marble surface with a cloud of flour rising, a wood-fired brick oven glowing amber at the back with more loaves inside, a small bowl of wheat grains nearby",
  },
  {
    dir: "recursos/recetarios/recetario-del-maguey-y-el-pulque",
    slug: "recetario-del-maguey-y-el-pulque",
    title: "Recetario del maguey y el pulque",
    palette: "pulque cream white, curado strawberry pink, pasilla chile dark red, maguey blue-green, jícara brown, golden bread, sky cyan, aguamiel gold",
    subjects: "a wooden table in one continuous still-life celebrating the maguey — a tall painted jícara cup of pink strawberry curado de pulque with foam, a clay olla of milky-white pulque, a molcajete of dark-red salsa borracha made with pasilla chiles and crumbled white queso añejo on top, two golden round pan de pulque loaves on a cloth, a fresh strawberry and a pasilla chile beside them; behind the table a large blue-green Agave salmiana maguey pulquero with thick pencas and a tlachiquero holding an acocote gourd, the Hidalgo agave plateau on the horizon",
  },
  {
    dir: "recursos/documentos/modelo-de-acta-de-asamblea-comunitaria",
    slug: "modelo-de-acta-de-asamblea-comunitaria",
    title: "Modelo de acta de asamblea comunitaria",
    palette: "paper cream, ink black, wood brown, assembly indigo, corn yellow, adobe ochre, sky cyan, rebozo red",
    subjects: "a Mexican community assembly gathered in a circle inside an adobe meeting hall in one continuous scene — campesinos and indigenous community members of all ages seated and standing, several raising their hands to vote, at a wooden table in the foreground a secretary writing the minutes by hand in a large open ledger book with a pen, a clay jar of water and a folded cotton cloth on the table, an elder presiding with a wooden staff, warm light through the doorway showing a milpa and mountains outside, no readable text",
  },
  {
    dir: "recursos/documentos/modelo-de-reglamento-interno-para-grupos-y-cooperativas",
    slug: "modelo-de-reglamento-interno-para-grupos-y-cooperativas",
    title: "Modelo de reglamento interno para grupos y cooperativas",
    palette: "paper cream, ink blue, cooperative green, wood brown, basket ochre, corn gold, sky cyan, cloth red",
    subjects: "a rural cooperative of campesinos gathered around a long wooden table in one continuous scene, reading together a written rulebook — a large open document held up by one member while others lean in pointing at it, two members shaking hands in agreement, a ledger and a wooden box of shared savings on the table, baskets of harvested produce (corn, tomatoes, eggs) stacked behind them as the fruit of their common work, an adobe storehouse with neatly organized shelves in the background, no readable text",
  },
  {
    dir: "recursos/documentos/guia-de-derechos-territoriales-y-consulta-indigena",
    slug: "guia-de-derechos-territoriales-y-consulta-indigena",
    title: "Guía de derechos territoriales y consulta indígena",
    palette: "earth red, agave green, banner indigo, mountain ochre, fist gold, river blue, forest green, cotton white",
    subjects: "a Mexican indigenous community gathered together on their communal land in one continuous peaceful daytime scene — community members of all ages standing and sitting in a circle, an elder at the front with a wooden walking staff speaking calmly, a large hand-drawn map of their lands spread on a flat stone showing the boundaries of cornfields, pine forest and a river, people pointing at the map and talking, woven baskets and clay pots beside them, the green communal fields and blue-violet mountains rising behind, warm sunlight, no text",
  },
  {
    dir: "recursos/documentos/modelo-de-convenio-de-colaboracion",
    slug: "modelo-de-convenio-de-colaboracion",
    title: "Modelo de convenio de colaboración",
    palette: "paper cream, handshake gold, indigo blue, milpa green, wood brown, corn yellow, sky cyan, seal red",
    subjects: "two parties sealing a collaboration agreement in one continuous scene — on the left a community representative in straw hat and rebozo, on the right an ally representative, clasping hands in a firm handshake over a wooden table where a signed agreement document with two pens lies, a small round red wax seal beside it, both groups of people standing behind their representatives smiling, a green milpa and an adobe building bridging them in the background, a symbolic halftone sun above, no readable text",
  },
  {
    dir: "recursos/documentos/guia-para-constituir-una-asociacion-civil-o-cooperativa",
    slug: "guia-para-constituir-una-asociacion-civil-o-cooperativa",
    title: "Guía para constituir una asociación civil o cooperativa",
    palette: "document cream, official blue, seal red, cooperative green, coin gold, wood brown, sky cyan, corn yellow",
    subjects: "the founding moment of a cooperative in one continuous scene — a group of campesinos and artisans gathered around a wooden table signing a constitutive act, a notary figure pressing an official round seal onto the document, a shared clay money-jar and a few gold coins as the common treasury on the table, a small hanging wooden shop sign with a painted symbol of corn and a balance scale (no readable text), baskets of products to sell behind them, an adobe storefront, hopeful bright sky, no readable text",
  },
];

async function generateImage(r) {
  const prompt = PANEL_STYLE +
    ` Subject: "${r.title}". Depicted elements: ${r.subjects}. Color palette: ${r.palette}.`;
  console.log("Generando:", r.slug);
  try {
    const res = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1536x1024",
    });
    let buf = Buffer.from(res.data[0].b64_json, "base64");
    buf = await sharp(buf).trim({ threshold: 80 }).toBuffer();
    buf = await cropFlatBorders(buf);
    buf = await sharp(buf).resize(IMAGE_WIDTH).png().toBuffer();
    const dest = path.join(__dirname, "..", r.dir, r.slug + ".png");
    fs.writeFileSync(dest, buf);
    console.log("OK:", r.slug);
  } catch (e) {
    console.error("ERROR", r.slug, e.message);
  }
}

(async () => {
  const slugFilter = process.argv[2];
  const toRun = slugFilter ? resources.filter(r => r.slug === slugFilter) : resources;
  if (slugFilter && !toRun.length) {
    console.error("Slug no encontrado:", slugFilter);
    process.exit(1);
  }
  for (const r of toRun) await generateImage(r);
  console.log("Listo.");
})();
