require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI();
const SITE_URL = "https://guardianesdelpulque.org";

const TAG_EMOJI = {
  Pulque: "🍶",
  Bioconstruccion: "🏗️",
  Naturaleza: "🌿",
  Territorio: "✊",
};

// Los 7 posts fantasma que existen en posts.json sin archivos reales
const MISSING_POSTS = [
  {
    tag: "Naturaleza",
    title: "Noticias verdes: restauración y polinizadores",
    excerpt: "Iniciativas locales para humedales y corredores biológicos.",
    topic: "Restauración ecológica, polinizadores nativos, corredores biológicos, humedales, iniciativas comunitarias en México",
  },
  {
    tag: "Naturaleza",
    title: "Humedales urbanos: manual de bolsillo",
    excerpt: "Captación, filtración y biodiversidad en pequeñas escalas.",
    topic: "Humedales artificiales urbanos, captación pluvial, filtración natural, biodiversidad urbana, diseño a pequeña escala",
  },
  {
    tag: "Bioconstruccion",
    title: "Bambú estructural",
    excerpt: "Selección, uniones y tratamientos para larga vida útil.",
    topic: "Bambú como material estructural, selección de cañas, tipos de uniones, tratamientos de preservación, guadua",
  },
  {
    tag: "Pulque",
    title: "Utensilios tradicionales del tinacal",
    excerpt: "Acocote, tinacal y prácticas de higiene para un buen curado.",
    topic: "Utensilios del tinacal, acocote, castañas, tinas de cuero, higiene en la producción de pulque, tradición tlachiquera",
  },
  {
    tag: "Naturaleza",
    title: "Suelos vivos",
    excerpt: "Compost, micorrizas y cobertura para resiliencia hídrica.",
    topic: "Suelos vivos, compostaje, micorrizas, cobertura vegetal, resiliencia hídrica, regeneración de suelos en México",
  },
  {
    tag: "Bioconstruccion",
    title: "Tierra compactada (BTC / Rammed Earth)",
    excerpt: "Densidades, encofrados y acabado fino.",
    topic: "Bloques de tierra comprimida BTC, tapial rammed earth, encofrados, densidades, acabados, bioconstrucción con tierra",
  },
  {
    tag: "Pulque",
    title: "Cadena de valor del maguey",
    excerpt: "Del campo a la pulquería: actores, riesgos y oportunidades.",
    topic: "Cadena de valor del maguey pulquero, tlachiqueros, intermediarios, pulquerías, riesgos y oportunidades económicas",
  },
];

