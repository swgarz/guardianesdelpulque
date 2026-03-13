const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// ── CSS para inyectar en el bloque <style> de cada artículo ───────────────
const DIY_CSS = `
    /* DIY SECTION */
    .diy-section{
      margin:2rem 0;padding:1.4rem 1.6rem;border-radius:16px;
      background:rgba(5,150,105,.06);border:2px solid rgba(5,150,105,.25);
    }
    .diy-section h2{margin:0 0 .8rem;font-size:1.15rem;color:#065f46;}
    .diy-section h3{margin:.8rem 0 .4rem;font-size:.95rem;color:#0f172a;font-weight:700;}
    .diy-section p{margin:0 0 .7rem;font-size:.92rem;color:#374151;}
    .diy-section ul,.diy-section ol{margin:0 0 .8rem 1.2rem;font-size:.92rem;color:#374151;}
    .diy-section li{margin-bottom:.3rem;}`;

// ── Contenido DIY por artículo (keyed por fragmento único de la URL) ──────
const DIY = {
  "fermentos-tradicionales-mexicanos-sabores-que-sanan": {
    title: "Haz tepache de piña en casa",
    intro: "El tepache es una de las bebidas fermentadas más fáciles y deliciosas. Solo necesitas la cáscara de una piña madura, piloncillo y agua. En dos días tienes una bebida probiótica lista.",
    materials: [
      "Cáscaras y corazón de 1 piña madura",
      "250 g de piloncillo o azúcar mascabado",
      "2 litros de agua",
      "2 rajas de canela",
      "5 clavos de olor",
      "Frasco de vidrio de 3 litros o olla de barro",
      "Manta de cielo",
    ],
    steps: [
      "Lava muy bien la piña con agua y un cepillo antes de pelarla.",
      "Coloca las cáscaras y el corazón en el frasco. Agrega el piloncillo, la canela y los clavos.",
      "Vierte los 2 litros de agua a temperatura ambiente. Si es agua de llave, déjala reposar 30 minutos para evaporar el cloro.",
      "Cubre con manta de cielo y asegura con una liga. No tapes herméticamente.",
      "Deja fermentar a temperatura ambiente (22–28 °C) durante 48 horas. Verás burbujas activas a las 24 horas.",
      "Cuela, refrigera y consume en los siguientes 3 días. Cuanto más tiempo pase, más ácido y alcohólico será.",
    ],
    tip: "Si el tepache queda muy dulce, fue poco tiempo. Si queda muy ácido, fue demasiado. Ajusta las horas de fermentación a tu gusto. Puedes reusar las cáscaras una segunda vez con nueva agua y la mitad del piloncillo.",
  },

  "aprovechamiento-del-agua-captacion-pluvial": {
    title: "Instala un sistema básico de captación pluvial",
    intro: "Con materiales de ferretería y un día de trabajo puedes desviar el agua de lluvia de tu techo a una cisterna. Un techo de 50 m² puede captar hasta 30,000 litros al año en zonas con lluvias moderadas.",
    materials: [
      "Canal de PVC de 4 pulgadas (largo según tu techo)",
      "Bajante de PVC de 4 pulgadas",
      "Filtro 'first flush' (desvío de primeras lluvias, en ferretería o hecho con codos y tubo ciego)",
      "Tinaco o cisterna de 1,000–5,000 litros con tapa",
      "Malla anti-mosquitos para la entrada del tinaco",
      "Pegamento PVC, codos y soportes metálicos",
    ],
    steps: [
      "Mide el borde del techo donde instalarás la canal y corta el PVC a medida.",
      "Instala la canal con una inclinación de 1 cm por cada metro hacia el bajante.",
      "Conecta el bajante a un 'first flush': un tubo vertical que retiene los primeros 20 litros de lluvia (los más sucios) antes de desviar el agua limpia al tinaco.",
      "Conecta la salida del first flush al tinaco, cubre la entrada con malla anti-mosquitos.",
      "Llena con agua para probar fugas antes de la temporada de lluvias.",
      "En la primera lluvia, revisa que el flujo sea continuo y que el first flush funcione correctamente.",
    ],
    tip: "El agua captada es ideal para riego, limpieza y sanitarios. Para consumo humano necesita un filtro adicional de carbón activado y desinfección con cloro o luz UV.",
  },

  "maguey-usos-y-beneficios": {
    title: "Extrae fibra de ixtle del maguey",
    intro: "Las pencas del maguey contienen fibras resistentes que puedes extraer para tejer, hacer cuerdas o artesanías. Solo necesitas una penca madura y algo de paciencia.",
    materials: [
      "1 penca de maguey adulto (evita las muy jóvenes)",
      "Cuchillo bien afilado",
      "Piedra plana o tabla de madera",
      "Agua",
      "Peine de dientes anchos o palito de madera",
    ],
    steps: [
      "Corta la penca con cuidado y retira las espinas de los bordes con el cuchillo.",
      "Golpea suavemente la penca sobre la piedra plana para ablandar la pulpa.",
      "Raspa la superficie con el filo del cuchillo en dirección a la punta para retirar la pulpa y dejar las fibras.",
      "Enjuaga las fibras con agua para retirar los restos de pulpa.",
      "Peina las fibras con el palito de madera hasta separar los hilos individuales.",
      "Tiende al sol durante 2 o 3 días hasta que sequen completamente. Las fibras listas son blancas y resistentes.",
    ],
    tip: "Una sola penca puede darte entre 50 y 200 gramos de ixtle. Las fibras secas se pueden torcer a mano para hacer hilo grueso o sogas delgadas.",
  },

  "bioconstruccion-tecnicas-sostenibles": {
    title: "Haz tu primer bloque de tierra cruda",
    intro: "No necesitas maquinaria ni materiales caros. Con tierra arcillosa, paja y agua puedes hacer bloques de tierra cruda para levantar muros, bancas de jardín o módulos de prueba.",
    materials: [
      "Tierra arcillosa (sin material orgánico visible)",
      "Paja seca picada (10–15 cm de largo)",
      "Agua",
      "Molde de madera (ej. 30×15×10 cm)",
      "Lona o plástico para mezclar",
    ],
    steps: [
      "Cierne la tierra para retirar piedras grandes y raíces.",
      "Mezcla 3 partes de tierra por 1 parte de paja seca sobre la lona.",
      "Agrega agua poco a poco mientras amasas con los pies o las manos hasta obtener una pasta firme que no se pegue ni se rompa.",
      "Llena el molde apretando bien la mezcla en las esquinas.",
      "Desmolda al día siguiente con cuidado y coloca el bloque a la sombra sobre una superficie plana.",
      "Deja secar al menos 3 semanas antes de usar. Voltea el bloque a la semana para un secado parejo.",
    ],
    tip: "Para saber si tu mezcla es buena, haz una bola del tamaño de un puño y déjala caer desde 1 metro. Si no se rompe, la proporción arcilla-paja es correcta.",
  },

  "la-milpa-agricultura": {
    title: "Siembra una milpa en maceta o jardín pequeño",
    intro: "Aunque no tengas campo, puedes experimentar la lógica de la milpa en un espacio pequeño. La combinación de maíz, frijol y calabaza funciona incluso en contenedores grandes.",
    materials: [
      "Semillas de maíz criollo",
      "Semillas de frijol negro o bayo",
      "Semillas de calabaza criolla",
      "Contenedor de al menos 60 cm de diámetro o cama de tierra",
      "Composta o tierra rica en materia orgánica",
    ],
    steps: [
      "Prepara la tierra mezclando 2 partes de tierra con 1 parte de composta.",
      "Siembra 3 o 4 semillas de maíz en el centro, a 3 cm de profundidad.",
      "Cuando el maíz tenga 20 cm de altura (2–3 semanas), siembra el frijol a 5 cm del tallo.",
      "Una semana después siembra la calabaza en el borde del contenedor.",
      "Riega cada 2–3 días. El maíz da soporte al frijol, el frijol fija nitrógeno y la calabaza cubre el suelo.",
      "Cosecha la calabaza primero, luego el frijol seco y finalmente las mazorcas cuando los pelos estén cafés.",
    ],
    tip: "Si tienes espacio en suelo, la distancia ideal entre matas de maíz es 50 cm. Puedes repetir el ciclo 2 veces al año en climas cálidos.",
  },

  "el-renacer-de-la-tierra": {
    title: "Crea un jardín de polinizadores",
    intro: "Un jardín de polinizadores atrae abejas, mariposas y colibríes con flores nativas. Puedes hacerlo en macetas agrupadas, en una cajuela o en un rincón del patio.",
    materials: [
      "Semillas o plantas de flores nativas: cempasúchil, lavanda, salvia, tagetes",
      "Tierra con composta",
      "Macetas o un área de tierra de al menos 1 m²",
      "Mulch o paja para cubrir el suelo",
      "Recipiente poco profundo con piedras para agua",
    ],
    steps: [
      "Elige un lugar con al menos 6 horas de sol al día.",
      "Prepara la tierra aflojándola y mezclando composta al 20%.",
      "Siembra flores de diferentes alturas y épocas de floración para tener flores todo el año.",
      "Planta en grupos de la misma especie (mínimo 3 plantas juntas) para que los polinizadores las encuentren fácil.",
      "Cubre el suelo con paja o mulch para conservar humedad y evitar maleza.",
      "Deja el recipiente con agua limpia y piedritas para que las abejas beban sin ahogarse. Cámbiala cada 2 días.",
    ],
    tip: "Evita insecticidas. Si hay plagas, usa agua con jabón o chile. La diversidad de insectos aumentará naturalmente en las primeras semanas.",
  },

  "el-pulque-tradicion": {
    title: "Prepara aguamiel fermentado en casa",
    intro: "El aguamiel fresco es la savia dulce del maguey antes de fermentar. Si consigues aguamiel en mercados o productores locales, puedes iniciar una fermentación sencilla en casa.",
    materials: [
      "1 litro de aguamiel fresco",
      "Frasco de vidrio de boca ancha (2 litros)",
      "Manta de cielo o tela para cubrir",
      "Liga o cuerda",
      "Cuchara de madera",
    ],
    steps: [
      "Vierte el aguamiel en el frasco de vidrio limpio.",
      "Cubre con manta de cielo y asegura con la liga. No uses tapa hermética.",
      "Coloca en un lugar cálido (20–28 °C) sin luz directa.",
      "Revuelve suavemente con la cuchara de madera una vez al día.",
      "A las 24–48 horas verás burbujas y olerás un aroma ligeramente ácido y afrutado: eso es el pulque joven.",
      "Cuela y consume frío en los primeros 3 días. Pasado ese tiempo se vuelve más ácido y alcohólico.",
    ],
    tip: "La temperatura determina la velocidad: en climas cálidos fermenta más rápido. El pulque listo tiene entre 2 y 6° de alcohol y se conserva refrigerado máximo 2 días.",
  },

  "delapencaaljarro": {
    title: "Fermenta pulque paso a paso",
    intro: "Si tienes acceso a aguamiel fresco de un productor, puedes hacer tu propio pulque siguiendo los pasos del tlachiquero adaptados a escala doméstica.",
    materials: [
      "2 litros de aguamiel fresco",
      "Recipiente de barro o frasco de vidrio de 3 litros",
      "½ taza de madre de pulque (pulque ya fermentado)",
      "Manta de cielo",
    ],
    steps: [
      "Consigue aguamiel lo más fresco posible: úsalo el mismo día de la extracción.",
      "Añade la madre de pulque al recipiente limpio. Sin madre el aguamiel solo también fermenta, pero tardará más.",
      "Vierte el aguamiel sobre la madre y mezcla suavemente.",
      "Cubre con manta de cielo y deja en lugar cálido (22–28 °C) sin luz directa.",
      "A las 8–12 horas comenzará a burbujear. Revuelve una vez al día.",
      "A las 24–36 horas tendrás pulque fresco con textura ligeramente viscosa y sabor agridulce. Cuela y refrigera.",
    ],
    tip: "Reserva siempre ½ taza del pulque que hagas para usarla como madre en la siguiente tanda. Así mantienes viva la comunidad de microorganismos.",
  },

  "guiadeadobe": {
    title: "Haz tus propios adobes",
    intro: "El adobe es uno de los materiales de construcción más accesibles del mundo. Solo necesitas tierra, agua, paja y un molde sencillo para producir tus primeros bloques.",
    materials: [
      "Tierra arcillosa (sin materia orgánica visible)",
      "Paja seca picada o zacate",
      "Agua",
      "Molde de madera (30×15×10 cm o 40×20×10 cm)",
      "Plástico o lona para mezclar",
      "Tabla plana para secar",
    ],
    steps: [
      "Prueba tu tierra: humedécela y amasa una bola; si mantiene la forma sin cuartearse, tiene suficiente arcilla.",
      "Mezcla en proporción 4:1 tierra y paja. Agrega agua poco a poco hasta obtener barro espeso.",
      "Moja el molde para que el adobe no se pegue. Llénalo apretando bien y enrasando la superficie.",
      "Desmolda después de 24 horas con cuidado y coloca los bloques a la sombra.",
      "Voltea los bloques a los 5 días para que sequen parejos. Evita el sol directo la primera semana.",
      "Los adobes están listos en 3 a 4 semanas: suenan hueco al golpearlos.",
    ],
    tip: "Puedes añadir un 5% de cal apagada a la mezcla para aumentar la resistencia al agua. Una persona puede hacer 50–80 adobes al día trabajando a mano.",
  },

  "microbiotadelpulque": {
    title: "Observa la microbiota del pulque en casa",
    intro: "No necesitas microscopio para aprender sobre los microorganismos del pulque. Con una fermentación controlada puedes observar sus etapas y señales visibles.",
    materials: [
      "½ litro de pulque fresco o aguamiel",
      "Frasco de vidrio transparente de 1 litro",
      "Termómetro de cocina",
      "Manta de cielo",
      "Cuaderno para anotar observaciones",
    ],
    steps: [
      "Vierte el pulque o aguamiel en el frasco limpio y cubre con manta de cielo.",
      "Coloca a temperatura constante (22–26 °C) y anota la temperatura inicial.",
      "Cada 8 horas observa: anota color, olor, presencia de burbujas y textura.",
      "A las 12–24 horas notarás burbujas activas de CO₂: fase de fermentación acelerada por levaduras.",
      "A las 36–48 horas el burbujeo disminuye y la textura se vuelve ligeramente viscosa: bacterias lácticas al mando.",
      "Prueba una cucharada en cada etapa: dulce → agridulce → ácido es la progresión normal.",
    ],
    tip: "Si aparece una capa rosada o naranja en la superficie, es contaminación: desecha ese lote. El pulque sano siempre huele a fermento ácido-afrutado, nunca a podrido o a acetona.",
  },

  "noticias-verdes-restauracion": {
    title: "Instala una estación de polinizadores en tu espacio",
    intro: "Puedes crear un refugio para abejas y mariposas en un balcón, azotea o jardín con materiales simples y plantas fáciles de conseguir.",
    materials: [
      "3–5 macetas de al menos 20 cm",
      "Tierra con composta",
      "Plantas nativas: lavanda, tomillo, cempasúchil, salvia roja",
      "Trozo de madera con agujeros de 3–8 mm (hotel de abejas solitarias)",
      "Recipiente poco profundo para agua con piedritas",
    ],
    steps: [
      "Coloca las macetas en el lugar más soleado disponible (mínimo 4 horas de sol).",
      "Siembra o trasplanta las plantas nativas agrupando la misma especie en cada maceta.",
      "Cuelga el trozo de madera perforado en un lugar protegido de la lluvia a 1–1.5 metros de altura.",
      "Pon el recipiente con agua y piedritas para que los insectos beban sin ahogarse.",
      "Riega temprano por la mañana para no mojar las flores durante el día.",
      "Observa y anota qué insectos visitan tus plantas. La diversidad aumentará con el tiempo.",
    ],
    tip: "Evita insecticidas. Si debes usar jabón potásico, aplícalo de noche cuando las abejas no están activas y enjuaga las plantas al día siguiente.",
  },

  "humedales-urbanos": {
    title: "Construye un mini humedal en cajones",
    intro: "Un humedal doméstico en cajones puede filtrar el agua gris del lavabo, humidificar el ambiente y crear hábitat para insectos benéficos. Solo necesitas tres cajas y plantas acuáticas.",
    materials: [
      "3 cajones o macetas grandes (50 litros cada uno)",
      "Grava gruesa (capa de 5 cm)",
      "Arena de río (capa de 5 cm)",
      "Tierra negra o composta (capa de 10 cm)",
      "Plantas acuáticas: tule, papiro, menta acuática",
      "Manguera o tubo PVC de ½ pulgada para conectar los cajones",
    ],
    steps: [
      "Coloca el primer cajón en el nivel más alto: será la entrada del agua.",
      "Pon capas de grava, arena y tierra en cada cajón (de abajo hacia arriba).",
      "Conecta los cajones con la manguera para que el agua fluya por gravedad de uno al siguiente.",
      "Planta las especies acuáticas en el segundo y tercer cajón.",
      "Vierte agua del lavabo o agua de lluvia por el primer cajón y observa cómo fluye filtrándose.",
      "Después de 2 semanas las plantas habrán creado biofilm filtrante. El agua de salida servirá para regar.",
    ],
    tip: "Las plantas de humedal crecen rápido. Poda cada mes para mantener el flujo y compostar los recortes. En 6 meses el sistema será autosuficiente.",
  },

  "bambu-estructural": {
    title: "Cura bambú para construcción en casa",
    intro: "El bambú sin curar se pudre y lo atacan gorgojos en pocos meses. Con este proceso sencillo puedes preparar cañas para muebles, cercos o estructuras que duren décadas.",
    materials: [
      "Cañas de bambú maduras (mínimo 3 años de edad)",
      "1 kg de bórax (borato de sodio)",
      "1 kg de ácido bórico",
      "Cubeta grande o tina",
      "10 litros de agua",
      "Plástico para cubrir",
    ],
    steps: [
      "Corta el bambú en luna menguante: tiene menos azúcares y es menos atractivo para insectos.",
      "Disuelve el bórax y el ácido bórico en 10 litros de agua caliente.",
      "Sumerge las cañas completas en la solución durante 72 horas. Cúbrelas con plástico para que no floten.",
      "Saca las cañas y colócalas verticalmente a la sombra para que drenen 24 horas.",
      "Seca horizontalmente en un lugar ventilado durante 4–6 semanas, rotando las cañas cada semana.",
      "El bambú curado tiene color uniforme y suena sólido al golpear: está listo para usar.",
    ],
    tip: "El bórax es de baja toxicidad, pero usa guantes y lentes. Las cañas bien curadas pueden durar más de 20 años en exterior si se les da mantenimiento.",
  },

  "polinizacion-del-maiz": {
    title: "Poliniza maíz criollo en tu huerto",
    intro: "Si cultivas maíz en espacios pequeños o quieres asegurar una buena polinización en variedades criollas, puedes ayudar al proceso a mano.",
    materials: [
      "Plantas de maíz en floración (espiga abierta y elotes con pelos visibles)",
      "Bolsa de papel pequeña",
      "Cinta adhesiva",
    ],
    steps: [
      "Espera a que la espiga principal tenga el polen visible (polvo amarillo que cae al sacudir).",
      "En la mañana temprano (antes de las 9 am), coloca una bolsa de papel sobre la espiga y sacúdela suavemente para colectar el polen.",
      "Lleva la bolsa con polen a cada elote: viértela directamente sobre los pelos del elote.",
      "Repite con 3–5 plantas para mezclar el material genético y favorecer la diversidad.",
      "Hazlo durante 3–5 días consecutivos mientras dure la floración.",
      "Dos meses después tendrás mazorcas llenas con granos bien formados hasta las puntas.",
    ],
    tip: "Guarda siempre semilla de tus mejores mazorcas: las más llenas, de plantas sanas. Así preservas el acervo genético criollo para las siguientes generaciones.",
  },

  "suelos-vivos": {
    title: "Haz composta en casa",
    intro: "La composta es el abono más nutritivo que puedes darle a tus plantas y es prácticamente gratis. Con cáscaras y restos de cocina transformas basura orgánica en tierra fértil en 2–3 meses.",
    materials: [
      "Cajón de madera, cubeta o rincón de tierra de al menos 50×50 cm",
      "Restos verdes: cáscaras de fruta y verdura, posos de café, cáscaras de huevo",
      "Restos cafés: cartón seco, hojas secas, papel periódico picado",
      "Un puñado de tierra de jardín por semana",
      "Palo para revolver",
    ],
    steps: [
      "Alterna capas de material verde (húmedo) y café (seco) en proporción 1:2.",
      "Humedece ligeramente si está muy seco: debe sentirse como una esponja exprimida.",
      "Revuelve toda la pila una vez por semana para oxigenar.",
      "Agrega un puñado de tierra de jardín cada semana: aporta los microorganismos que descomponen.",
      "A las 4–6 semanas el material del fondo se vuelve oscuro con olor a tierra de bosque.",
      "A los 2–3 meses tendrás composta lista: oscura, homogénea, sin reconocer los materiales originales.",
    ],
    tip: "Nunca metas carnes, lácteos, aceites ni excrementos de mascotas. Las cáscaras de cítrico en exceso acidifican la composta; úsalas en poca cantidad.",
  },

  "tierra-compactada-btc": {
    title: "Fabrica un BTC (bloque de tierra comprimida) a mano",
    intro: "Con un molde de madera y un pisón puedes fabricar bloques de tierra comprimida resistentes para muros, bancas o escalones. No se necesita horno ni maquinaria.",
    materials: [
      "Tierra con 15–20% de arcilla",
      "Cal apagada al 5–8% del volumen de tierra",
      "Agua (15–18% del peso total)",
      "Molde de madera reforzado o prensa CINVA-Ram",
      "Pisón de madera o metal",
    ],
    steps: [
      "Cierne la tierra para retirar piedras mayores de 1 cm.",
      "Mezcla en seco la tierra y la cal hasta obtener un color uniforme.",
      "Agrega agua poco a poco hasta que al apretar un puñado forme una bola que no se desmenuce ni manche.",
      "Llena el molde y comprime con el pisón en capas de 5 cm hasta completar.",
      "Desmolda inmediatamente: el BTC mantiene su forma gracias a la compresión.",
      "Cura los bloques a la sombra durante 28 días, humedeciéndolos cada 2 días la primera semana.",
    ],
    tip: "Un BTC bien hecho resiste más de 20 kg/cm². Para probarlo antes de construir, déjalo 7 días y golpéalo con un martillo: si no se agrieta, la mezcla es buena.",
  },

  "cadena-de-valor-del-maguey": {
    title: "Raspa tu propio maguey para obtener aguamiel",
    intro: "Si tienes acceso a un maguey adulto (8–12 años) que esté por echar quiote, puedes raspar el corazón para obtener aguamiel fresco y hacer pulque o beberlo como bebida nutritiva.",
    materials: [
      "1 maguey adulto listo para raspar",
      "Raspador (raspino) o cuchillo curvo",
      "Acocote o guaje grande para extraer",
      "Recipiente limpio con tapa",
      "Lienzo para cubrir el cajete",
    ],
    steps: [
      "Identifica el maguey listo: las pencas centrales se aflojan y el corazón es accesible.",
      "Con el raspino, corta y retira las pencas centrales hasta exponer el cajete (cavidad central).",
      "Raspa el fondo del cajete con movimientos circulares para estimular la savia.",
      "Cubre el cajete con el lienzo para evitar insectos. Espera 24 horas.",
      "Extrae el aguamiel acumulado con el acocote o con un vaso largo. Puedes obtener entre 1 y 5 litros diarios.",
      "Raspa el cajete cada día antes de extraer para mantener el flujo. Un maguey da aguamiel entre 3 y 6 meses.",
    ],
    tip: "El aguamiel extraído por la mañana es el más dulce. Consúmelo el mismo día o refrigéralo máximo 2 días antes de que inicie la fermentación espontánea.",
  },
};

