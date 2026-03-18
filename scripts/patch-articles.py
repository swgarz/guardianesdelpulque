"""
Patches all article HTML files with:
- Dark mode CSS (reads gp.mode from localStorage)
- Back-to-top button
- Persistent mode JS
- Related articles placeholder + JS
"""
import os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DARK_CSS = """  <style>
    /* DARK MODE PERSISTENTE */
    body.mode-reading,body.mode-community{background:#020817;color:#e5e7eb}
    body.mode-reading .nav,body.mode-community .nav{background:rgba(8,10,24,.97)}
    body.mode-reading .brand-text,body.mode-community .brand-text{color:#e5e7eb}
    body.mode-reading .article-title,body.mode-community .article-title{color:#f1f5f9}
    body.mode-reading .article-body,body.mode-community .article-body{color:#d1d5db}
    body.mode-reading .article-body h2,body.mode-community .article-body h2{color:#6ee7b7}
    body.mode-reading .article-lead,body.mode-community .article-lead{color:#94a3b8}
    body.mode-reading .diy-section,body.mode-community .diy-section{background:rgba(5,150,105,.1);border-color:rgba(5,150,105,.4)}
    body.mode-reading .diy-section h2,body.mode-reading .diy-section h3,body.mode-community .diy-section h2,body.mode-community .diy-section h3{color:#e5e7eb}
    body.mode-reading .diy-section p,body.mode-reading .diy-section li,body.mode-community .diy-section p,body.mode-community .diy-section li{color:#94a3b8}
    body.mode-reading .highlight,body.mode-community .highlight{background:rgba(5,150,105,.08);color:#94a3b8}
    body.mode-reading .cta-section,body.mode-community .cta-section{background:rgba(5,150,105,.08);border-color:rgba(5,150,105,.35)}
    body.mode-reading .cta-section h3,body.mode-community .cta-section h3{color:#6ee7b7}
    body.mode-reading .cta-section p,body.mode-community .cta-section p{color:#94a3b8}
    body.mode-reading footer,body.mode-community footer{border-top-color:rgba(255,255,255,.08);color:#94a3b8}
    body.mode-reading .breadcrumbs,body.mode-community .breadcrumbs{color:#64748b}
    body.mode-reading .article-meta,body.mode-community .article-meta{color:#64748b}
    body.mode-reading #related-articles a,body.mode-community #related-articles a{background:rgba(5,150,105,.1);border-color:rgba(5,150,105,.3)}
    body.mode-reading #related-articles a div:nth-child(2),body.mode-community #related-articles a div:nth-child(2){color:#e2e8f0}
    body.mode-reading #related-articles a div:nth-child(3),body.mode-community #related-articles a div:nth-child(3){color:#64748b}
  </style>
"""

BACK_TO_TOP_HTML = """  <button id="backToTop" title="Volver arriba" style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:50;width:44px;height:44px;border-radius:50%;border:none;background:#059669;color:#fff;font-size:1.3rem;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .25s ease;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(5,150,105,.4);line-height:1">↑</button>
"""

EXTRA_JS = """  <script>
    // Back to top
    (function(){
      var btn=document.getElementById('backToTop');
      if(!btn)return;
      window.addEventListener('scroll',function(){
        btn.style.opacity=window.scrollY>300?'1':'0';
        btn.style.pointerEvents=window.scrollY>300?'auto':'none';
      },{passive:true});
      btn.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
    })();
    // Modo persistente
    (function(){
      try{
        var m=localStorage.getItem('gp.mode');
        if(m==='reading')document.body.classList.add('mode-reading');
        else if(m==='community')document.body.classList.add('mode-community');
      }catch(e){}
    })();
    // Artículos relacionados
    (async function(){
      var tagEl=document.querySelector('.meta-pill span');
      var tag=tagEl?tagEl.textContent.trim():'';
      if(!tag)return;
      var currentFile=location.pathname.split('/').pop();
      try{
        var r=await fetch('../../posts.json');
        if(!r.ok)return;
        var posts=await r.json();
        var related=posts.filter(function(p){return p.tag===tag&&!p.url.endsWith(currentFile);}).slice(0,3);
        if(!related.length)return;
        var section=document.getElementById('related-articles');
        if(!section)return;
        section.innerHTML='<h2 style="font-size:1rem;font-weight:700;margin:0 0 .8rem;color:#065f46">📚 Artículos relacionados</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.8rem">'+
          related.map(function(p){
            return '<a href="../../'+p.url+'" style="display:block;padding:12px;border-radius:12px;border:1px solid rgba(5,150,105,.2);background:rgba(5,150,105,.04);transition:transform .15s;text-decoration:none"><div style="font-size:11px;color:#059669;font-weight:600">'+p.tag+'</div><div style="font-weight:700;font-size:.88rem;color:#0f172a;margin:.2rem 0;line-height:1.25">'+p.title+'</div><div style="font-size:.75rem;color:#64748b">'+(p.excerpt||'')+'</div></a>';
          }).join('')+
          '</div>';
      }catch(e){}
    })();
  </script>
"""

RELATED_PLACEHOLDER = '    <!-- ARTÍCULOS RELACIONADOS -->\n    <div id="related-articles" style="margin:1.5rem 0"></div>\n'

pattern = os.path.join(ROOT, "articulos", "**", "*.html")
files = glob.glob(pattern, recursive=True)
count = 0

for filepath in sorted(files):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'id="backToTop"' in content:
        print(f"SKIP (already patched): {os.path.basename(filepath)}")
        continue

    # 1. Add dark mode CSS before </head>
    if '</head>' in content:
        content = content.replace('</head>', DARK_CSS + '</head>', 1)

    # 2. Add related articles placeholder before .back-links (if present)
    if '<div class="back-links">' in content and 'id="related-articles"' not in content:
        content = content.replace('<div class="back-links">', RELATED_PLACEHOLDER + '    <div class="back-links">', 1)

    # 3. Add back-to-top button + JS before </body>
    if '</body>' in content:
        content = content.replace('</body>', BACK_TO_TOP_HTML + EXTRA_JS + '</body>', 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    count += 1
    print(f"Patched: {os.path.relpath(filepath, ROOT)}")

print(f"\nDone! {count} files patched.")
