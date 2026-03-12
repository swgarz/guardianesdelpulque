const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI();
const SITE_URL = "https://guardianesdelpulque.org";

// ── Temas ──────────────────────────────────────────────────────────────────
const TOPICS = [
  "Pulque, aguamiel, fermentacion tradicional, maguey pulquero, tlachiquero",
  "Bioconstruccion con tierra, adobe, bahareque, tierra compactada, techos verdes",
  "Naturaleza, restauracion ecologica, polinizadores, humedales, suelos vivos",
  "Maguey, usos del agave, fibras, ixtle, pencas",
  "Milpa, agricultura tradicional, policultivo, maiz, frijol, calabaza",
  "Agua, captacion pluvial, filtracion natural, humedales artificiales",
  "Defensa del territorio, autonomia comunitaria, derechos indigenas, tierra y agua",
];

// ── Tags válidos ───────────────────────────────────────────────────────────
const VALID_TAGS = ["Pulque", "Bioconstruccion", "Naturaleza", "Territorio"];
const TAG_EMOJI = {
  Pulque: "🍶",
  Bioconstruccion: "🏗️",
  Naturaleza: "🌿",
  Territorio: "✊",
};
const DEFAULT_TAG = "Naturaleza";

// ── Estilos de imagen (muralismo mexicano como base) ─────────────────────
const IMAGE_SUBSTYLES = [
  {
    name: "oleo-empaste",
    desc: "óleo pesado con empaste grueso, capas densas de pintura, textura tridimensional de espátula",
  },
  {
    name: "fresco-cal",
    desc: "fresco sobre muro de cal, pigmentos minerales, textura de pared encalada con grietas sutiles",
  },
  {
    name: "tecnica-mixta",
    desc: "técnica mixta con collage, grabado y serigrafía, capas superpuestas de papel y tinta",
  },
  {
    name: "expresionismo-terroso",
    desc: "expresionismo con paleta terrosa, trazos gestuales amplios, pigmentos naturales de tierra",
  },
  {
    name: "claroscuro-social",
    desc: "realismo social con claroscuro dramático, luces fuertes y sombras profundas, volúmenes monumentales",
  },
  {
    name: "temple-antiguo",
    desc: "temple al huevo sobre tabla, acabado mate, colores saturados planos con bordes definidos",
  },
  {
    name: "litografia-color",
    desc: "litografía a color estilo Taller de Gráfica Popular, tintas planas, contrastes fuertes",
  },
  {
    name: "encaustica",
    desc: "encáustica con cera caliente y pigmentos, superficie translúcida con vetas y burbujas",
  },
  {
    name: "pastel-costumbrista",
    desc: "ilustración costumbrista en lápiz de color y pastel seco sobre papel granulado, trazos suaves visibles, textura arenosa cálida, tonos ocre-dorado y tierra, figuras con volumen sutil y expresiones amables, luz difusa dorada de atardecer",
  },
];

const TAG_PALETTES = {
  Pulque: "tonos ocre, ámbar, dorado, blanco hueso y verde maguey",
  Bioconstruccion: "tonos rojo arcilla, terracota, adobe, marrón tierra y beige",
  Naturaleza: "tonos verde bosque, verde musgo, tierra húmeda, azul agua y café corteza",
  Territorio: "tonos rojo profundo, negro obsidiana, ocre, dorado y verde selva",
};
const DEFAULT_PALETTE = "tonos tierra, ocre, verde y rojo óxido";

