# Auditoría de invención factual

Fecha: 2026-05-22 (continuación de auditoría iniciada 2026-05-21)
Estado: pendiente de acción.

## Resumen ejecutivo

GPT-4o-mini (modelo usado por `scripts/generate-post.js` para generar artículos) fabrica sistemáticamente atribuciones académicas falsas, porcentajes precisos sin sustento, costos en pesos inventados y, ocasionalmente, atribuye datos incorrectos a figuras históricas reales.

**Causa**: el prompt original exigía "1+ nombre propio real + 1+ dato numérico concreto" como NO NEGOCIABLE por cada sección h2. Con 7-9 secciones por artículo, el modelo era forzado a inventar 7-9 estudios cuando no tenía conocimiento real.

**Estado del fix**: el prompt en `scripts/generate-post.js` ya fue endurecido (sin commitear al 2026-05-22). Falta limpiar los artículos publicados con el prompt viejo.

**Alcance detectado**: ~50 archivos HTML en `articulos/` tienen al menos un patrón sospechoso. Los 2 archivos que se leyeron completos (`biznaga`, `el-renacer-de-la-tierra`) tienen 10-15 atribuciones falsas cada uno.

---

## Qué está inventado

### A) Inventado con alta confianza

- Nombres de investigadores/as + institución mexicana real (UNAM, IPN, Cinvestav, UAM, UAEM, BUAP, UAQ, UAGro, Conabio, INAH, INIFAP, Conacyt/Conahcyt, CIBNOR, Ecosur, Chapingo).
- Porcentajes precisos atribuidos a un estudio concreto ("63% de inhibición", "47% de descenso", "92% polinizadas").
- Costos en pesos atribuidos a un programa, taller, vivero o producto específico.
- Estudios con año + revista atribuida ("en 2017, la Dra. X publicó en Ocean and Coastal Research…").
- Medidas experimentales muy precisas ("53 transectos de 100 m", "1,335 m de pozo", "1.2 m entre plantas").
- Citas directas entre comillas atribuidas a investigadores fabricados.

### B) Ficcionalización narrativa (autorizada por el prompt, pero el lector no lo sabe)

- Personajes-escena de apertura: don Chuy de San Gregorio Atlapulco, doña Remedios, María Luisa de Villa de la Paz, don Ezequiel, etc. Son **composites arquetípicos** explícitamente permitidos por la regla 1 del prompt ("persona de la escena debe ser un composite anónimo arquetípico"). No son investigadores ni fuentes.
- Riesgo: el lector promedio cree que son personas reales entrevistadas.

### C) Probablemente real pero NO verificado

- Datos biológicos generales (mecanismos de polinización, fisiología vegetal).
- Nombres científicos binomiales en `<em>` (generalmente correctos).
- Coordenadas geográficas, altitudes, datos climatológicos generales.
- Hechos históricos clave bien documentados (Molina Nobel 1995, Rivera en SEP 1922-1928, prehispanidad de la meliponicultura).
- Normas oficiales mencionadas por nombre (NOM-059-SEMARNAT-2010 existe, pero las cifras dentro pueden estar contaminadas).

### D) Riesgo mixto (real + invención mezclados)

- Conabio/SEMARNAT/INEGI mencionadas + cifra específica de población.
- Procedimientos técnicos (los pasos pueden ser correctos, pero tiempos/temperaturas/proporciones específicas pueden ser inventadas).
- Figuras históricas reales con atribuciones incorrectas (afiliación equivocada, año mal, técnica mal asignada).

---

## Lotes detectados

### Lote A — Investigador inventado con cita y/o institución

