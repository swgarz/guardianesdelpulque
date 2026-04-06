const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const openai = new OpenAI();

const PANEL_STYLE =
  "Pop art al estilo Roy Lichtenstein y Andy Warhol, cuadricula de 6 vinetas rectangulares con bordes negros gruesos, " +
  "cada vineta muestra una escena diferente sobre el tema, puntos Ben-Day gruesos, colores planos vivos, " +
  "alto contraste, serigrafía, estetica de comic vintage. SIN texto, SIN letras, SIN palabras, SIN numeros.";

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
    prompt: "Fresco monumental al estilo del muralismo mexicano, composición continua sin paneles ni divisiones, escena épica de un paisaje agroforestal mexicano: árboles grandes cobijando milpa y ganado, campesinos plantando árboles junto a cercas vivas, raíces profundas visibles bajo la tierra fértil, comunidad cosechando frutos del sistema, paleta de verde profundo, café corteza, musgo, cielo azul y tierra ocre, trazos amplios y volúmenes monumentales, luz cálida de mediodía, sin texto, sin letras, sin palabras.",
  },
  {
    slug: "las-fibras-naturales-en-mexico-henequen-palma-y-mimbre",
    prompt: "Fresco monumental al estilo del muralismo mexicano, composición continua sin paneles ni divisiones, escena épica de artesanos mexicanos trabajando fibras naturales: manos tejiendo henequén en telar tradicional, mujer trenzando palma bajo el sol, cestos de mimbre siendo formados, maguey con pencas fibrosas en el campo, textiles naturales tendidos al aire, paleta de crema natural, dorado henequén, morado añil y rojo grana, trazos amplios y volúmenes monumentales, luz cálida de mediodía, sin texto, sin letras, sin palabras.",
  },
  {
    slug: "composta-y-lombricomposta-transformando-residuos-en-suelo-fertil",
    prompt: "Fresco monumental al estilo del muralismo mexicano, composición continua sin paneles ni divisiones, escena épica de campesinos trabajando la tierra: manos mezclando composta húmeda en capas, lombrices rojas en tierra negra fértil, pila de composta junto a caja de lombricomposta, plantas vigorosas brotando del suelo abonado, ciclo vivo de residuos que se transforman en vida, paleta de negro humus, café tierra oscura, ocre dorado, verde hoja y rojo lombriz, trazos amplios y volúmenes monumentales, luz cálida desde arriba, sin texto, sin letras, sin palabras.",
  },
];

async function generateImage(img) {
  const prompt = img.prompt ||
    (PANEL_STYLE + ` Tema: "${img.title}". Escenas en las 6 vinetas: ${img.subjects}. Paleta de color: ${img.palette}.`);
  console.log("Generando:", img.slug);
  try {
    const res = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });
    const raw = Buffer.from(
      await fetch(res.data[0].url).then((r) => r.arrayBuffer())
    );
    const buf = await sharp(raw).trim({ threshold: 30 }).resize(912).png().toBuffer();
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
