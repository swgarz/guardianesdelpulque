# Guardianes del Pulque

Sitio HTML estático servido con GitHub Pages. Sin framework, sin build.
`posts.json` es el registro central; `index.html` y `posts.html` lo leen con fetch.

## Estructura

```
index.html              — Homepage (hero, posts recientes, donar, bioalkimia)
posts.html              — Listado paginado de artículos
posts.json              — Registro central de artículos
images/logo_transparente.png — Logo del sitio
scripts/generate-post.js     — Generador automático de artículos (GPT-4o-mini + DALL-E 3)
scripts/generate-missing.js  — Script batch para generar artículos faltantes
.env                         — OPENAI_API_KEY
```

## Artículos (10 total)

| # | Slug | Título | Tag | Carpeta |
|---|------|--------|-----|---------|
| 1 | delapencaaljarro | De la penca al jarro: el proceso vivo | Pulque | `articulos/delapencaaljarro/` |
| 2 | guiadeadobe | Guía práctica de adobe | Bioconstrucción | `articulos/guiadeadobe/` |
| 3 | microbiotadelpulque | Microbiota del pulque: quién es quién | Pulque | `articulos/microbiotadelpulque/` |
| 4 | noticias-verdes-restauracion-y-polinizadores | Noticias verdes: restauración y polinizadores | Naturaleza | `articulos/noticias-verdes-restauracion-y-polinizadores/` |
| 5 | humedales-urbanos-manual-de-bolsillo | Humedales urbanos: manual de bolsillo | Naturaleza | `articulos/humedales-urbanos-manual-de-bolsillo/` |
| 6 | bambu-estructural | Bambú estructural | Bioconstruccion | `articulos/bambu-estructural/` |
| 7 | utensilios-tradicionales-del-tinacal | Utensilios tradicionales del tinacal | Pulque | `articulos/utensilios-tradicionales-del-tinacal/` |
| 8 | suelos-vivos | Suelos vivos | Naturaleza | `articulos/suelos-vivos/` |
| 9 | tierra-compactada-btc-rammed-earth | Tierra compactada (BTC / Rammed Earth) | Bioconstruccion | `articulos/tierra-compactada-btc-rammed-earth/` |
| 10 | cadena-de-valor-del-maguey | Cadena de valor del maguey | Pulque | `articulos/cadena-de-valor-del-maguey/` |

Cada artículo vive en `articulos/{slug}/` con:
- `{slug}.html` — Página del artículo
- `{slug}.png` — Imagen de portada generada con DALL-E 3

## Convención de rutas

- Los artículos 1-3 (originales) usan slugs sin guiones en la carpeta (ej. `delapencaaljarro`)
- Los artículos 4-10 (generados) usan slugs con guiones (ej. `bambu-estructural`)
- `posts.json` usa rutas relativas desde la raíz: `articulos/{slug}/{slug}.html`

## Meta OG/Twitter

- `index.html`: usa `images/logo_transparente.png` como og:image (homepage)
- Cada artículo: usa su propia `articulos/{slug}/{slug}.png` como og:image
- Base URL: `https://guardianesdelpulque.com`

## Generación de artículos

`scripts/generate-post.js`:
- Usa GPT-4o-mini para texto, DALL-E 3 para imágenes
- Estilos de imagen variados: mural mexicano, impresionista, acuarela
- Retry automático con prompt alternativo si DALL-E rechaza
- Tags válidos: Pulque, Bioconstruccion, Naturaleza, Territorio
- Tonos: practico-calido, poetico-con-mesura, cortito-conciso, narrativo

## Notas

- Los artículos referencian nav con rutas relativas `../../index.html`, `../../posts.html`
- El fallback en index.html tiene un post hardcodeado por si posts.json no carga
- No hay .gitignore para .env — agregar antes de hacer público
