# Guardianes del Pulque

Sitio HTML estático servido con GitHub Pages. Sin framework, sin build.
`posts.json` es el registro central; `index.html` y `posts.html` lo leen con fetch.

## Estructura

```
index.html              — Homepage (hero, posts recientes, donar, bioalkimia)
posts.html              — Listado paginado de artículos con filtros por tag
posts.json              — Registro central de artículos (43 artículos)
sitemap.xml             — Sitemap para SEO
feed.xml                — RSS feed
calendario.html         — Página de calendario
terminos.html           — Términos y condiciones
aviso-privacidad.html   — Aviso de privacidad
404.html                — Página de error
images/logo_transparente.png — Logo del sitio
scripts/generate-post.js     — Generador automático de artículos (GPT-4o-mini + DALL-E 3)
scripts/generate-missing.js  — Script batch para generar artículos faltantes
scripts/regen-images.js      — Regenerar imágenes existentes
scripts/generate-rss.js      — Generar feed.xml desde posts.json
scripts/compress-images.js   — Comprimir imágenes con sharp
.env                         — OPENAI_API_KEY
```

## Artículos (43 total)

Los artículos originales (1-3) usan slugs sin guiones. Todos los demás usan slugs con guiones.

| Slug | Título | Tag |
|------|--------|-----|
| delapencaaljarro | De la penca al jarro: el proceso vivo | Pulque |
| guiadeadobe | Guía práctica de adobe | Bioconstrucción |
| microbiotadelpulque | Microbiota del pulque: quién es quién | Pulque |
| noticias-verdes-restauracion-y-polinizadores | Noticias verdes: restauración y polinizadores | Naturaleza |
| humedales-urbanos-manual-de-bolsillo | Humedales urbanos: manual de bolsillo | Agua |
| bambu-estructural | Bambú estructural | Bioconstruccion |
| suelos-vivos | Suelos vivos | Suelo |
| tierra-compactada-btc-rammed-earth | Tierra compactada (BTC / Rammed Earth) | Bioconstruccion |
| cadena-de-valor-del-maguey | Cadena de valor del maguey | Pulque |
| polinizacion-del-maiz | La polinización del maíz | Semillas |
| el-pulque-tradicion-y-sabor-del-maguey | El Pulque: Tradición y Sabor del Maguey | Pulque |
| el-renacer-de-la-tierra-polinizadores-y-humedales-en-la-restauracion-ecologica | El Renacer de la Tierra... | Naturaleza |
| bioconstruccion-tecnicas-sostenibles-con-tierra | Bioconstrucción: Técnicas Sostenibles con Tierra | Bioconstruccion |
| la-milpa-agricultura-tradicional-mexicana | La Milpa: Agricultura Tradicional Mexicana | Semillas |
| aprovechamiento-del-agua-captacion-pluvial-y-humedales-artificiales | Aprovechamiento del Agua... | Agua |
| fermentos-tradicionales-mexicanos-sabores-que-sanan | Fermentos Tradicionales Mexicanos | Fermentos |
| el-maravilloso-mundo-de-las-abejas-y-la-apicultura-tradicional-en-mexico | Las Abejas y la Apicultura... | Naturaleza |
| defensa-del-territorio-estrategias-y-derechos | Defensa del Territorio... | Territorio |
| el-fuego-en-la-cocina-tradicional-mexicana | El Fuego en la Cocina Tradicional | Fuego |
| el-arte-tradicional-mexicano-un-legado-cultural-vivo | El Arte Tradicional Mexicano | Arte |
| economia-solidaria-y-el-poder-del-trueque-en-comunidades-rurales | Economía Solidaria y Trueque | Economia |
| cosmologia-indigena-y-su-relevancia-en-la-espiritualidad-nahua | Cosmología Indígena | Cosmologia |
| el-fascinante-mundo-de-los-hongos-y-su-cultivo | El Fascinante Mundo de los Hongos | Hongos |
| la-diversidad-de-aves-en-nuestros-territorios | La Diversidad de Aves | Aves |
| la-madera-en-la-tradicion-mexicana-construccion-y-sabiduria | La Madera en la Tradición Mexicana | Madera |
| la-sabiduria-de-los-insectos-comestibles-en-la-cultura-mexicana | Los Insectos Comestibles | Insectos |
| energias-alternativas-caminos-hacia-la-autonomia-energetica-en-comunidades-rurales | Energías Alternativas | Energia |
| revitalizacion-de-las-lenguas-indigenas-en-mexico | Revitalización de Lenguas Indígenas | Lenguas |
| el-arte-de-fermentar-chucrut-mexicano-y-sus-beneficios | Fermento de Chucrut | Fermentos |
| mujeres-en-el-campo-guardianas-de-saberes-y-vida | Mujeres en el Campo | Mujeres |
| voces-de-la-tierra-la-musica-tradicional-mexicana | Voces de la Tierra: Música Tradicional | Musica |
| psicodelicos-sagrados-en-la-medicina-ancestral | Psicodélicos Sagrados en la Medicina Ancestral | Psicodelicos |
| el-arte-de-los-colorantes-naturales-en-mexico | El Arte de los Colorantes Naturales | Colorantes |
| fermentos-de-col-morada-un-tesoro-probiotico-de-mexico | Fermento de Col Morada | Fermentos |
| la-sal-un-tesoro-del-territorio-mexicano | La Sal: Un Tesoro del Territorio | Sal |
| la-pesca-artesanal-y-sustentable-en-rios-y-lagos-de-mexico | La Pesca Artesanal y Sustentable | Pesca |
| el-arte-del-barro-tradicion-y-futuro-de-la-alfareria-mexicana | El Arte del Barro | Arte |
| el-arte-del-pan-de-la-masa-madre-al-pan-de-muerto | El Arte del Pan | Pan |
| la-cultura-otomi-saberes-y-tradiciones-de-un-pueblo-ancestral | La Cultura Otomí | Comunidad |
| raramuri-cultura-y-resistencia-en-la-sierra-tarahumara | Rarámuri: Cultura y Resistencia | Territorio |
| las-fibras-naturales-en-mexico-henequen-palma-y-mimbre | Las Fibras Naturales en México | Fibras |
| diego-rivera-maestro-del-muralismo-mexicano | Diego Rivera: Guía Completa | Arte |
| el-abrazo-verde-agroforesteria-y-sus-beneficios-en-el-territorio-mexicano | El Abrazo Verde: Agroforestería | Agroforesteria |

