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

- Prerequisito: hacer 2-3 corridas piloto con el prompt endurecido (`scripts/generate-post.js` ya tiene los cambios sin commitear). Leer la salida y verificar que efectivamente ya no inventa estudios con la fórmula prohibida.
- Costo estimado: ~$5-8 USD (gpt-4o-mini + gpt-image-1 para portada si se regenera también).
- Tiempo: 3-5 horas con rate limit de OpenAI.
- Trabajo humano: bajo (lanzar script + validar 3-5 muestras al final).
- Pro: salida limpia automática, coherente con el fix del prompt.
- Contra: las imágenes ya regeneradas en commits recientes (pop-art coherente) se mantienen si solo se regenera el HTML.

### B. Regenerar solo los ~10 peores, dejar el resto con disclaimer

Foco en: biznaga, el-renacer-de-la-tierra, fractales-helechos, fractales-mandelbrot, ayahuasca, picante-cerebro, turing-pieles, ola-zihuatanejo, agujeros-de-gusano, cuando-el-tiempo-se-estira.

Para los demás, agregar al footer del artículo o globalmente un disclaimer tipo "borrador automatizado generado por IA, las citas pueden requerir verificación".

### C. Edición quirúrgica a mano

Solo quitar atribuciones explícitas (Dr./Dra. + apellido + institución). Las cifras y porcentajes quedan flotando sin atribución (mejora pero no resuelve). Tiempo: días de trabajo humano. No recomendado dada la saturación.

---

## Próximos pasos sugeridos

1. **Antes de cualquier acción**: validar el prompt nuevo con 2-3 corridas piloto. Si no pasa la validación, ajustar el prompt y commitear el fix de `scripts/generate-post.js`.
2. Decidir opción A vs B (C ya no recomendada).
3. Si A: agregar a `scripts/generate-post.js` un modo `--regenerate-content` que tome un slug existente y regenere solo el HTML (preservando portada y entrada en `posts.json`).
4. Ejecutar regeneración del lote A (20 archivos) en batches de 5.
5. Validar 3-5 muestras al final.
6. Continuar con lote B y lote C según resultados.

## Convenciones a respetar al regenerar

Ver `CLAUDE.md` para reglas de slug, estructura de carpetas, og:image y rutas relativas. El prompt nuevo (`scripts/generate-post.js`, ya con los cambios sin commitear) tiene las reglas anti-invención endurecidas:

- Dato numérico **opcional**, no obligatorio.
- Ancla geográfica/biológica verificable + detalle sensorial = obligatorio por sección h2.
- Citas directas opcionales y con lista blanca de figuras reales conocidas (Molina 1995, Turlings 1990, Margulis 1967, Miramontes, Rivera).
- Autochequeo prioriza "¿inventaste un estudio?" como primera verificación.
