/**
 * generate-guide.js
 * Genera guías técnicas paso a paso para guardianesdelpulque.org
 * Uso: node scripts/generate-guide.js
 *      node scripts/generate-guide.js --topic="Cómo hacer tepache"
 */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const OpenAI = require("openai");
const sharp = require("sharp");

const openai = new OpenAI();
const SITE_URL = "https://guardianesdelpulque.org";
const IMAGE_WIDTH = 912;

// ── Temas de guías técnicas ────────────────────────────────────────────────
const GUIDE_TOPICS = [
  { topic: "Cómo construir una compostera de 3 cámaras en casa o parcela",     tag: "Suelo"          },
  { topic: "Cómo seleccionar, limpiar y guardar semillas criollas",             tag: "Semillas"       },
  { topic: "Cómo hacer adobe con tierra de tu parcela paso a paso",             tag: "Bioconstruccion"},
  { topic: "Cómo raspar un maguey y obtener aguamiel para hacer pulque",        tag: "Pulque"         },
  { topic: "Cómo hacer tepache casero de piña o frutas de temporada",           tag: "Fermentos"      },
  { topic: "Cómo construir una captación de agua pluvial con materiales locales",tag: "Agua"          },
  { topic: "Cómo preparar lombricomposta en casa con lombriz roja californiana", tag: "Suelo"         },
  { topic: "Cómo construir un fogón eficiente de leña con adobe y barro",       tag: "Fuego"         },
  { topic: "Cómo hacer fermento de col morada (chucrut mexicano) en casa",      tag: "Fermentos"     },
  { topic: "Cómo hacer biofertilizante de estiércol fermentado para la milpa",  tag: "Suelo"         },
  { topic: "Cómo construir una cama de cultivo elevada con materiales reciclados",tag: "Semillas"    },
  { topic: "Cómo hacer pinole y sus usos tradicionales en la cocina mexicana",  tag: "Comunidad"     },
];

const TAG_EMOJI = {
  Pulque:"🍶", Bioconstruccion:"🏗️", Naturaleza:"🌿", Territorio:"✊",
  Semillas:"🌱", Agua:"💧", Fuego:"🔥", Comunidad:"🤝", Arte:"🎨",
  Suelo:"🌍", Fermentos:"🫙", Madera:"🪵", Medicina:"🪴", Agroforesteria:"🌳",
};

const TAG_PALETTES = {
  Suelo:          "tonos negro humus, café tierra, ocre dorado y verde vibrante",
  Semillas:       "tonos verde claro, amarillo dorado, tierra marrón y blanco leche",
  Bioconstruccion:"tonos rojo arcilla, terracota, adobe, marrón tierra y beige",
  Pulque:         "tonos ocre, ámbar, dorado, blanco hueso y verde maguey",
  Fermentos:      "tonos morado col, magenta, verde lima y blanco sal",
  Agua:           "tonos azul turquesa, verde agua, gris piedra y blanco espuma",
  Fuego:          "tonos rojo llama, naranja brasa, negro carbón y amarillo chispa",
  Comunidad:      "tonos ocre, rojo ladrillo, verde oliva y azul cielo",
  Madera:         "tonos café caoba, ocre, amarillo pino y verde bosque",
  Medicina:       "tonos verde medicinal, morado flor, blanco y ocre dorado",
  Agroforesteria: "tonos verde profundo, café corteza, musgo, cielo azul y tierra",
};
const DEFAULT_PALETTE = "tonos tierra, ocre, verde y rojo óxido";