| # | Slug | Cita inventada |
|---|---|---|
| 1 | `cuando-la-selva-alimenta-la-cosecha-oculta-de-los-frutos-mayas` | "investigadora Mireya Dávalos" |
| 2 | `cuando-los-armadillos-cruzaron-el-istmo-la-migracion-secreta-que-cambio-las-americas` | "bióloga Laura Ramírez, Universidad Autónoma de Nayarit" |
| 3 | `bioconstruccion-tecnicas-sostenibles-con-tierra` | "ingeniero José Alfredo Hernández" |
| 4 | `el-pais-donde-el-atole-nunca-sabe-igual-dos-veces-cronica-sensorial-de-mas-de-50-recetas-en-cada-estado` | "antropólogo Jesús Ruiz" |
| 5 | `el-arte-del-pan-de-la-masa-madre-al-pan-de-muerto` | "antropólogo Jesús Vargas de la BUAP" |
| 6 | `el-secreto-inflamable-de-la-biznaga-cactus-que-curan-mas-alla-del-desierto` | "Dr. Martínez, Gaceta UNAM" (apellido solo, alarmante) + ~14 atribuciones adicionales en el mismo archivo |
| 7 | `el-dia-que-taxco-huele-a-cilantro-vivo-la-invasion-de-los-jumiles-comestibles` | "biólogo Rafael Vázquez, UAGro" |
| 8 | `la-grieta-que-devora-la-milpa-como-revivir-un-suelo-que-parece-perdido` | "ingeniero agrónomo Cristóbal Zamudio, comunidades tenek" |
| 9 | `la-cosecha-invisible-dentro-de-la-raiz-donde-nacen-los-escamoles` | "bióloga Erika Lemus, Museo de Historia Natural" |
| 10 | `la-costa-imposible-fractales-mandelbrot-y-el-secreto-geometrico-de-la-naturaleza` | "físico Jorge Reyes" |
| 11 | `la-selva-que-habla-ayahuasca-moleculas-y-visiones-en-la-amazonia` | "antropóloga Claudia López, UNMSM" |
| 12 | `noticias-verdes-restauracion-y-polinizadores` | "investigadora Gabriela Sánchez, Inst. Ecología UNAM" |
| 13 | `el-renacer-de-la-tierra-polinizadores-y-humedales-en-la-restauracion-ecologica` | "Luz María Romero del IPN, 2019" + ~10 atribuciones adicionales |
| 14 | `como-predecir-el-tamano-de-una-ola-con-solo-una-cuerda-y-un-cronometro-en-zihuatanejo` | "Laura Zamora López, 2017, Ocean and Coastal Research" |
| 15 | `psicodelicos-sagrados-en-la-medicina-ancestral` | "biólogo Salvador Flores (Conabio), 2020" |
| 16 | `la-polinizacion-del-maguey-por-murcielagos-magueyeros-un-ejemplo-de-coevolucion` | "bióloga Patricia Moreno, UNAM" |
| 17 | `por-que-los-fractales-se-esconden-en-los-helechos-y-el-brocoli-que-llevas-al-mercado` | "físico González Villarreal, Cinvestav" |
| 18 | `en-la-lengua-y-el-cerebro-el-picante-mexicano-medido-en-escalas-y-descifrado-por-neuronas` | "investigadora Silvia Hernández, Instituto…" |
| 19 | `patrones-de-turing-en-pieles-la-magia-de-las-manchas-del-jaguar-y-rayas-de-cebra` | "profesora Margarita Medina, Colegio…" |
| 20 | `humedales-urbanos-manual-de-bolsillo` | "Ing. Oscar Rojas de Isla Urbana" (Isla Urbana es real, persona dudosa) |

### Lote B — Figura real mal atribuida

| Slug | Problema |
|---|---|
| `teotihuacan-un-ejemplo-magistral-de-urbanismo-planificado-en-la-antiguedad` | Santiago Genovés era antropólogo (Ra II con Heyerdahl), no ingeniero, y nunca estudió cuantificación de cal en Teotihuacán. Atribución fuera de contexto. |

### Lote C — Costos en pesos micro-precisos atribuidos

`cuando-los-armadillos-cruzaron-el-istmo`, `bajo-el-agua-arrecifes-que-respiran-historia`, `xoloitzcuintle-companero-prehispanico-y-guardian-del-mictlan`, `bambu-estructural`, `el-abrazo-verde-agroforesteria-y-sus-beneficios-en-el-territorio-mexicano`, `bioconstruccion-tecnicas-sostenibles-con-tierra`, **`agujeros-de-gusano-el-atajo-que-no-es-lo-que-einstein-imagino`** ("tarifas de acceso académico 2023, X pesos por hora" — totalmente inventado), `cosmologia-indigena-y-su-relevancia-en-la-espiritualidad-nahua`, `cadena-de-valor-del-maguey` (7 precios), `banco-de-semillas-de-svalbard-y-su-relevancia-para-mexico`, `aprovechamiento-del-agua-captacion-pluvial-y-humedales-artificiales` (7 precios), `ecologia-profunda-y-ecopsicologia`, `cuando-el-amaranto-fue-semilla-prohibida...`, `cuando-el-tiempo-se-estira-una-manana-en-la-montana-donde-la-gravedad-dobla-el-reloj` ("$250 pesos cada uno" para experimento relativista — inventado).

### Lote D — Probablemente legítimo (NO tocar sin verificar)

- `el-dia-que-un-banista-desnudo-grito-eureka-y-cambio-la-fisica-sin-querer` — Carlo Rovelli (físico real).
- `moronga-el-arte-oscuro-de-fermentar-sangre-y-tripas-en-mexico` — Cristina Barros (historiadora gastronómica mexicana real, verificar cita exacta).
- `la-sabiduria-de-los-insectos-comestibles-en-la-cultura-mexicana` — Julieta Ramos-Elorduy, 549 especies (entomofagista real, dato verdadero).
- `el-impacto-cosmico-de-chicxulub-fin-de-los-dinosaurios` — IODP 2016, 1,335 m (perforación real, dato público).
- `el-quimico-de-la-unam-que-olia-a-laboratorio-y-salvo-el-cielo` — sobre Mario Molina; las 13 menciones a UNAM probablemente son legítimas (verificar).

