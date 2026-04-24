// Regenera el contenido (body + excerpt + DIY) de los artículos existentes
// usando los prompts nuevos de generate-post.js. NO toca las imágenes, slugs,
// títulos, fechas ni tags — solo reemplaza el HTML y actualiza el excerpt en
// posts.json. Puede correrse varias veces: soporta --only <slug>, --from N,
// --to N, --limit N, --skip <slugs-csv>, y reintenta internamente en errores.
//
// Uso:
//   node scripts/regen-all-articles.js --only el-abrazo-verde-agroforesteria-y-sus-beneficios-en-el-territorio-mexicano
//   node scripts/regen-all-articles.js --from 0 --to 5
//   node scripts/regen-all-articles.js                     (todos)
//   node scripts/regen-all-articles.js --dry                (no escribe nada)

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  openai,
  MODEL,
  DIY_MODEL,
  TONE_PROFILES,
  VALID_TAGS,
  TAG_EMOJI,
  DEFAULT_TAG,
  buildHTML,
  buildUserPrompt,
  validateTag,
  pick,
  randInt,
  randFloat,
  fechaMx,
} = require("./generate-post.js");

function argFlag(name, defVal = null) {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split("=").slice(1).join("=");
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith("--")) {
    return process.argv[idx + 1];
  }
  if (idx >= 0) return true;
  return defVal;
}

function tryParseJson(raw) {
  try { return JSON.parse(raw); } catch {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch {}
  try {
    const repaired = match[0].replace(/("body"\s*:\s*")([\s\S]*?)("(?:\s*,|\s*\}))/g,
      (_, pre, content, suf) => pre + content.replace(/\n/g, "\\n").replace(/\r/g, "") + suf);
    return JSON.parse(repaired);
  } catch {}
  return null;
}

function slugFromUrl(url) {
  // articulos/<slug>/<slug>.html
  const m = url.match(/articulos\/([^/]+)\//);
  return m ? m[1] : null;
}

function isoFromDateStr(dateStr) {
  // "5 de abril de 2026" → 2026-04-05
  const meses = { enero:"01", febrero:"02", marzo:"03", abril:"04", mayo:"05", junio:"06",
                  julio:"07", agosto:"08", septiembre:"09", octubre:"10", noviembre:"11", diciembre:"12" };
  const m = dateStr && dateStr.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (!m) return new Date().toISOString().split("T")[0];
  const day = m[1].padStart(2, "0");
  const mes = meses[m[2].toLowerCase()] || "01";
  return `${m[3]}-${mes}-${day}`;
}

async function regenerateOne(post) {
  const slug = slugFromUrl(post.url);
  if (!slug) throw new Error(`No pude extraer slug de url: ${post.url}`);

  const title = post.title;
  const topic = post.topic || `${title} — tema del artículo`;
  const tag = validateTag(post.tag) || DEFAULT_TAG;
  const emoji = TAG_EMOJI[tag] || "📝";
  const dateStr = post.date;
  const isoDate = isoFromDateStr(dateStr);

  const profile = pick(TONE_PROFILES);
  const [minSec, maxSec] = profile.sectionRange;
  const sectionCount = randInt(minSec, maxSec);
  const temperature = randFloat(...profile.temperatureRange);

  console.log(`\n▶ ${slug}`);
  console.log(`  Título: ${title}`);
  console.log(`  Tema:   ${topic}`);
  console.log(`  Perfil: ${profile.name} · ${sectionCount} secciones · temp ${temperature.toFixed(2)}`);

  // 1. Generar contenido (title fijo, se pasa como forceTitle)
  let article;
  let raw;
  for (let attempt = 0; !article && attempt < 3; attempt++) {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: profile.systemPrompt },
        {
          role: "user",
          content: buildUserPrompt({ topic, sectionCount, forceTitle: title }),
        },
      ],
      temperature: attempt === 0 ? temperature : 0.5,
      response_format: { type: "json_object" },
    });
    raw = completion.choices[0].message.content.trim();
    article = tryParseJson(raw);
    if (!article) console.log(`  (JSON inválido, reintentando ${attempt + 2}/3…)`);
  }
  if (!article) throw new Error("GPT no devolvió JSON válido tras 3 intentos");

  // 2. DIY
  const diyCompletion = await openai.chat.completions.create({
    model: DIY_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Eres instructor de saberes rurales mexicanos. Instrucciones claras, físicas, que funcionan. " +
          "Nada de prosa motivacional vacía: materiales reales con cantidades exactas, pasos con tiempos y temperaturas, " +
          "errores comunes señalados. Nunca digas 'disfruta del proceso' ni 'siente la magia'. Idioma: español mexicano.",
      },
      {
        role: "user",
        content:
          `El artículo es sobre: "${title}".\n\n` +
          "Escribe la sección 'Hazlo tú mismo' con una actividad SIMPLE, física, con materiales accesibles en México.\n\n" +
          "Responde SOLO JSON: " +
          '{"diy_title":"Nombre concreto","intro":"2-3 oraciones, qué haces, cuánto tarda, qué obtienes","materials":["con cantidad exacta"],"steps":["con tiempo/temperatura/medida"],"tip":"Un error común o truco específico"}\n\n' +
          "Máximo 6 pasos, máximo 7 materiales. Resultado tangible y medible.",
      },
    ],
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  let diyData;
  try {
    diyData = JSON.parse(diyCompletion.choices[0].message.content.trim());
  } catch {
    const m = diyCompletion.choices[0].message.content.match(/\{[\s\S]*\}/);
    diyData = m ? JSON.parse(m[0]) : null;
  }

  let diy = "";
  if (diyData) {
    const mats = (diyData.materials || []).map((m) => `<li>${m}</li>`).join("\n        ");
    const stps = (diyData.steps || []).map((s) => `<li>${s}</li>`).join("\n        ");
    diy = `<h3>${diyData.diy_title}</h3>
      <p>${diyData.intro}</p>
      <h3>Materiales</h3>
      <ul>
        ${mats}
      </ul>
      <h3>Paso a paso</h3>
      <ol>
        ${stps}
      </ol>
      <div class="highlight">💡 ${diyData.tip}</div>`;
  }

  // 3. Ensamblar HTML con el MISMO slug/título/fecha/tag (solo cambian body y excerpt)
  const html = buildHTML({
    title,
    excerpt: article.excerpt,
    body: article.body,
    diy,
    tag,
    emoji,
    slug,
    dateStr,
    isoDate,
  });

  return { slug, html, newExcerpt: article.excerpt, newTitle: article.title };
}