// ── Función para construir el HTML de la sección DIY ──────────────────────
function buildDIYSection(data) {
  const materials = data.materials.map((m) => `<li>${m}</li>`).join("\n        ");
  const steps = data.steps.map((s) => `<li>${s}</li>`).join("\n        ");
  return `
    <section class="diy-section">
      <h2>🛠️ Hazlo tú mismo</h2>
      <h3>${data.title}</h3>
      <p>${data.intro}</p>
      <h3>Materiales</h3>
      <ul>
        ${materials}
      </ul>
      <h3>Paso a paso</h3>
      <ol>
        ${steps}
      </ol>
      <div class="highlight">💡 ${data.tip}</div>
    </section>`;
}

// ── Buscar la clave DIY que coincida con la ruta del artículo ─────────────
function findDIYKey(url) {
  for (const key of Object.keys(DIY)) {
    if (url.includes(key)) return key;
  }
  return null;
}

// ── Procesar todos los artículos ──────────────────────────────────────────
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, "posts.json"), "utf-8"));
let updated = 0;
let skipped = 0;

for (const post of posts) {
  const htmlPath = path.join(ROOT, post.url);
  if (!fs.existsSync(htmlPath)) {
    console.log(`SKIP (no existe): ${post.url}`);
    skipped++;
    continue;
  }

  const key = findDIYKey(post.url);
  if (!key) {
    console.log(`SKIP (sin DIY definido): ${post.url}`);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(htmlPath, "utf-8");

  // Evitar duplicar la sección si ya existe
  if (html.includes("diy-section")) {
    console.log(`SKIP (ya tiene DIY): ${post.url}`);
    skipped++;
    continue;
  }

  // 1. Agregar CSS al bloque <style>
  html = html.replace("</style>", DIY_CSS + "\n  </style>");

  // 2. Insertar sección DIY antes del CTA
  const diyHTML = buildDIYSection(DIY[key]);
  html = html.replace("    <!-- CTA SUSCRIPCIÓN -->", diyHTML + "\n\n    <!-- CTA SUSCRIPCIÓN -->");

  fs.writeFileSync(htmlPath, html, "utf-8");
  console.log(`OK: ${post.url}`);
  updated++;
}

console.log(`\nActualizados: ${updated} | Omitidos: ${skipped}`);