// ── Perfiles de tono ───────────────────────────────────────────────────────
const TONE_PROFILES = [
  {
    name: "practico-calido",
    systemPrompt:
      "Eres un redactor experto en temas rurales, ecologicos y de territorio mexicano. " +
      "Escribes articulos claros, calidos y practicos para comunidades. " +
      "Tu tono es directo, comunitario y respetuoso. " +
      "Cada seccion debe ser detallada: incluye ejemplos concretos, datos, pasos practicos o cifras cuando aplique. " +
      "Los parrafos deben ser sustanciosos, no de una sola linea.",
    sectionRange: [7, 10],
    temperatureRange: [0.7, 0.9],
  },
  {
    name: "poetico-con-mesura",
    systemPrompt:
      "Eres un escritor que combina conocimiento rural y ecologico con un lenguaje lirico pero contenido. " +
      "Usas metaforas del territorio mexicano sin caer en excesos. " +
      "Tu prosa respira como la milpa: con ritmo y proposito. " +
      "Cada seccion desarrolla ideas con profundidad: no basta nombrar, hay que explicar, describir y contextualizar. " +
      "Minimo 3 parrafos por seccion.",
    sectionRange: [6, 9],
    temperatureRange: [0.85, 1.0],
  },
  {
    name: "cortito-conciso",
    systemPrompt:
      "Eres un redactor que escribe guias completas sobre temas rurales y ecologicos de Mexico. " +
      "Vas directo al grano pero sin omitir informacion importante. " +
      "Usa listas detalladas, pasos numerados y ejemplos especificos. " +
      "Cada punto de una lista debe tener al menos una oracion explicativa.",
    sectionRange: [6, 8],
    temperatureRange: [0.6, 0.8],
  },
  {
    name: "narrativo",
    systemPrompt:
      "Eres un narrador que cuenta historias y escenas del campo mexicano para transmitir saberes. " +
      "Empiezas con una escena vivida (un tlachiquero al amanecer, una cuadrilla mezclando adobe, " +
      "una lluvia cayendo en la milpa) y de ahi extraes aprendizajes practicos. " +
      "Equilibras relato y ensenanza. Cada seccion desarrolla tanto la historia como el conocimiento: " +
      "no dejes ideas a medias, lleva cada tema hasta sus consecuencias practicas.",
    sectionRange: [7, 10],
    temperatureRange: [0.85, 1.0],
  },
];

// ── Utilidades ─────────────────────────────────────────────────────────────
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
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
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

function uniqueSlug(base) {
  const articulosDir = path.join(__dirname, "..", "articulos");
  let slug = base;
  let n = 2;
  while (fs.existsSync(path.join(articulosDir, slug))) {
    slug = `${base}-${n}`;
    n++;
  }
  return slug;
}

function validateTag(tag) {
  if (VALID_TAGS.includes(tag)) return tag;
  // Accept new tags GPT suggests — add emoji fallback
  if (typeof tag === "string" && tag.length > 0 && tag.length < 40) return tag;
  return DEFAULT_TAG;
}

// ── Utilidad: tiempo de lectura ────────────────────────────────────────────
function readingTime(body) {
  const words = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
  const mins = Math.max(3, Math.round(words / 200));
  return `${mins}–${mins + 2} min`;
}

