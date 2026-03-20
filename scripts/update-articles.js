#!/usr/bin/env node
/**
 * update-articles.js
 * Aplica mejoras a todos los artículos HTML:
 *   1. <meta name="theme-color" content="#059669">
 *   2. loading="lazy" en la imagen hero
 *   3. <link rel="canonical"> (basado en og:url existente)
 *   4. Botones de compartir (WhatsApp + copiar link)
 *   5. Botón de cambio de modo en el nav del artículo
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARTICULOS = path.join(ROOT, 'articulos');

// Todos los slugs de artículos (directorios)
const slugDirs = fs.readdirSync(ARTICULOS).filter(d =>
  fs.statSync(path.join(ARTICULOS, d)).isDirectory()
);

let updated = 0;
let skipped = 0;

for (const dir of slugDirs) {
  const dirPath = path.join(ARTICULOS, dir);
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html'));
  if (!files.length) { skipped++; continue; }

  const htmlFile = files[0];
  const filePath = path.join(dirPath, htmlFile);
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // ── 1. theme-color ──────────────────────────────────────────────────────────
  if (!html.includes('name="theme-color"')) {
    html = html.replace(
      /(<meta charset="utf-8"\s*\/>)/,
      '$1\n  <meta name="theme-color" content="#059669" />'
    );
    changed = true;
  }

  // ── 2. loading="lazy" en hero img ───────────────────────────────────────────
  if (html.includes('<figure class="hero-img">') && !html.includes('loading="lazy"')) {
    html = html.replace(
      /(<figure class="hero-img">[\s\S]*?<img\s)/,
      (m) => m.replace('<img ', '<img loading="lazy" ')
    );
    changed = true;
  }

  // ── 3. <link rel="canonical"> ───────────────────────────────────────────────
  if (!html.includes('rel="canonical"')) {
    const ogUrlMatch = html.match(/<meta property="og:url" content="([^"]+)"/);
    if (ogUrlMatch) {
      const canonicalUrl = ogUrlMatch[1];
      html = html.replace(
        /(<meta property="og:url"[^>]*>)/,
        `$1\n  <link rel="canonical" href="${canonicalUrl}" />`
      );
      changed = true;
    }
  }

  // ── 4. Botones de compartir ──────────────────────────────────────────────────
  if (!html.includes('id="share-buttons"')) {
    const shareHtml = `
    <!-- COMPARTIR -->
    <div id="share-buttons" style="margin:1.2rem 0;display:flex;flex-wrap:wrap;gap:.6rem;align-items:center">
      <span style="font-size:.8rem;font-weight:700;color:#64748b">Compartir:</span>
      <a id="share-whatsapp" href="#" target="_blank" rel="noopener"
         style="display:inline-flex;align-items:center;gap:.35rem;padding:.38rem .85rem;border-radius:999px;border:1.5px solid #25d366;color:#25d366;font-size:.78rem;font-weight:700;background:#fff;text-decoration:none;transition:all .15s"
         onmouseover="this.style.background='#25d366';this.style.color='#fff'"
         onmouseout="this.style.background='#fff';this.style.color='#25d366'">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.304A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
        WhatsApp
      </a>
      <button id="share-copy"
         style="display:inline-flex;align-items:center;gap:.35rem;padding:.38rem .85rem;border-radius:999px;border:1.5px solid #059669;color:#059669;font-size:.78rem;font-weight:700;background:#fff;cursor:pointer;transition:all .15s"
         onmouseover="this.style.background='#059669';this.style.color='#fff'"
         onmouseout="this.style.background='#fff';this.style.color='#059669'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span id="share-copy-label">Copiar link</span>
      </button>
    </div>`;

    // Insertar antes del div#related-articles
    if (html.includes('id="related-articles"')) {
      html = html.replace(
        /(\s*<!-- ARTÍCULOS RELACIONADOS -->[\s\S]*?<div id="related-articles")/,
        shareHtml + '\n$1'
      );
    } else {
      // Fallback: insertar antes de back-links
      html = html.replace(
        /(<div class="back-links">)/,
        shareHtml + '\n    $1'
      );
    }
    changed = true;
  }

  // ── 5. Botón modo en nav del artículo ───────────────────────────────────────
  if (!html.includes('id="articleModeBtn"')) {
    html = html.replace(
      /(<nav class="links">)/,
      `<button id="articleModeBtn" style="display:inline-flex;align-items:center;gap:.3rem;padding:.38rem .7rem;border-radius:8px;border:1.5px solid #059669;color:#059669;background:transparent;font-size:.72rem;font-weight:700;cursor:pointer;transition:background .15s;white-space:nowrap" type="button">🌿</button>
      $1`
    );
    changed = true;
  }

  // ── Script para share-buttons y modo ────────────────────────────────────────
  if (changed && !html.includes('share-whatsapp') || (changed && html.includes('id="share-buttons"') && !html.includes('share-whatsapp.href'))) {
    // Añadir script de share y modo si no está
    if (!html.includes('share-whatsapp.href')) {
      const shareScript = `
  <script>
    // Compartir
    (function(){
      var wa = document.getElementById('share-whatsapp');
      var cp = document.getElementById('share-copy');
      var lbl = document.getElementById('share-copy-label');
      if(wa) wa.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(document.title + ' — ' + location.href);
      if(cp) cp.addEventListener('click', function(){
        navigator.clipboard.writeText(location.href).then(function(){
          if(lbl){ lbl.textContent = '¡Copiado!'; setTimeout(function(){ lbl.textContent = 'Copiar link'; }, 2000); }
        }).catch(function(){
          if(lbl){ lbl.textContent = 'Copia la URL'; setTimeout(function(){ lbl.textContent = 'Copiar link'; }, 2000); }
        });
      });
    })();
    // Botón modo artículo
    (function(){
      var btn = document.getElementById('articleModeBtn');
      if(!btn) return;
      function syncLabel(){
        var isCom = document.body.classList.contains('mode-community');
        btn.textContent = isCom ? '🍶' : '🌿';
        btn.title = isCom ? 'Modo pulque' : 'Modo comunitario';
      }
      syncLabel();
      btn.addEventListener('click', function(){
        var isCom = document.body.classList.contains('mode-community');
        document.body.classList.remove('mode-reading','mode-community');
        if(!isCom){ document.body.classList.add('mode-community'); try{ localStorage.setItem('gp.mode','community'); }catch(e){} }
        else { try{ localStorage.removeItem('gp.mode'); }catch(e){} }
        syncLabel();
      });
    })();
  </script>`;
      // Insertar antes de </body>
      html = html.replace('</body>', shareScript + '\n</body>');
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ ${dir}/${htmlFile}`);
    updated++;
  } else {
    console.log(`— ${dir}/${htmlFile} (sin cambios)`);
    skipped++;
  }
}

console.log(`\nListo: ${updated} actualizados, ${skipped} sin cambios.`);
