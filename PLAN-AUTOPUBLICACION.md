# Plan: Autopublicación semanal con IA

## Contexto

El sitio es HTML estático puro servido con GitHub Pages.
`posts.json` es el registro central; `index.html` y `posts.html` lo leen con fetch.
`articulos/plantilla` es el template HTML de cada artículo.

## Qué se necesita crear

### 1. `scripts/generate-post.js`

Script Node.js (~80 líneas) que:

1. Llama a la API de OpenAI con un prompt temático (pulque, maguey, bioconstrucción, tierra)
2. Parsea la respuesta: título, tag, excerpt, contenido HTML
3. Genera slug del título: `"Cadena de valor del maguey"` → `cadena-de-valor-del-maguey`
4. Llama a la API de OpenAI (DALL·E) para generar thumbnail del artículo
5. Guarda la imagen en `articulos/{slug}/{slug}.png`
6. Lee `articulos/plantilla` y reemplaza placeholders con el contenido generado
7. Crea `articulos/{slug}/{slug}.html`
8. Hace `unshift` de la nueva entrada en `posts.json` (con `cover` apuntando a la imagen)

### 2. `.github/workflows/weekly-post.yml`

GitHub Action con cron semanal que:

1. Checkout del repo
2. Setup Node.js
3. `npm install openai`
4. Ejecuta `node scripts/generate-post.js`
5. `git add . && git commit && git push`
6. GitHub Pages se rebuilds automáticamente

## Flujo

```
Cron (lunes 8am) → generate-post.js → OpenAI API (GPT + DALL·E)
                                          │
                    ┌─────────────────────┘
                    ▼
              título, tag, excerpt, body HTML
                    │
                    ├── OpenAI DALL·E → articulos/{slug}/{slug}.png  (thumbnail)
                    ├── articulos/{slug}/{slug}.html                 (nuevo)
                    ├── posts.json                                   (actualizado)
                    │
                    └── git commit + push → GitHub Pages live
```

## Lo que NO se modifica

- `index.html` — ya lee `posts.json` dinámicamente
- `posts.html` — igual
- `articulos/plantilla` — solo se usa como molde, no cambia

## Requisito

- Agregar `OPENAI_API_KEY` como secreto del repo en GitHub → Settings → Secrets (texto + thumbnails)

## Por qué GitHub Actions

- Gratis en repos públicos
- El cron ya vive donde vive el código (no necesita servicio externo)
- Git push nativo (no necesita tokens extra)
- Un solo YAML, sin deploy de nada

## Pendientes opcionales

- [ ] Rotación de temas para variedad en el prompt
- [ ] Límite máximo de artículos en `posts.json` (o archivo por año)