const TONE_PROFILES = [
  {
    name: "practico-calido",
    systemPrompt:
      "Eres un redactor experto en temas rurales, ecológicos y de territorio mexicano. " +
      "Escribes artículos claros, cálidos y prácticos para comunidades. " +
      "Tu tono es directo, comunitario y respetuoso.",
    sectionRange: [5, 8],
    temperatureRange: [0.7, 0.9],
  },
  {
    name: "poetico-con-mesura",
    systemPrompt:
      "Eres un escritor que combina conocimiento rural y ecológico con un lenguaje lírico pero contenido. " +
      "Usas metáforas del territorio mexicano sin caer en excesos. " +
      "Tu prosa respira como la milpa: con ritmo y propósito.",
    sectionRange: [5, 7],
    temperatureRange: [0.85, 1.0],
  },
  {
    name: "narrativo",
    systemPrompt:
      "Eres un narrador que cuenta historias y escenas del campo mexicano para transmitir saberes. " +
      "Empiezas con una escena vívida y de ahí extraes aprendizajes prácticos. " +
      "Equilibras relato y enseñanza.",
    sectionRange: [5, 7],
    temperatureRange: [0.85, 1.0],
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fechaMx(date) {
  const meses = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre",
  ];
  return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildHTML({ title, excerpt, body, tag, emoji, slug, dateStr, isoDate }) {
  const safeExcerpt = excerpt.replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Guardianes del Pulque</title>
  <meta name="description" content="${safeExcerpt}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${safeExcerpt}" />
  <meta property="og:image" content="${SITE_URL}/articulos/${slug}/${slug}.png" />
  <meta property="og:url" content="${SITE_URL}/articulos/${slug}/${slug}.html" />
  <meta property="og:site_name" content="Guardianes del Pulque" />
  <meta property="og:locale" content="es_MX" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${safeExcerpt}" />
  <meta name="twitter:image" content="${SITE_URL}/articulos/${slug}/${slug}.png" />

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${safeExcerpt}",
    "image": "${SITE_URL}/articulos/${slug}/${slug}.png",
    "datePublished": "${isoDate}",
    "author": {
      "@type": "Organization",
      "name": "Guardianes del Pulque",
      "url": "${SITE_URL}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Guardianes del Pulque",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE_URL}/images/logo_transparente.png"
      }
    }
  }
  </script>

  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{
      margin:0;
      font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,'Helvetica Neue',Arial,'Apple Color Emoji','Segoe UI Emoji';
      line-height:1.6;
      color:#0f172a;
      background:#f6f8fb;
    }
    :root{
      --brand:#059669;
      --ink:#0f172a;
      --muted:#6b7280;
      --card:#ffffff;
      --stroke:#e5e7eb;
      --maxw:780px;
    }
    a{color:inherit;text-decoration:none}
    img{max-width:100%;display:block}

    .container{max-width:1180px;margin-inline:auto;padding:0 16px}
    @media (min-width:640px){.container{padding:0 24px}}

    /* NAV */
    .nav{
      position:sticky;top:0;z-index:40;
      background:rgba(255,255,255,.9);
      backdrop-filter:saturate(180%) blur(14px);
      border-bottom:1px solid rgba(15,23,42,.06);
    }
    .nav .row{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:8px 0;
      gap:.75rem;
    }
    .brand{
      display:flex;
      align-items:center;
      gap:.45rem;
      font-weight:700;
    }
    .brand-logo{
      height:34px;
      width:auto;
    }
    .brand-text{
      font-size:.98rem;
      letter-spacing:.01em;
    }
    .links{
      display:flex;
      flex-wrap:wrap;
      gap:.35rem;
      justify-content:flex-end;
      align-items:center;
    }
    .chip{
      display:inline-flex;
      align-items:center;
      gap:.35rem;
      padding:.4rem .8rem;
      border-radius:999px;
      border:1px solid var(--brand);
      font-size:.72rem;
      font-weight:600;
      color:var(--brand);
      background:#ffffff;
      cursor:pointer;
      transition:all .16s ease;
      white-space:nowrap;
    }
    .chip .emoji{font-size:.9rem}
    .chip:hover{
      background:var(--brand);
      color:#020817;
      transform:translateY(-1px);
      box-shadow:0 8px 18px rgba(15,23,42,.16);
    }

    /* HERO */
    .hero-article{
      padding:24px 0 8px;
    }
    .hero-inner{
      max-width:var(--maxw);
      margin:0 auto;
    }
    .eyebrow{
      display:inline-flex;
      align-items:center;
      gap:.4rem;
      padding:.25rem .7rem;
      border-radius:999px;
      background:rgba(5,150,105,.08);
      color:#047857;
      font-size:.7rem;
      font-weight:600;
      margin-bottom:.4rem;
    }
    .title{
      margin:0;
      font-size:clamp(26px,5.4vw,40px);
      line-height:1.1;
      letter-spacing:-.01em;
    }
    .subtitle{
      margin:.4rem 0 0;
      color:var(--muted);
      font-size:.9rem;
      max-width:46rem;
    }
    .meta{
      margin-top:.6rem;
      font-size:.72rem;
      color:#9ca3af;
      display:flex;
      flex-wrap:wrap;
      gap:.75rem;
      align-items:center;
    }

    /* Cover */
    .cover-wrap{
      max-width:var(--maxw);
      margin:16px auto 0;
      border-radius:24px;
      background:radial-gradient(circle at top,rgba(5,150,105,.12),transparent),
                 #020817;
      padding:14px;
      display:flex;
      justify-content:center;
      align-items:center;
    }
    .cover-img{
      width:100%;
      height:auto;
      object-fit:cover;
      border-radius:16px;
    }

    /* CONTENIDO */
    .article{
      max-width:var(--maxw);
      margin:22px auto 40px;
      background:var(--card);
      border-radius:24px;
      padding:18px 16px 20px;
      box-shadow:0 18px 45px rgba(15,23,42,.12);
      border:1px solid rgba(148,163,253,.1);
    }
    @media (min-width:700px){
      .article{padding:26px 26px 24px;}
    }
    .article h2{
      font-size:1.12rem;
      margin:1.4rem 0 .4rem;
    }
    .article p{
      margin:.45rem 0;
      color:#374151;
      font-size:.9rem;
    }
    .article ul,.article ol{
      margin:.35rem 0 .6rem 1.2rem;
      padding:0;
      color:#374151;
      font-size:.88rem;
    }
    .divider{
      margin:1.3rem 0;
      border-top:1px solid rgba(148,163,253,.22);
    }

    /* CTA */
    .cta-section{
      margin:1.5rem 0;
      padding:1.2rem;
      border-radius:16px;
      background:rgba(5,150,105,.04);
      border:1px dashed rgba(5,150,105,.25);
      text-align:center;
    }
    .cta-section h2{
      font-size:1rem;
      margin:0 0 .5rem;
      color:#065f46;
    }
    .cta-section p{
      font-size:.82rem;
      color:#374151;
      margin:0 0 .8rem;
    }
    .cta-form{
      display:flex;
      gap:.5rem;
      justify-content:center;
      flex-wrap:wrap;
      margin-bottom:.8rem;
    }
    .cta-form input[type="email"]{
      padding:.45rem .75rem;
      border:1px solid var(--stroke);
      border-radius:999px;
      font-size:.82rem;
      width:220px;
      max-width:100%;
    }
    .cta-form button{
      padding:.45rem 1rem;
      border:none;
      border-radius:999px;
      background:var(--brand);
      color:#fff;
      font-size:.82rem;
      font-weight:600;
      cursor:pointer;
    }
    .cta-form button:hover{
      background:#047857;
    }

    /* Footer articulo */
    .article-footer{
      display:flex;
      flex-wrap:wrap;
      gap:.5rem;
      justify-content:space-between;
      align-items:center;
      margin-top:1.1rem;
      font-size:.78rem;
      color:#6b7280;
    }
    .article-footer .chips{
      display:flex;
      flex-wrap:wrap;
      gap:.35rem;
    }

    footer{
      border-top:1px solid rgba(15,23,42,.08);
      padding:18px 0 22px;
      color:#9ca3af;
      font-size:.75rem;
    }
    footer .row{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:1rem;
      flex-wrap:wrap;
    }
  </style>