---

## Opciones de remediación

### A. Regenerar todos los artículos contaminados con el prompt nuevo (RECOMENDADO)

- Prerequisito: hacer 2-3 corridas piloto con el prompt endurecido (commiteado en `e4c3cdd`). Leer la salida y verificar que efectivamente ya no inventa estudios con la fórmula prohibida.
- Tiempo: 3-5 horas con rate limit de OpenAI.
- Trabajo humano: bajo (lanzar script + validar 3-5 muestras al final).
- Pro: salida limpia automática, coherente con el fix del prompt.
- Contra: las imágenes ya regeneradas en commits recientes (pop-art coherente) se mantienen si solo se regenera el HTML.

### Cálculo de costos (2026-05-22)

Modelos confirmados en `scripts/generate-post.js`:
- Texto principal: `gpt-4.1` ($2/M input, $8/M output)
- DIY: `gpt-4o` ($2.50/M input, $10/M output)
- Imagen: `gpt-image-1` a `1536×1024` (medium ~$0.04, high ~$0.17)

**Por artículo, solo regenerando TEXTO** (manteniendo la imagen ya regenerada):
- Input gpt-4.1: ~5,000 tokens × $2/M = $0.010
- Output gpt-4.1: ~4,500 tokens × $8/M = $0.036
- Input gpt-4o DIY: ~800 tokens × $2.50/M = $0.002
- Output gpt-4o DIY: ~1,000 tokens × $10/M = $0.010
- **Subtotal solo texto: ~$0.058 por artículo**

**Lista total a regenerar (sin duplicados): ~35 artículos**
- Lote A (investigador inventado): 20
- Lote B (Genovés): 1
- Lote C únicos no en A (costos en pesos): ~9
- Auto-publish reciente con prompt viejo (tepezcuintle, pirul, colores, luna): 4
- Lince: 1

**Totales:**
| Estrategia | 35 artículos | Cabe en $6? |
|---|---|---|
| **Solo texto (recomendada)** | **~$2.00 USD** | Sí, con margen |
| Texto + imagen medium | ~$3.50 USD | Sí |
| Texto + imagen high | ~$8.00 USD | No |

**Decisión 2026-05-22**: presupuesto del usuario es $6 USD. Procedemos con **solo texto** (~$2 USD, deja margen para retries y piloto). Imágenes se mantienen porque ya fueron regeneradas con pop-art coherente en commit `e10656f`.

### B. Regenerar solo los ~10 peores, dejar el resto con disclaimer

Foco en: biznaga, el-renacer-de-la-tierra, fractales-helechos, fractales-mandelbrot, ayahuasca, picante-cerebro, turing-pieles, ola-zihuatanejo, agujeros-de-gusano, cuando-el-tiempo-se-estira.

Para los demás, agregar al footer del artículo o globalmente un disclaimer tipo "borrador automatizado generado por IA, las citas pueden requerir verificación".

### C. Edición quirúrgica a mano

Solo quitar atribuciones explícitas (Dr./Dra. + apellido + institución). Las cifras y porcentajes quedan flotando sin atribución (mejora pero no resuelve). Tiempo: días de trabajo humano. No recomendado dada la saturación.

---

## Próximos pasos sugeridos

1. **Agregar a `scripts/generate-post.js` un modo `--regenerate-content <slug>`** que tome un artículo existente, use su `topic` guardado en `posts.json`, regenere solo el HTML con el prompt nuevo, y sobreescriba sin tocar la imagen ni la entrada de `posts.json`.
2. **Piloto de 2-3 artículos** con presupuesto ~$0.20. Leer la salida y verificar que el prompt nuevo (ya commiteado en `e4c3cdd`) efectivamente ya no inventa estudios. Si falla, ajustar el prompt antes de seguir.
3. **Regenerar los 35 en batches de 5-7** (rate limit). Presupuesto total: ~$2 USD.
4. **Validar 3-5 muestras al final** con grep del patrón de invención.
5. Verificar también figuras históricas reales (Marker, Pasteur, Molina, Rivera) por si quedan datos incorrectos después de regenerar.

## Hallazgo verificado vía WebSearch (2026-05-22)

