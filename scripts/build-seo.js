/**
 * build-seo.js
 * Aplica el SEO de todos los artículos a partir de posts.json. Es idempotente:
 * generate-post.js lo corre al final de cada publicación y se puede correr a mano.
 *
 *  - <title> corto: seoTitle (o title) + " — Guardianes del Pulque" solo si cabe
 *  - JSON-LD: Article completo + BreadcrumbList en un solo @graph
 *  - Bloque "Sigue leyendo" con artículos relacionados (enlaces estáticos)
 *  - Archivo estático de todos los artículos en posts.html (para rastreadores)
 *
 * Uso: node scripts/build-seo.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = "https://guardianesdelpulque.org";
const BRAND = " — Guardianes del Pulque";
const MAX_TITLE = 65; // Google corta el título alrededor de 60-65 caracteres
const RELATED_COUNT = 4;

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

// Palabras demasiado comunes en los títulos para indicar que dos artículos se parecen
const STOPWORDS = new Set((
  "para como cuando donde porque sobre entre desde hasta este esta estos estas " +
  "cada todo toda todos todas nuestro nuestra mexico mexicano mexicana mexicanos " +
  "mexicanas secreto secretos invisible invisibles bajo tras ante contra pero tambien " +
  "cual quien hace hacen puede pueden menos otras otros dentro nadie nunca siempre " +
  "sierra altos valle costa"
).split(" "));

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const normalize = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function titleTag(post) {
  let base = (post.seoTitle || post.title).trim();
  // Artículos sin seoTitle y con título muy largo: quedarse con lo que va antes de los dos puntos
  if (base.length > MAX_TITLE && base.includes(":")) {
    const head = base.split(":")[0].trim();
    if (head.length >= 20) base = head;
  }
  return base.length + BRAND.length <= MAX_TITLE ? base + BRAND : base;
}

function isoFromFecha(fecha) {
  const m = /(\d{1,2}) de (\w+) de (\d{4})/i.exec(fecha || "");
  const mes = m && MESES[m[2].toLowerCase()];
  if (!mes) return undefined;
  return `${m[3]}-${String(mes).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function keywords(post) {
  return new Set(
    normalize(`${post.title} ${post.topic || ""}`)
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
      .map((w) => w.replace(/(es|s)$/, ""))
  );
}

// Mismo tag pesa 3, cada palabra clave compartida 2; empates → el más reciente
function relatedFor(idx, posts, kws) {
  const tag = normalize(posts[idx].tag);
  return posts
    .map((p, j) => {
      if (j === idx) return null;
      let score = normalize(p.tag) === tag ? 3 : 0;
      for (const w of kws[j]) if (kws[idx].has(w)) score += 2;
      return { p, j, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.j - b.j)
    .slice(0, RELATED_COUNT)
    .map((r) => r.p);
}

function jsonLd(post, html) {
  const url = `${SITE_URL}/${post.url}`;
  const published = (html.match(/"datePublished":\s*"([^"]+)"/) || [])[1] || isoFromFecha(post.date);
  const modified = (html.match(/"dateModified":\s*"([^"]+)"/) || [])[1] || published;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: post.title,
        description: post.excerpt,
        image: `${SITE_URL}/${post.cover}`,
        datePublished: published,
        dateModified: modified,
        inLanguage: "es-MX",
        articleSection: post.tag,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        isPartOf: { "@id": `${SITE_URL}/#website` },
        author: { "@type": "Organization", name: "Guardianes del Pulque", url: `${SITE_URL}/` },
        publisher: {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Guardianes del Pulque",
          logo: { "@type": "ImageObject", url: `${SITE_URL}/images/logo_transparente.png` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Artículos", item: `${SITE_URL}/posts.html` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };
  const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c").split("\n").join("\n  ");
  return `<script type="application/ld+json">\n  ${json}\n  </script>`;
}

function relatedBlock(items) {
  const cards = items
    .map(
      (p) => `
        <a class="related-card" href="../../${p.url}">
          <span class="related-tag">${esc(p.tag)}</span>
          <span class="related-title">${esc(p.title)}</span>
        </a>`
    )
    .join("");
  return `<!-- RELATED:START (generado por scripts/build-seo.js) -->
    <style>
      .related{margin:2rem 0 1rem}
      .related h2{margin:0 0 .8rem;font-size:1.15rem;color:#065f46}
      .related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.7rem}
      .related-card{display:flex;flex-direction:column;gap:.35rem;padding:.9rem 1rem;border-radius:14px;background:#fff;border:1px solid rgba(15,23,42,.08);box-shadow:0 4px 14px rgba(15,23,42,.05);transition:transform .15s ease,border-color .15s ease}
      .related-card:hover{transform:translateY(-2px);border-color:var(--brand)}
      .related-tag{font-size:.7rem;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.04em}
      .related-title{font-size:.9rem;font-weight:600;color:#0f172a;line-height:1.35}
    </style>
    <section class="related" aria-labelledby="related-heading">
      <h2 id="related-heading">Sigue leyendo</h2>
      <div class="related-grid">${cards}
      </div>
    </section>
    <!-- RELATED:END -->
    `;
}

function archiveBlock(posts) {
  const items = posts
    .map((p) => `<li><a href="${p.url}">${esc(p.title)}</a> <span>· ${esc(p.tag)}</span></li>`)
    .join("\n          ");
  return `<!-- ARCHIVE:START (generado por scripts/build-seo.js) -->
    <style>
      .archive{margin:28px 0 8px;font-size:.85rem}
      .archive summary{cursor:pointer;font-weight:700;color:#059669}
      .archive ul{columns:2 280px;column-gap:28px;margin:12px 0 0;padding-left:1.1rem}
      .archive li{margin:0 0 6px;break-inside:avoid}
      .archive a{text-decoration:underline;text-decoration-color:rgba(5,150,105,.35)}
      .archive li span{opacity:.6}
    </style>
    <section class="archive" aria-label="Archivo de artículos">
      <details>
        <summary>Archivo completo · ${posts.length} artículos</summary>
        <ul>
          ${items}
        </ul>
      </details>
    </section>
    <!-- ARCHIVE:END -->`;
}

function buildArticle(post, idx, posts, kws) {
  const file = path.join(ROOT, post.url);
  if (!fs.existsSync(file)) return { status: "missing" };
  const before = fs.readFileSync(file, "utf-8");
  let html = before;

  html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(titleTag(post))}</title>`);
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => jsonLd(post, before));
  html = html.replace(/(<figure class="hero-img">\s*<img )(?![^>]*fetchpriority)/, '$1fetchpriority="high" ');

  const block = relatedBlock(relatedFor(idx, posts, kws));
  if (/<!-- RELATED:START/.test(html)) {
    html = html.replace(/<!-- RELATED:START[\s\S]*?<!-- RELATED:END -->\s*/, () => block);
  } else {
    html = html.replace('<div class="back-links">', () => block + '<div class="back-links">');
  }

  if (html === before) return { status: "same" };
  fs.writeFileSync(file, html);
  return { status: "updated" };
}