</head>
<body>
  <!-- NAV -->
  <div class="nav">
    <div class="container row">
      <a class="brand" href="../../index.html">
        <img src="../../images/logo_transparente.png" alt="Guardianes del Pulque" class="brand-logo">
        <span class="brand-text">Guardianes del Pulque</span>
      </a>
      <div class="links">
        <a class="chip" href="../../posts.html">Articulos</a>
        <a class="chip" href="../../index.html#donar"><span class="emoji">💚</span> Donar</a>
      </div>
    </div>
  </div>

  <!-- HERO -->
  <header class="hero-article">
    <div class="hero-inner">
      <div class="eyebrow">${emoji} ${tag}</div>
      <h1 class="title">${title}</h1>
      <p class="subtitle">${excerpt}</p>
      <div class="meta">
        <span>Por Guardianes del Pulque</span>
        <span>${dateStr}</span>
      </div>
    </div>
    <div class="cover-wrap">
      <img src="${slug}.png" alt="${title}" class="cover-img">
    </div>
  </header>

  <!-- CONTENIDO -->
  <main class="article">
    ${body}

    <div class="divider"></div>

    <!-- CTA -->
    <section class="cta-section">
      <h2>Suscribete al boletin</h2>
      <p>Recibe articulos sobre pulque, bioconstruccion y defensa del territorio en tu correo.</p>
      <form class="cta-form" action="#suscribirse" method="post">
        <input type="email" placeholder="tu@correo.com" required>
        <button type="submit">Suscribirme</button>
      </form>
      <a class="chip" href="../../index.html#donar"><span class="emoji">💚</span> Donar a Guardianes del Pulque</a>
    </section>

    <div class="divider"></div>

    <!-- PIE DEL ARTICULO -->
    <div class="article-footer">
      <div class="chips">
        <span class="chip">${emoji} ${tag}</span>
      </div>
      <div>
        <a href="../../posts.html" class="chip">← Volver a articulos</a>
      </div>
    </div>
  </main>

  <!-- FOOTER -->
  <footer>
    <div class="container row">
      <div style="display:flex;align-items:center;gap:.4rem">
        <img src="../../images/logo_transparente.png" alt="Guardianes del Pulque" style="height:20px;width:auto">
        <span>Guardianes del Pulque</span>
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <a class="chip" href="../../index.html#donar"><span class="emoji">💚</span> Donar</a>
        <a class="chip" href="../../posts.html">Mas articulos</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