Cada artículo vive en `articulos/{slug}/` con:
- `{slug}.html` — Página del artículo
- `{slug}.png` — Imagen de portada generada con DALL-E 3

## Convención de rutas

- Los artículos originales (delapencaaljarro, guiadeadobe, microbiotadelpulque) usan slugs sin guiones
- Todos los demás usan slugs con guiones
- `posts.json` usa rutas relativas desde la raíz: `articulos/{slug}/{slug}.html`

## Meta OG/Twitter

- `index.html`: usa `images/logo_transparente.png` como og:image (homepage)
- Cada artículo: usa su propia `articulos/{slug}/{slug}.png` como og:image
- Base URL: `https://guardianesdelpulque.org`

## Generación de artículos

`scripts/generate-post.js`:
- Usa GPT-4o-mini para texto, DALL-E 3 para imágenes
- Estilos de imagen variados: fresco-cal, litografia-color, encaustica, claroscuro-social, pastel-costumbrista, expresionismo-terroso, tecnica-mixta, oleo-empaste, temple-antiguo
- Retry automático con prompt alternativo si DALL-E rechaza
- Tags válidos: Pulque, Bioconstruccion, Naturaleza, Territorio, Semillas, Agua, Fuego, Comunidad, Arte, Economia, Hongos, Aves, Pesca, Madera, Fibras, Colorantes, Sal, Pan, Insectos, Suelo, Energia, Lenguas, Mujeres, Musica, Psicodelicos, Fermentos, Cosmologia, Agroforesteria
- Tonos: practico-calido, poetico-con-mesura, cortito-conciso, narrativo

## Imágenes de portada

- **Ancho obligatorio: 912px** — toda imagen de artículo debe guardarse a exactamente 912px de ancho
- **Sin márgenes**: siempre aplicar `.trim({ threshold: 30 })` antes del `.resize(912)` con sharp para eliminar bordes blancos/beige que DALL-E agrega
- Ambos scripts (`generate-post.js` y `regen-images.js`) ya incluyen trim automático
- Si una imagen existente tiene márgenes: `sharp(file).trim({ threshold: 30 }).resize(912).toBuffer()` y sobreescribir

## Notas

- Los artículos referencian nav con rutas relativas `../../index.html`, `../../posts.html`
- El fallback en index.html tiene un post hardcodeado por si posts.json no carga
- `.gitignore` ya protege `.env` y `node_modules/`
- Al agregar artículos nuevos: actualizar `posts.json`, `sitemap.xml` y `feed.xml`