// ── Helpers ────────────────────────────────────────────────────────────────
function slugify(str){
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").replace(/-+/g,"-").slice(0,80);
}
function fechaMx(d){
  const months=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ── HTML de la guía ────────────────────────────────────────────────────────
function buildGuideHTML({ title, excerpt, intro, tag, emoji, slug, dateStr, isoDate, materials, steps, tips, warning }){
  const safeExcerpt = (excerpt||'').replace(/"/g,"&quot;");
  const stepsCount = steps.length;

  const materialsHTML = materials.map(m =>
    `<li><span class="check-box">☐</span> ${m}</li>`
  ).join("\n          ");

  const stepsHTML = steps.map((s, i) =>
    `<li class="step-item">
            <div class="step-num">${i+1}</div>
            <div class="step-body">
              <strong class="step-title">${s.title}</strong>
              <p class="step-desc">${s.description}</p>
            </div>
          </li>`
  ).join("\n          ");

  const tipsHTML = (tips||[]).map(t => `<li>${t}</li>`).join("\n          ");
  const warningHTML = warning
    ? `<div class="warning-box">⚠️ ${warning}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="../../../images/logo_transparente.png">
  <title>${title} — Guardianes del Pulque</title>
  <meta name="description" content="${safeExcerpt}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${safeExcerpt}" />
  <meta property="og:image" content="${SITE_URL}/recursos/guias/${slug}/${slug}.png" />
  <meta property="og:url" content="${SITE_URL}/recursos/guias/${slug}/${slug}.html" />
  <meta property="og:site_name" content="Guardianes del Pulque" />
  <meta property="og:locale" content="es_MX" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${safeExcerpt}" />
  <meta name="twitter:image" content="${SITE_URL}/recursos/guias/${slug}/${slug}.png" />

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "${title}",
    "description": "${safeExcerpt}",
    "image": "${SITE_URL}/recursos/guias/${slug}/${slug}.png",
    "datePublished": "${isoDate}",
    "step": ${JSON.stringify(steps.map((s,i)=>({ "@type":"HowToStep","position":i+1,"name":s.title,"text":s.description })))},
    "author": { "@type":"Organization","name":"Guardianes del Pulque","url":"${SITE_URL}" }
  }
  <\/script>

  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,'Helvetica Neue',Arial;line-height:1.6;color:#0f172a;background:#f6f8fb;}
    :root{--brand:#059669;--ink:#0f172a;}
    a{color:inherit;text-decoration:none}
    img{max-width:100%;display:block}

    .container{max-width:860px;margin-inline:auto;padding:0 16px}
    @media (min-width:640px){.container{padding:0 24px}}

    /* NAV */
    .nav{position:sticky;top:0;z-index:40;background:transparent;border-bottom:1px solid transparent;backdrop-filter:saturate(180%) blur(14px);transition:background .25s,border-color .25s,box-shadow .25s;}
    .nav-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;gap:1rem;}
    .brand{display:flex;align-items:center;gap:.5rem;font-weight:700;}
    .brand-logo{height:40px;width:auto;}
    @media (min-width:768px){.brand-logo{height:52px}}
    .brand-text{font-size:1rem;color:#111827;letter-spacing:.02em;}
    .links{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:flex-end;align-items:center;}
    .chip{display:inline-flex;align-items:center;gap:.35rem;padding:.4rem .85rem;border-radius:999px;border:2px solid var(--brand);color:var(--brand);background:rgba(255,255,255,.98);font-weight:700;font-size:.75rem;cursor:pointer;transition:all .18s;white-space:nowrap;}
    .chip:hover{background:var(--brand);color:#020817;transform:translateY(-1px);}
    .nav.scrolled{background:#020817;border-bottom-color:rgba(148,163,253,.2);box-shadow:0 14px 40px rgba(0,0,0,.55);}
    .nav.scrolled .brand-text{color:#f9fafb}
    .nav.scrolled .chip{background:transparent;border-color:#22c55e;color:#bbf7d0;}
    .nav.scrolled .chip:hover{background:#22c55e;color:#020817;}

    /* LAYOUT */
    main{padding:28px 0 48px}
    .breadcrumbs{font-size:.78rem;color:#9ca3af;margin-bottom:12px;}
    .breadcrumbs a{color:#6b7280;}
    .breadcrumbs a:hover{color:var(--brand);}

    /* GUIDE HEADER */
    .guide-badges{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.6rem;}
    .type-badge{display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(245,158,11,.12);color:#b45309;border:1px solid rgba(245,158,11,.3);}
    .tag-pill{display:inline-block;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:rgba(5,150,105,.1);color:var(--brand);border:1px solid rgba(5,150,105,.28);text-decoration:none;}
    .guide-title{font-size:clamp(22px,5vw,34px);font-weight:800;margin:.2rem 0 .5rem;line-height:1.15;letter-spacing:-.01em;color:#0f172a;}
    .guide-meta{display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;font-size:.78rem;color:#6b7280;margin-bottom:.8rem;}
    .meta-item{display:inline-flex;align-items:center;gap:.3rem;}
    .guide-intro{font-size:.97rem;color:#374151;margin:0 0 20px;line-height:1.65;}

    /* COVER */
    .guide-cover{width:100%;max-width:860px;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(15,23,42,.16);margin:0 auto 32px;display:block;aspect-ratio:16/9;object-fit:cover;}

    /* MATERIALS */
    .section-card{background:#fff;border-radius:16px;padding:20px 24px;margin:0 0 24px;border:1px solid rgba(15,23,42,.07);box-shadow:0 4px 14px rgba(0,0,0,.06);}
    .section-title{font-size:1.1rem;font-weight:800;color:#065f46;margin:0 0 14px;display:flex;align-items:center;gap:.4rem;}
    .materials-list{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr;gap:8px;}
    @media (min-width:500px){.materials-list{grid-template-columns:repeat(2,1fr)}}
    .materials-list li{display:flex;align-items:flex-start;gap:.5rem;font-size:.92rem;color:#374151;}
    .check-box{font-size:1.1rem;line-height:1;flex-shrink:0;margin-top:1px;}

    /* STEPS */
    .steps-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:16px;}
    .step-item{display:flex;gap:16px;align-items:flex-start;}
    .step-num{flex-shrink:0;width:40px;height:40px;border-radius:50%;background:var(--brand);color:#fff;font-weight:800;font-size:1.1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(5,150,105,.3);}
    .step-body{flex:1;padding-top:6px;}
    .step-title{display:block;font-size:.97rem;font-weight:700;color:#0f172a;margin-bottom:4px;}
    .step-desc{margin:0;font-size:.92rem;color:#374151;line-height:1.6;}

    /* TIPS */
    .tips-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;}
    .tips-list li{display:flex;align-items:flex-start;gap:.5rem;font-size:.92rem;color:#374151;}
    .tips-list li::before{content:"💡";flex-shrink:0;}

    /* WARNING */
    .warning-box{padding:12px 16px;border-left:3px solid #f59e0b;background:rgba(245,158,11,.06);border-radius:10px;font-size:.88rem;color:#92400e;margin:16px 0;}

    /* PRINT */
    @media print{
      .nav,.back-links,.cta-section,footer{display:none!important}
      body{background:#fff;color:#000;}
      .section-card{box-shadow:none;border:1px solid #ccc;}
      .step-num{background:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .guide-cover{max-height:220px;}
    }

    /* CTA */
    .cta-section{margin:2rem 0 1rem;padding:1.4rem;border-radius:16px;background:rgba(5,150,105,.04);border:1px dashed rgba(5,150,105,.3);text-align:center;}
    .cta-section h3{font-size:1rem;margin:0 0 .5rem;color:#065f46;}
    .cta-section p{font-size:.84rem;color:#4b5563;margin:0 0 .9rem;}

    .back-links{margin-top:26px;display:flex;flex-wrap:wrap;gap:.6rem;font-size:.8rem;}
    footer{border-top:1px solid rgba(15,23,42,.08);padding:18px 0 22px;font-size:.78rem;color:#9ca3af;}
    footer .row{display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap;}
  </style>
</head>
<body>
  <!-- NAV -->
  <header class="nav" id="mainNav">
    <div class="container nav-row">
      <a class="brand" href="../../../index.html">
        <img src="../../../images/logo_transparente.png" alt="Guardianes del Pulque" class="brand-logo" />
        <span class="brand-text">Guardianes del Pulque</span>
      </a>
      <nav class="links">
        <a class="chip" href="../../../posts.html">Artículos</a>
        <a class="chip" href="../../../recursos.html">🛠️ Recursos</a>
        <a class="chip" href="../../../index.html#donar"><span>💚</span> Donar</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="breadcrumbs">
      <a href="../../../index.html">Inicio</a> ·
      <a href="../../../recursos.html">Recursos</a> ·
      ${title}
    </div>

    <div class="guide-badges">
      <span class="type-badge">🛠️ Guía técnica</span>
      <a class="tag-pill" href="../../../recursos.html?tag=${encodeURIComponent(tag)}">${emoji} ${tag}</a>
    </div>
    <h1 class="guide-title">${title}</h1>
    <div class="guide-meta">
      <span class="meta-item">📋 <strong>${stepsCount} pasos</strong></span>
      <span class="meta-item">📅 ${dateStr}</span>
    </div>
    <p class="guide-intro">${intro}</p>

    <img class="guide-cover" src="${slug}.png" alt="${title}" />

    <!-- MATERIALES -->
    <div class="section-card">
      <h2 class="section-title">🧰 Materiales necesarios</h2>
      ${warningHTML}
      <ul class="materials-list">
          ${materialsHTML}
      </ul>
    </div>

    <!-- PASOS -->
    <div class="section-card">
      <h2 class="section-title">📋 Paso a paso</h2>
      <ol class="steps-list">
          ${stepsHTML}
      </ol>
    </div>

    <!-- CONSEJOS -->
    ${tipsHTML ? `<div class="section-card">
      <h2 class="section-title">💡 Consejos y variaciones</h2>
      <ul class="tips-list">
          ${tipsHTML}
      </ul>
    </div>` : ''}

    <!-- CTA -->
    <div class="cta-section">
      <h3>¿Te fue útil esta guía?</h3>
      <p>Compártela en tu comunidad y visita más recursos en Guardianes del Pulque.</p>
      <a class="chip" href="../../../recursos.html">← Más recursos</a>
      &nbsp;
      <a class="chip" href="../../../index.html#donar"><span>💚</span> Donar</a>
    </div>

    <div class="back-links">
      <a href="../../../recursos.html" class="chip">← Todos los recursos</a>
      <span class="chip">${emoji} ${tag}</span>
      <button class="chip" id="btnStory" type="button">📲 Historia</button>
    </div>
  </main>

  <footer>
    <div class="container row">
      <div style="display:flex;align-items:center;gap:.5rem">
        <img src="../../../images/logo_transparente.png" alt="Guardianes del Pulque" style="height:22px;width:auto">
        <span>Guardianes del Pulque</span>
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <a class="chip" href="../../../index.html#donar"><span>💚</span> Donar</a>
        <a class="chip" href="../../../recursos.html">Más recursos</a>
        <a class="chip" href="../../../posts.html">📰 Artículos</a>
      </div>
    </div>
  </footer>

  <script>
    const nav = document.getElementById("mainNav");
    window.addEventListener("scroll", () => {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    }, { passive: true });
  </script>
  <script>
  (function(){
    const btn=document.getElementById('btnStory');
    if(!btn)return;
    function wrapText(ctx,text,x,topY,maxW,lineH,maxLines){
      const words=text.split(' ');let line='',lines=[];
      for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;}
      if(line)lines.push(line);
      if(maxLines&&lines.length>maxLines){lines=lines.slice(0,maxLines);let last=lines[maxLines-1];while(last.length&&ctx.measureText(last+'…').width>maxW)last=last.slice(0,-1);lines[maxLines-1]=last.replace(/[\s,;:.]+$/,'')+'…';}
      let yy=topY;
      for(const l of lines){ctx.fillText(l,x,yy);yy+=lineH;}
      return yy;
    }
    btn.addEventListener('click',async()=>{
      const orig=btn.textContent;btn.textContent='⏳';btn.disabled=true;
      try{
        const coverUrl=document.querySelector('meta[property="og:image"]')?.content||'';
        const title=(document.querySelector('meta[property="og:title"]')?.content||document.title).replace(/\s*—\s*Guardianes del Pulque/,'');
        const excerpt=(document.querySelector('meta[property="og:description"]')?.content||document.querySelector('meta[name="description"]')?.content||'').trim();
        const W=1080,H=1920,IMGSLICE=1150;
        const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
        const ctx=canvas.getContext('2d');
        const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#011a10');bg.addColorStop(1,'#000c06');
        ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
        try{
          const img=new Image();img.crossOrigin='anonymous';
          await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=coverUrl;});
          const ir=img.naturalWidth/img.naturalHeight,tr=W/IMGSLICE;
          let sx=0,sy=0,sw=img.naturalWidth,sh=img.naturalHeight;
          if(ir>tr){sw=sh*tr;sx=(img.naturalWidth-sw)/2;}else{sh=sw/tr;sy=(img.naturalHeight-sh)/2;}
          ctx.drawImage(img,sx,sy,sw,sh,0,0,W,IMGSLICE);
        }catch{}
        const fade=ctx.createLinearGradient(0,IMGSLICE-350,0,IMGSLICE+50);
        fade.addColorStop(0,'rgba(1,26,16,0)');fade.addColorStop(1,'rgba(1,26,16,1)');
        ctx.fillStyle=fade;ctx.fillRect(0,IMGSLICE-350,W,400);
        ctx.strokeStyle='rgba(52,211,153,.35)';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(100,IMGSLICE+30);ctx.lineTo(W-100,IMGSLICE+30);ctx.stroke();
        ctx.textBaseline='top';
        ctx.fillStyle='#ffffff';ctx.textAlign='center';
        ctx.font='bold 70px system-ui,ui-sans-serif,sans-serif';
        let ny=wrapText(ctx,title,W/2,IMGSLICE+90,W-160,86,4);
        if(excerpt){
          ny+=30;
          ctx.fillStyle='rgba(255,255,255,.82)';
          ctx.font='400 38px system-ui,ui-sans-serif,sans-serif';
          wrapText(ctx,excerpt,W/2,ny,W-200,52,4);
        }
        ctx.textBaseline='alphabetic';
        ctx.fillStyle='#34d399';ctx.font='bold 50px system-ui,ui-sans-serif,sans-serif';
        ctx.fillText('Guardianes del Pulque',W/2,1760);
        ctx.fillStyle='rgba(255,255,255,.45)';ctx.font='38px system-ui,ui-sans-serif,sans-serif';
        ctx.fillText('guardianesdelpulque.org',W/2,1828);
        const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
        const file=new File([blob],'historia-guardianesdelpulque.png',{type:'image/png'});
        if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title});}
        else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='historia-guardianesdelpulque.png';a.click();}
      }catch(e){console.error(e);}
      finally{btn.textContent=orig;btn.disabled=false;}
    });
  })();
  </script>
</body>
</html>`;
}

// ── Generador principal ────────────────────────────────────────────────────
async function generateGuide(){
  const recursosPath = path.join(__dirname, "..", "recursos.json");
  let recursos = [];
  try { recursos = JSON.parse(fs.readFileSync(recursosPath, "utf-8")); } catch {}

  const topicArg = process.argv.find(a => a.startsWith("--topic="))?.split("=")[1]
    || (process.argv.includes("--topic") ? process.argv[process.argv.indexOf("--topic")+1] : null);

  // Elegir tema
  const existingTitles = new Set(recursos.map(r => r.title));
  let chosen;
  if(topicArg){
    chosen = { topic: topicArg, tag: process.argv.find(a=>a.startsWith("--tag="))?.split("=")[1] || "Comunidad" };
  } else {
    const available = GUIDE_TOPICS.filter(t => !existingTitles.has(t.topic));
    if(!available.length){ console.log("Ya se generaron todas las guías predefinidas."); process.exit(0); }
    chosen = pick(available);
  }

  console.log(`Tema:  ${chosen.topic}`);
  console.log(`Tag:   ${chosen.tag}`);

  // 1. Generar contenido con GPT
  console.log("Generando contenido con GPT...");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Eres un instructor práctico de saberes rurales y técnicas tradicionales mexicanas. Redactas guías claras, concretas y accesibles para comunidades rurales y urbanas. Tu lenguaje es directo, sin tecnicismos innecesarios, y siempre orientado a la acción."
      },
      {
        role: "user",
        content:
          `Crea una guía técnica completa sobre: "${chosen.topic}".\n\n` +
          "Responde SOLO con un JSON válido (sin markdown ni backticks) con esta estructura EXACTA:\n" +
          `{"title":"Título claro y directo","excerpt":"Descripción en max 120 chars","intro":"Párrafo introductorio motivador (max 100 palabras, explica para qué sirve y quién puede hacerlo)","materials":["material 1","material 2",...],"steps":[{"title":"Nombre del paso","description":"Descripción clara en 2-3 oraciones, con detalles prácticos"},...],"tips":["consejo 1","consejo 2",...],"warning":"Advertencia importante si aplica (o null si no hay)"}\n\n` +
          "Reglas:\n" +
          "- Entre 6 y 10 pasos\n" +
          "- Entre 5 y 10 materiales, todos accesibles en comunidades rurales\n" +
          "- Entre 3 y 5 consejos prácticos\n" +
          "- Cada paso debe tener descripción de al menos 2 oraciones con detalles concretos\n" +
          "- Materiales con cantidades o medidas cuando aplique\n" +
          "- Lenguaje simple, sin tecnicismos innecesarios\n" +
          "- El JSON debe ser una sola línea sin saltos de línea dentro de strings"
      }
    ],
    temperature: 0.7,
  });

  function tryParse(raw){
    try { return JSON.parse(raw); } catch {}
    const m = raw.match(/\{[\s\S]*\}/);
    if(!m) return null;
    try { return JSON.parse(m[0]); } catch {}
    try {
      const fixed = m[0]
        .replace(/"description"\s*:\s*"([\s\S]*?)(?=",\s*\}|\}\s*\])/g, (_, c) => `"description":"${c.replace(/\n/g,'\\n').replace(/"/g,'\\"')}"`)
      return JSON.parse(fixed);
    } catch {}
    return null;
  }

  let raw = completion.choices[0].message.content.trim();
  let guide = tryParse(raw);

  if(!guide){
    console.log("JSON inválido, reintentando...");
    const retry = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: `Genera una guía técnica sobre "${chosen.topic}" como JSON válido sin saltos de línea en los valores. Estructura: {"title":"...","excerpt":"...","intro":"...","materials":["..."],"steps":[{"title":"...","description":"..."}],"tips":["..."],"warning":null}` }
      ],
      temperature: 0.5,
    });
    raw = retry.choices[0].message.content.trim();
    guide = tryParse(raw);
  }
  if(!guide) throw new Error("GPT no devolvió JSON válido");

  const tag = chosen.tag;
  const emoji = TAG_EMOJI[tag] || "🛠️";
  const slug = slugify(guide.title);

  // 2. Generar imagen con DALL-E 3
  console.log("Generando imagen DALL-E...");
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;
  const imagePrompt =
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Subject: "${guide.title}" — Mexican rural scene showing people doing this traditional technique step by step. ` +
    `Color palette: ${palette}. ` +
    `Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look. ` +
    `SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no panels, no grids, no borders. ` +
    `NO photography, NO 3D render, NO text, NO letters, NO words, NO labels, NO typography, NO writing of any kind.`;

  let imageBuffer;
  try {
    const imageResponse = await openai.images.generate({ model:"dall-e-3", prompt:imagePrompt, n:1, size:"1792x1024" });
    imageBuffer = Buffer.from(await fetch(imageResponse.data[0].url).then(r=>r.arrayBuffer()));
  } catch {
    const fallback = `Pop art illustration in Mexican rural style. Topic: "${guide.title}". Color palette: ${palette}. Ben-Day dots, flat vivid colors, comic aesthetic. SINGLE illustration, no text, no letters.`;
    const imageResponse = await openai.images.generate({ model:"dall-e-3", prompt:fallback, n:1, size:"1792x1024" });
    imageBuffer = Buffer.from(await fetch(imageResponse.data[0].url).then(r=>r.arrayBuffer()));
  }
  imageBuffer = await sharp(imageBuffer).trim({ threshold:30 }).resize(IMAGE_WIDTH).jpeg({ quality:82, mozjpeg:true }).toBuffer();

  // 3. Guardar archivos
  const guideDir = path.join(__dirname, "..", "recursos", "guias", slug);
  fs.mkdirSync(guideDir, { recursive:true });
  fs.writeFileSync(path.join(guideDir, `${slug}.png`), imageBuffer);

  const now = new Date();
  const dateStr = fechaMx(now);
  const html = buildGuideHTML({
    title: guide.title,
    excerpt: guide.excerpt,
    intro: guide.intro,
    tag, emoji, slug, dateStr,
    isoDate: now.toISOString().split("T")[0],
    materials: guide.materials || [],
    steps: guide.steps || [],
    tips: guide.tips || [],
    warning: guide.warning || null,
  });
  fs.writeFileSync(path.join(guideDir, `${slug}.html`), html);

  // 4. Actualizar recursos.json
  recursos.unshift({
    type: "guia",
    tag,
    title: guide.title,
    excerpt: guide.excerpt,
    steps: (guide.steps||[]).length,
    date: dateStr,
    url: `recursos/guias/${slug}/${slug}.html`,
    cover: `recursos/guias/${slug}/${slug}.png`,
    topic: chosen.topic,
  });
  fs.writeFileSync(recursosPath, JSON.stringify(recursos, null, 2) + "\n");

  console.log(`\nCreado:  recursos/guias/${slug}/${slug}.html`);
  console.log(`Cover:   recursos/guias/${slug}/${slug}.png`);
  console.log(`Tag:     ${emoji} ${tag}`);
  console.log(`Título:  ${guide.title}`);
  console.log(`Pasos:   ${(guide.steps||[]).length}`);
  console.log(`Fecha:   ${dateStr}`);
}

generateGuide().catch(err => { console.error(err); process.exit(1); });