async function generateOne(postInfo, index) {
  const profile = TONE_PROFILES[index % TONE_PROFILES.length];
  const [minSec, maxSec] = profile.sectionRange;
  const sectionCount = randInt(minSec, maxSec);
  const temperature = randFloat(...profile.temperatureRange);

  console.log(`\n[${ index + 1}/7] "${postInfo.title}"`);
  console.log(`  Tono: ${profile.name} | ${sectionCount} secciones | temp ${temperature.toFixed(2)}`);

  // 1. Generar contenido con GPT
  console.log("  Generando texto...");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: profile.systemPrompt },
      {
        role: "user",
        content:
          `Escribe un artículo original con este título exacto: "${postInfo.title}".\n` +
          `Tema: ${postInfo.topic}\n\n` +
          "Responde SOLO con un JSON válido (sin markdown ni backticks) con esta estructura:\n" +
          `{"body": "<h2>...</h2><p>...</p>..."}\n\n` +
          `El body debe ser HTML con h2, p, ul/li y ol/li. Usa exactamente ${sectionCount} secciones con h2. ` +
          "No incluyas el título principal en el body. No uses etiquetas style ni script. " +
          "Sin fuentes ni referencias.\n\n" +
          "Termina el artículo con un párrafo de cierre motivador.",
      },
    ],
    temperature,
  });

  const raw = completion.choices[0].message.content.trim();
  let article;
  try {
    article = JSON.parse(raw);
  } catch (e) {
    // Try to extract JSON from potential markdown wrapper
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      article = JSON.parse(match[0]);
    } else {
      throw new Error(`Failed to parse GPT response for "${postInfo.title}": ${raw.slice(0, 200)}`);
    }
  }

  // 2. Generar imagen con DALL-E (con retry y prompt alternativo)
  console.log("  Generando imagen DALL-E...");
  const prompts = [
    `Mural mexicano inspirado en Diego Rivera sobre: "${postInfo.title}". Colores tierra, ocre, verde y rojo oxido. Sin texto ni letras. Paisaje horizontal.`,
    `Ilustracion artistica de paisaje rural mexicano relacionado con: ${postInfo.topic.split(",")[0]}. Estilo mural con colores tierra y verde. Sin texto.`,
    `Paisaje rural mexicano con plantas, tierra y cielo. Colores calidos tierra, ocre y verde. Estilo artistico muralista. Sin texto ni letras.`,
  ];
  let imageBuffer;
  for (const prompt of prompts) {
    try {
      const imageResponse = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1536x1024",
      });
      imageBuffer = Buffer.from(imageResponse.data[0].b64_json, "base64");
      break;
    } catch (e) {
      console.log(`  Prompt rechazado, intentando alternativo...`);
    }
  }
  if (!imageBuffer) throw new Error(`No se pudo generar imagen para "${postInfo.title}"`);

  // 3. Slug y directorios
  const slug = slugify(postInfo.title);
  const artDir = path.join(__dirname, "..", "articulos", slug);
  fs.mkdirSync(artDir, { recursive: true });

  // 4. Guardar imagen
  fs.writeFileSync(path.join(artDir, `${slug}.png`), imageBuffer);
  console.log(`  Imagen: articulos/${slug}/${slug}.png`);

  // 5. Guardar HTML
  const now = new Date();
  const dateStr = fechaMx(now);
  const tag = postInfo.tag;
  const emoji = TAG_EMOJI[tag] || "📝";

  const html = buildHTML({
    title: postInfo.title,
    excerpt: postInfo.excerpt,
    body: article.body,
    tag,
    emoji,
    slug,
    dateStr,
    isoDate: now.toISOString().split("T")[0],
  });
  fs.writeFileSync(path.join(artDir, `${slug}.html`), html);
  console.log(`  HTML:   articulos/${slug}/${slug}.html`);

  return {
    tag,
    title: postInfo.title,
    excerpt: postInfo.excerpt,
    date: dateStr,
    url: `articulos/${slug}/${slug}.html`,
    cover: `articulos/${slug}/${slug}.png`,
  };
}

async function main() {
  const postsPath = path.join(__dirname, "..", "posts.json");
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));

  // Keep only the first 3 real posts, discard the 7 phantoms
  const realPosts = posts.slice(0, 3);

  // Ejecutar los 7 en paralelo
  const generated = await Promise.all(
    MISSING_POSTS.map((post, i) => generateOne(post, i))
  );

  // Rebuild posts.json: 3 originals + 7 newly generated
  const final = [...realPosts, ...generated];
  fs.writeFileSync(postsPath, JSON.stringify(final, null, 2) + "\n");
  console.log(`\npost.json actualizado con ${final.length} entradas.`);
  console.log("Listo!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