function buildPostsPage(posts) {
  const file = path.join(ROOT, "posts.html");
  const before = fs.readFileSync(file, "utf-8");
  const block = archiveBlock(posts);
  let html;
  if (/<!-- ARCHIVE:START/.test(before)) {
    html = before.replace(/<!-- ARCHIVE:START[\s\S]*?<!-- ARCHIVE:END -->/, () => block);
  } else {
    const anchor = '<nav class="pager" id="pager"></nav>';
    if (!before.includes(anchor)) throw new Error("posts.html: no se encontró el pager para insertar el archivo");
    html = before.replace(anchor, () => `${anchor}\n    ${block}`);
  }
  if (html !== before) fs.writeFileSync(file, html);
  return html !== before;
}

function buildAll() {
  const posts = JSON.parse(fs.readFileSync(path.join(ROOT, "posts.json"), "utf-8"));
  const kws = posts.map(keywords);
  const counts = { updated: 0, same: 0, missing: 0 };
  posts.forEach((post, idx) => counts[buildArticle(post, idx, posts, kws).status]++);
  const archiveChanged = buildPostsPage(posts);
  return { ...counts, archiveChanged };
}

module.exports = { buildAll, titleTag };

if (require.main === module) {
  const r = buildAll();
  console.log(`Artículos: ${r.updated} actualizados, ${r.same} sin cambios, ${r.missing} no encontrados`);
  console.log(`posts.html: ${r.archiveChanged ? "archivo actualizado" : "sin cambios"}`);
}