async function main() {
  const postsPath = path.join(__dirname, "..", "posts.json");
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));

  const onlyArg = argFlag("only");
  const fromArg = parseInt(argFlag("from", "0"), 10);
  const toArg = argFlag("to") ? parseInt(argFlag("to"), 10) : posts.length;
  const limitArg = argFlag("limit") ? parseInt(argFlag("limit"), 10) : null;
  const skipArg = argFlag("skip"); // csv de slugs a saltar
  const skipSet = new Set(skipArg ? skipArg.split(",").map((s) => s.trim()) : []);
  const dryRun = !!argFlag("dry");

  // Construir la lista de trabajo
  let work;
  if (onlyArg) {
    const post = posts.find((p) => slugFromUrl(p.url) === onlyArg);
    if (!post) {
      console.error(`No encontré un post con slug "${onlyArg}".`);
      process.exit(1);
    }
    work = [post];
  } else {
    work = posts.slice(fromArg, toArg).filter((p) => !skipSet.has(slugFromUrl(p.url)));
    if (limitArg) work = work.slice(0, limitArg);
  }

  console.log(`\n▶▶▶ Regenerando ${work.length} artículo(s). Modelo: ${MODEL} · DIY: ${DIY_MODEL}\n`);

  const failures = [];
  for (let i = 0; i < work.length; i++) {
    const post = work[i];
    const slug = slugFromUrl(post.url);
    try {
      console.log(`[${i + 1}/${work.length}]`);
      const result = await regenerateOne(post);

      if (dryRun) {
        console.log(`  (dry) no se escribió nada. Preview excerpt: "${result.newExcerpt}"`);
        continue;
      }

      // Escribir HTML
      const htmlPath = path.join(__dirname, "..", "articulos", result.slug, `${result.slug}.html`);
      fs.writeFileSync(htmlPath, result.html);

      // Actualizar excerpt en posts.json (in-place, preservar orden y resto de campos)
      const idx = posts.findIndex((p) => slugFromUrl(p.url) === result.slug);
      if (idx >= 0) {
        posts[idx].excerpt = result.newExcerpt;
        fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2) + "\n");
      }

      console.log(`  ✓ HTML reescrito. Excerpt: "${result.newExcerpt}"`);
    } catch (err) {
      console.error(`  ✗ FALLÓ: ${err.message}`);
      failures.push({ slug, error: err.message });
    }
  }

  console.log(`\n──────────────────────────────────────────`);
  console.log(`Terminado. OK: ${work.length - failures.length}/${work.length}`);
  if (failures.length) {
    console.log(`Fallidos (${failures.length}):`);
    failures.forEach((f) => console.log(`  - ${f.slug}: ${f.error}`));
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
