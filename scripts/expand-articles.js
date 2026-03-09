const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI();

// ── Extraer y reemplazar el cuerpo del artículo ────────────────────────────

function extractBody(html) {
  // Caso 1: artículos originales con <article class="article-body">
  const articleTag = '<article class="article-body">';
  if (html.includes(articleTag)) {
    const start = html.indexOf(articleTag) + articleTag.length;
    const end = html.indexOf("</article>", start);
    if (start !== -1 && end !== -1) {
      return { start, end, content: html.slice(start, end) };
    }
  }

  // Caso 2: artículos generados con <main class="article">
  const mainTag = '<main class="article">';
  const mainStart = html.indexOf(mainTag);
  if (mainStart === -1) return null;

  const afterMain = html.slice(mainStart + mainTag.length);

  // Buscar el divisor que precede la sección CTA o PIE del artículo
  const endPatterns = [
    /\n\s*<div class="divider"><\/div>\s*\n\s*<!-- CTA/,
    /\n\s*<div class="divider"><\/div>\s*\n\s*<!-- PIE/,
  ];

  for (const pattern of endPatterns) {
    const match = afterMain.search(pattern);
    if (match !== -1) {
      const start = mainStart + mainTag.length;
      const end = mainStart + mainTag.length + match;
      return { start, end, content: html.slice(start, end) };
    }
  }

  return null;
}

function htmlToText(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// ── Expandir un artículo con GPT ───────────────────────────────────────────

async function expandArticle(htmlPath, title, tag) {
  if (!fs.existsSync(htmlPath)) {
    console.log(`  ✗ Archivo no encontrado: ${htmlPath}`);
    return;
  }

  const html = fs.readFileSync(htmlPath, "utf-8");
  const extracted = extractBody(html);

  if (!extracted) {
    console.log(`  ✗ No se encontró cuerpo en: ${path.basename(htmlPath)}`);
    return;
  }

  const plainText = htmlToText(extracted.content);
  const currentWords = plainText.split(" ").filter(Boolean).length;

  if (currentWords >= 800) {
    console.log(`  ✓ Ya tiene ~${currentWords} palabras, se omite.`);
    return;
  }

  console.log(`  Palabras actuales: ~${currentWords} → expandiendo...`);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Eres un redactor experto en temas rurales, ecológicos y de territorio mexicano. " +
          "Escribes artículos claros, cálidos y prácticos para comunidades. " +
          "Cada sección debe tener mínimo 3 párrafos sustanciosos (mínimo 60 palabras cada uno). " +
          "Incluye datos concretos, ejemplos específicos, cifras y pasos prácticos donde aplique.",
      },
      {
        role: "user",
        content:
          `Tienes el siguiente artículo sobre "${title}" (tag: ${tag}):\n\n` +
          `${plainText}\n\n` +
          "Reescríbelo y expándelo significativamente manteniendo la esencia del contenido original. " +
          "El nuevo artículo debe tener entre 900 y 1400 palabras. " +
          "Usa entre 7 y 10 secciones con h2. " +
          "Desarrolla cada sección con profundidad: no basta nombrar, hay que explicar, " +
          "describir, dar contexto y ejemplos. " +
          "Agrega datos concretos, cifras o pasos prácticos en al menos la mitad de las secciones. " +
          "Responde SOLO con HTML válido: etiquetas h2, p, ul/li, ol/li. " +
          "No incluyas el título principal. No uses etiquetas style ni script. " +
          "Termina con un párrafo de cierre motivador de al menos 80 palabras.",
      },
    ],
    temperature: 0.75,
  });

  const newBody = completion.choices[0].message.content.trim();
  const newWords = htmlToText(newBody).split(" ").filter(Boolean).length;

  // Reemplazar cuerpo en el HTML
  const newHtml =
    html.slice(0, extracted.start) +
    "\n    " +
    newBody +
    "\n\n    " +
    html.slice(extracted.end);

  fs.writeFileSync(htmlPath, newHtml);
  console.log(`  ✓ Expandido: ~${newWords} palabras → guardado.`);
}

// ── Flujo principal ────────────────────────────────────────────────────────

async function main() {
  const postsPath = path.join(__dirname, "..", "posts.json");
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));
  const root = path.join(__dirname, "..");

  // Si se pasa un slug como argumento, solo procesar ese artículo
  const targetSlug = process.argv[2];

  for (const post of posts) {
    const htmlPath = path.join(root, post.url);
    const slug = post.url.split("/")[1];

    if (targetSlug && slug !== targetSlug) continue;

    console.log(`\n[${post.tag}] ${post.title}`);
    await expandArticle(htmlPath, post.title, post.tag);
  }

  console.log("\nListo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