// ── Template HTML ──────────────────────────────────────────────────────────
function buildHTML({ title, excerpt, body, tag, emoji, slug, dateStr, isoDate }) {
  const safeExcerpt = excerpt.replace(/"/g, "&quot;");
  const readTime = readingTime(body);
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
  <\/script>

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
      --muted:#64748b;
      --card:#ffffff;
    }
    a{color:inherit;text-decoration:none}
    img{max-width:100%;display:block}

    .container{max-width:960px;margin-inline:auto;padding:0 16px}
    @media (min-width:640px){.container{padding:0 24px}}

    /* NAV */
    .nav{
      position:sticky;top:0;z-index:40;
      background:transparent;
      border-bottom:1px solid transparent;
      backdrop-filter:saturate(180%) blur(14px);
      transition:background .25s ease,border-color .25s ease,box-shadow .25s ease;
    }
    .nav-row{
      display:flex;align-items:center;
      justify-content:space-between;
      padding:10px 0;gap:1rem;
    }
    .brand{display:flex;align-items:center;gap:.5rem;font-weight:700;}
    .brand-logo{height:40px;width:auto;}
    @media (min-width:768px){.brand-logo{height:52px}}
    .brand-text{font-size:1rem;color:#111827;letter-spacing:.02em;}
    .links{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:flex-end;align-items:center;}
    .chip{
      display:inline-flex;align-items:center;gap:.35rem;
      padding:.4rem .85rem;border-radius:999px;
      border:2px solid var(--brand);color:var(--brand);
      background:rgba(255,255,255,.98);font-weight:700;
      font-size:.75rem;cursor:pointer;
      transition:all .18s ease;white-space:nowrap;
    }
    .chip .emoji{font-size:.95rem}
    .chip:hover{background:var(--brand);color:#020817;transform:translateY(-1px);}
    .nav.scrolled{
      background:#020817;
      border-bottom-color:rgba(148,163,253,.2);
      box-shadow:0 14px 40px rgba(0,0,0,.55);
    }
    .nav.scrolled .brand-text{color:#f9fafb}
    .nav.scrolled .chip{background:transparent;border-color:#22c55e;color:#bbf7d0;}
    .nav.scrolled .chip:hover{background:#22c55e;color:#020817;}

    /* LAYOUT */
    main{padding:32px 0 40px}
    .breadcrumbs{font-size:.78rem;color:#9ca3af;margin-bottom:8px;}
    .breadcrumbs a{color:#6b7280}
    .breadcrumbs a:hover{color:var(--brand)}
    .article-header{margin-bottom:18px;}
    .article-title{
      margin:0 0 6px;
      font-size:clamp(26px,5.5vw,38px);
      line-height:1.15;letter-spacing:-.01em;color:#0f172a;
    }
    .article-meta{display:flex;flex-wrap:wrap;gap:.6rem 1.2rem;font-size:.78rem;color:#6b7280;}
    .meta-pill{display:inline-flex;align-items:center;gap:.3rem;}
    .meta-pill span{font-size:.82rem}
    .article-lead{margin:14px 0 18px;font-size:.98rem;color:#4b5563;}
    .hero-img{margin:14px auto 24px;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(15,23,42,.16);max-width:912px;height:500px;object-fit:cover;display:block;}

    /* CUERPO */
    .article-body{font-size:.97rem;color:#111827;}
    .article-body h2{margin:24px 0 8px;font-size:1.05rem;color:#065f46;}
    .article-body p{margin:0 0 12px}
    .article-body ul,.article-body ol{margin:0 0 14px 1.1rem;padding:0;color:#374151;}
    .highlight{
      padding:10px 12px;border-left:3px solid var(--brand);
      background:rgba(5,150,105,.04);border-radius:10px;
      margin:14px 0;font-size:.86rem;color:#374151;
    }

    /* CTA */
    .cta-section{
      margin:2rem 0 1rem;padding:1.4rem;border-radius:16px;
      background:rgba(5,150,105,.04);border:1px dashed rgba(5,150,105,.3);
      text-align:center;
    }
    .cta-section h3{font-size:1rem;margin:0 0 .5rem;color:#065f46;}
    .cta-section p{font-size:.84rem;color:#4b5563;margin:0 0 .9rem;}
    .cta-form{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-bottom:.9rem;}
    .cta-form input[type="email"]{
      padding:.45rem .8rem;border:1.5px solid #d1d5db;
      border-radius:999px;font-size:.82rem;width:220px;max-width:100%;outline:none;
    }
    .cta-form input[type="email"]:focus{border-color:var(--brand);}
    .cta-form button{
      padding:.45rem 1.1rem;border:none;border-radius:999px;
      background:var(--brand);color:#fff;font-size:.82rem;font-weight:700;cursor:pointer;
    }
    .cta-form button:hover{background:#047857;}

    .back-links{margin-top:26px;display:flex;flex-wrap:wrap;gap:.6rem;font-size:.8rem;}
    footer{border-top:1px solid rgba(15,23,42,.08);padding:18px 0 22px;font-size:.78rem;color:#9ca3af;}
    footer .row{display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap;}
  </style>
</head>
<body>
  <!-- NAV -->
  <header class="nav" id="mainNav">
    <div class="container nav-row">
      <a class="brand" href="../../index.html">
        <img src="../../images/logo_transparente.png" alt="Guardianes del Pulque" class="brand-logo" />
        <span class="brand-text">Guardianes del Pulque</span>
      </a>
      <nav class="links">
        <a class="chip" href="../../posts.html">Artículos</a>
        <a class="chip" href="../../index.html#donar"><span class="emoji">💚</span> Donar</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="breadcrumbs">
      <a href="../../index.html">Inicio</a> ·
      <a href="../../posts.html">Artículos</a> ·
      ${title}
    </div>

    <header class="article-header">
      <h1 class="article-title">${title}</h1>
      <div class="article-meta">
        <div class="meta-pill">${emoji} <span>${tag}</span></div>
        <div class="meta-pill">🕒 <span>Lectura: ${readTime}</span></div>
        <div class="meta-pill">📅 <span>${dateStr}</span></div>
      </div>
      <p class="article-lead">${excerpt}</p>
    </header>

    <figure class="hero-img">
      <img src="${slug}.png" alt="${title}" />
    </figure>

    <article class="article-body">
      ${body}
    </article>

    <!-- CTA SUSCRIPCIÓN -->
    <div class="cta-section">
      <h3>Recibe más artículos como este</h3>
      <p>Suscríbete al boletín de Guardianes del Pulque y recibe contenido sobre pulque, bioconstrucción y defensa del territorio directamente en tu correo.</p>
      <form class="cta-form" action="#suscribirse" method="post">
        <input type="email" placeholder="tu@correo.com" required />
        <button type="submit">Suscribirme</button>
      </form>
      <a class="chip" href="../../index.html#donar"><span class="emoji">💚</span> Donar a Guardianes del Pulque</a>
    </div>

    <div class="back-links">
      <a href="../../posts.html" class="chip">← Todos los artículos</a>
      <span class="chip">${emoji} ${tag}</span>
    </div>
  </main>

  <!-- FOOTER -->
  <footer>
    <div class="container row">
      <div style="display:flex;align-items:center;gap:.5rem">
        <img src="../../images/logo_transparente.png" alt="Guardianes del Pulque" style="height:22px;width:auto">
        <span>Guardianes del Pulque</span>
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <a class="chip" href="../../index.html#donar"><span class="emoji">💚</span> Donar</a>
        <a class="chip" href="../../posts.html">Más artículos</a>
      </div>
    </div>
  </footer>

  <script>
    const nav = document.getElementById("mainNav");
    window.addEventListener("scroll", () => {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    }, { passive: true });
  </script>
</body>
</html>`;
}

// ── Flujo principal ────────────────────────────────────────────────────────
async function generateArticle() {
  const topic = pick(TOPICS);
  const profile = pick(TONE_PROFILES);
  const [minSec, maxSec] = profile.sectionRange;
  const sectionCount = randInt(minSec, maxSec);
  const temperature = randFloat(...profile.temperatureRange);

  console.log(`Tema:  ${topic}`);
  console.log(`Tono:  ${profile.name} (${sectionCount} secciones, temp ${temperature.toFixed(2)})`);

  // 1. Generar articulo con GPT
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: profile.systemPrompt },
      {
        role: "user",
        content:
          `Escribe un articulo original y detallado sobre: ${topic}.\n\n` +
          "Responde SOLO con un JSON valido (sin markdown ni backticks) con esta estructura:\n" +
          `{"title": "Titulo del articulo", "excerpt": "Resumen de 1 linea (max 120 chars)", "tag": "Etiqueta principal", "body": "<h2>...</h2><p>...</p>..."}\n\n` +
          `El body debe ser HTML con h2, p, ul/li y ol/li. Usa exactamente ${sectionCount} secciones con h2. ` +
          "Cada seccion debe tener minimo 3 parrafos o un parrafo mas una lista detallada. " +
          "Los parrafos deben ser sustanciosos (minimo 60 palabras cada uno). " +
          "Incluye datos concretos, ejemplos especificos, cifras o pasos practicos en al menos la mitad de las secciones. " +
          "No incluyas el titulo principal en el body. No uses etiquetas style ni script. " +
          "Sin fuentes ni referencias. El articulo completo debe tener entre 900 y 1400 palabras.\n\n" +
          `Para el tag, elige el mas apropiado entre: ${VALID_TAGS.join(", ")}. ` +
          "Si ninguno encaja, puedes sugerir uno nuevo.\n\n" +
          "Termina el articulo con un parrafo de cierre motivador de al menos 80 palabras.",
      },
    ],
    temperature,
  });

  const raw = completion.choices[0].message.content.trim();
  let article;
  try {
    article = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) article = JSON.parse(match[0]);
    else throw new Error("GPT no devolvió JSON válido: " + raw.slice(0, 200));
  }

  // 2. Validar tag
  const tag = validateTag(article.tag);
  const emoji = TAG_EMOJI[tag] || "📝";

  // 3. Generar slug unico
  const baseSlug = slugify(article.title);
  const slug = uniqueSlug(baseSlug);

  // 4. Generar imagen con DALL-E (muralismo mexicano + sub-estilo único)
  console.log("Generando imagen DALL-E...");

  // Leer estilos ya usados para evitar repetir
  const postsPath = path.join(__dirname, "..", "posts.json");
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));
  const usedStyles = new Set(posts.map((p) => p.imageStyle).filter(Boolean));
  const availableStyles = IMAGE_SUBSTYLES.filter((s) => !usedStyles.has(s.name));
  const chosenStyle = pick(availableStyles.length > 0 ? availableStyles : IMAGE_SUBSTYLES);
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;

  console.log(`Estilo imagen: ${chosenStyle.name}`);

  const basePrompt =
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol, about: "${article.title}". ` +
    `${palette}. Bold Ben-Day dots, thick black outlines, flat vivid colors, halftone patterns, ` +
    `graphic comic-book aesthetic, high contrast, screen-print look, vibrant and punchy composition. ` +
    `NO photography, NO 3D render, NO text.`;

  const fallbackPrompt =
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol, Mexican rural landscape. ` +
    `${palette}. Bold Ben-Day dots, thick black outlines, flat vivid colors, halftone patterns, high contrast. ` +
    `NO photography, NO 3D render, NO text.`;

  let imageBuffer;
  for (const prompt of [basePrompt, fallbackPrompt]) {
    try {
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
      console.log("Prompt rechazado, intentando alternativo...");
    }
  }
  if (!imageBuffer) throw new Error("No se pudo generar imagen");

  // 5. Guardar imagen
  const artDir = path.join(__dirname, "..", "articulos", slug);
  fs.mkdirSync(artDir, { recursive: true });
  fs.writeFileSync(path.join(artDir, `${slug}.png`), imageBuffer);

  // 6. Generar y guardar HTML
  const now = new Date();
  const dateStr = fechaMx(now);
  const html = buildHTML({
    title: article.title,
    excerpt: article.excerpt,
    body: article.body,
    tag,
    emoji,
    slug,
    dateStr,
    isoDate: now.toISOString().split("T")[0],
  });
  fs.writeFileSync(path.join(artDir, `${slug}.html`), html);

  // 7. Actualizar posts.json
  posts.unshift({
    tag,
    title: article.title,
    excerpt: article.excerpt,
    date: dateStr,
    url: `articulos/${slug}/${slug}.html`,
    cover: `articulos/${slug}/${slug}.png`,
    imageStyle: chosenStyle.name,
  });
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2) + "\n");

  console.log(`\nCreado: articulos/${slug}/${slug}.html`);
  console.log(`Cover:  articulos/${slug}/${slug}.png`);
  console.log(`Tag:    ${emoji} ${tag}`);
  console.log(`Titulo: ${article.title}`);
  console.log(`Fecha:  ${dateStr}`);
  console.log(`Tono:   ${profile.name}`);
}

generateArticle().catch((err) => {
  console.error(err);
  process.exit(1);
});
