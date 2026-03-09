const fs = require("fs");
const path = require("path");

const SITE_URL = "https://guardianesdelpulque.org";

const TAG_EMOJI = {
  Pulque: "🍶",
  "Bioconstruccion": "🏗️",
  "Bioconstrucción": "🏗️",
  Naturaleza: "🌿",
  Territorio: "✊",
};

const MESES = {
  enero: "01", febrero: "02", marzo: "03", abril: "04",
  mayo: "05", junio: "06", julio: "07", agosto: "08",
  septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12",
};

// ── Utilidades ─────────────────────────────────────────────────────────────

function htmlToText(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function readingTime(body) {
  const words = htmlToText(body).split(" ").filter(Boolean).length;
  const mins = Math.max(3, Math.round(words / 200));
  return `${mins}–${mins + 2} min`;
}

function parseIsoDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  // "5 de marzo de 2026"
  const m = dateStr.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = MESES[m[2].toLowerCase()] || "01";
    return `${m[3]}-${month}-${day}`;
  }
  return new Date().toISOString().split("T")[0];
}

// ── Extraer cuerpo del HTML actual ─────────────────────────────────────────

function extractBody(html) {
  // Formato original: <article class="article-body">
  const articleTag = '<article class="article-body">';
  if (html.includes(articleTag)) {
    const start = html.indexOf(articleTag) + articleTag.length;
    const end = html.indexOf("</article>", start);
    if (end !== -1) return html.slice(start, end).trim();
  }

  // Formato generado: <main class="article">
  const mainTag = '<main class="article">';
  const mainStart = html.indexOf(mainTag);
  if (mainStart === -1) return null;

  const afterMain = html.slice(mainStart + mainTag.length);

  for (const pattern of [
    /\n\s*<div class="divider"><\/div>\s*\n\s*<!-- CTA/,
    /\n\s*<div class="divider"><\/div>\s*\n\s*<!-- PIE/,
  ]) {
    const match = afterMain.search(pattern);
    if (match !== -1) return afterMain.slice(0, match).trim();
  }

  return null;
}

// ── Nuevo template ─────────────────────────────────────────────────────────

function buildHTML({ title, excerpt, body, tag, emoji, slug, htmlFile, dateStr, isoDate, coverFile }) {
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
  <meta property="og:image" content="${SITE_URL}/articulos/${slug}/${coverFile}" />
  <meta property="og:url" content="${SITE_URL}/articulos/${slug}/${htmlFile}" />
  <meta property="og:site_name" content="Guardianes del Pulque" />
  <meta property="og:locale" content="es_MX" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${safeExcerpt}" />
  <meta name="twitter:image" content="${SITE_URL}/articulos/${slug}/${coverFile}" />

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${safeExcerpt}",
    "image": "${SITE_URL}/articulos/${slug}/${coverFile}",
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
    .hero-img{margin:14px 0 24px;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(15,23,42,.16);}

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
        <div class="meta-pill">📅 <span>${dateStr || "2026"}</span></div>
      </div>
      <p class="article-lead">${excerpt}</p>
    </header>

    <figure class="hero-img">
      <img src="${coverFile}" alt="${title}" />
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

function main() {
  const root = path.join(__dirname, "..");
  const postsPath = path.join(root, "posts.json");
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));

  const targetSlug = process.argv[2];

  for (const post of posts) {
    // Derivar slug (carpeta), htmlFile y coverFile desde el registro
    const parts = post.url.split("/"); // ["articulos", slug, filename]
    const slug = parts[1];
    const htmlFile = parts[2];
    const coverFile = post.cover.split("/").pop();

    if (targetSlug && slug !== targetSlug) continue;

    const htmlPath = path.join(root, post.url);
    if (!fs.existsSync(htmlPath)) {
      console.log(`✗ No encontrado: ${post.url}`);
      continue;
    }

    const html = fs.readFileSync(htmlPath, "utf-8");
    const body = extractBody(html);

    if (!body) {
      console.log(`✗ No se extrajo cuerpo: ${htmlFile}`);
      continue;
    }

    const tag = post.tag;
    const emoji = TAG_EMOJI[tag] || "📝";
    const isoDate = parseIsoDate(post.date);

    const newHtml = buildHTML({
      title: post.title,
      excerpt: post.excerpt,
      body,
      tag,
      emoji,
      slug,
      htmlFile,
      dateStr: post.date || "",
      isoDate,
      coverFile,
    });

    fs.writeFileSync(htmlPath, newHtml);
    const words = htmlToText(body).split(" ").filter(Boolean).length;
    console.log(`✓ [${tag}] ${post.title} (~${words} palabras)`);
  }

  console.log("\nMigración completada.");
}

main();