Cita "Dra. Patricia Anaya, Universidad Autónoma de Campeche, 2020, 18 tepezcuintles capturados" en el artículo del tepezcuintle: **fabricación confirmada**. Búsqueda web no encontró ningún rastro de esa persona en ese rol. La UAC sí tiene investigación de fauna silvestre (CEDESU/LEFS) — eso es precisamente lo que vuelve la fabricación peligrosa: la institución existe y es plausible. La investigación real sobre tepezcuintles en México está en Selva Lacandona, Chiapas, no en Campeche.

## Ejecución de la remediación (2026-05-22)

**Estado: COMPLETADA.** Se regeneraron 38 artículos en 4 batches con el prompt endurecido (commit `e4c3cdd`), usando el nuevo modo `--regen <slug>` del script (solo HTML, mantiene imagen, mantiene fecha original, mantiene tag y slug).

### Modificación al script (`scripts/generate-post.js`)
- Nuevo flag CLI `--regen <slug>`: busca la entrada en `posts.json`, conserva `topic`/`tag`/`date`/`url`/`cover`/`imageStyle` originales, y regenera solo HTML+DIY con el prompt nuevo.
- Fallback de topic: artículos antiguos que no tenían campo `topic` (los originales pre-pipeline) usan el `title` como tema. El campo `topic` se guarda en la entrada al regenerar para futuros usos.
- Helper `parseFechaMxToIso("21 de mayo de 2026")` → `"2026-05-21"` para conservar la fecha ISO en el HTML.

### Resumen de batches
- Piloto (2): `bioconstruccion-tecnicas-sostenibles-con-tierra`, `el-secreto-inflamable-de-la-biznaga`
- Batch 1 (7): cuando-la-selva-alimenta, cuando-los-armadillos, el-pais-donde-el-atole, el-arte-del-pan, el-dia-que-taxco, la-grieta-que-devora-la-milpa, la-cosecha-invisible
- Batch 2 (8): la-costa-imposible-fractales, la-selva-que-habla-ayahuasca, noticias-verdes, el-renacer-de-la-tierra, como-predecir-ola-zihuatanejo, psicodelicos-sagrados, la-polinizacion-del-maguey, por-que-los-fractales-helechos
- Batch 3 (11): picante-cerebro, patrones-de-turing, humedales-urbanos, teotihuacan, bambu-estructural, bajo-el-agua-arrecifes, xoloitzcuintle, agujeros-de-gusano, cadena-de-valor-del-maguey, banco-svalbard, ecologia-profunda
- Batch 4 (10): cuando-el-amaranto, cuando-el-tiempo-se-estira, el-abrazo-verde-agroforesteria, aprovechamiento-del-agua, cosmologia-indigena, tepezcuintle, pirul, colores-que-respiran, luna-milpa-oaxaca, lince

### Validación post-regeneración
Grep en todos los HTML:
- Patrón "(según|explica|afirma) + (Dr.|investigador|bióloga…) + Nombre Apellido": **2 matches restantes**, ambos en el Lote D (figuras reales que decidimos no tocar):
  - `moronga`: "investigadora Cristina Barros" — historiadora gastronómica mexicana real.
  - `el-dia-que-un-banista-desnudo-grito-eureka`: "físico Carlo Rovelli" — físico italiano real.
- Patrón "En año + equipo Nombre Apellido": **2 matches restantes**, ambos en el Lote D:
  - `chicxulub`: "En 2016, el equipo internacional IODP" — perforación verificable.
  - `insectos-comestibles`: "En 2023, el equipo de la UNAM liderado por Julieta Ramos-Elorduy publicó que 549 especies…" — investigadora real, dato verdadero.
- Ningún artículo regenerado conserva el patrón fabricador.

### Costo real estimado
38 artículos × ~$0.058 = **~$2.20 USD** (dentro del presupuesto de $6).

### Pendientes / próximas sesiones
- Eventualmente verificar si quedan otras atribuciones a figuras reales con datos incorrectos (regla c++ del prompt). El grep no las detecta porque suelen ser declarativas, no con verbos de cita. Requiere lectura manual o pasada de fact-checking dirigida.
- Actualizar `CLAUDE.md` para reflejar el nuevo flag `--regen` del script (no es prioritario).

## Convenciones a respetar al regenerar

Ver `CLAUDE.md` para reglas de slug, estructura de carpetas, og:image y rutas relativas. El prompt nuevo (`scripts/generate-post.js`, ya con los cambios sin commitear) tiene las reglas anti-invención endurecidas:

- Dato numérico **opcional**, no obligatorio.
- Ancla geográfica/biológica verificable + detalle sensorial = obligatorio por sección h2.
- Citas directas opcionales y con lista blanca de figuras reales conocidas (Molina 1995, Turlings 1990, Margulis 1967, Miramontes, Rivera).
- Autochequeo prioriza "¿inventaste un estudio?" como primera verificación.
