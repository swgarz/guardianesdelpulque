const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const OpenAI = require("openai");
const sharp = require("sharp");

const openai = new OpenAI();
const IMAGE_WIDTH = 912;
const SITE_URL = "https://guardianesdelpulque.org";

// Detecta y recorta franjas planas de color sólido EN LOS BORDES (paletas, marcos
// monocromáticos, columnas/filas de bloques apilados de color) que DALL-E inserta
// a veces y que sharp.trim() no quita porque no rodean toda la imagen.
//
// Dos heurísticas combinadas — una columna/fila es "borde a recortar" si:
//   (a) su desviación estándar de color es muy baja (< stdThreshold) — banda monocroma, o
//   (b) es "piecewise-constant": al recorrerla, la mayoría de píxeles tienen un
//       vecindario lateral pequeño (5px) muy plano (std local < localStdThreshold).
//       Esto detecta paletas verticales/horizontales de bloques de color apilados.
async function cropFlatBorders(buffer, { stdThreshold = 10, maxFraction = 0.18, localStdThreshold = 6, localFlatFrac = 0.85, localWin = 2 } = {}) {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const colStd = (x) => {
    let sR=0,sG=0,sB=0;
    for (let y=0;y<height;y++){const i=(y*width+x)*channels;sR+=data[i];sG+=data[i+1];sB+=data[i+2];}
    const mR=sR/height,mG=sG/height,mB=sB/height;
    let v=0;
    for (let y=0;y<height;y++){const i=(y*width+x)*channels;const dR=data[i]-mR,dG=data[i+1]-mG,dB=data[i+2]-mB;v+=dR*dR+dG*dG+dB*dB;}
    return Math.sqrt(v/height);
  };
  const rowStd = (y) => {
    let sR=0,sG=0,sB=0;
    for (let x=0;x<width;x++){const i=(y*width+x)*channels;sR+=data[i];sG+=data[i+1];sB+=data[i+2];}
    const mR=sR/width,mG=sG/width,mB=sB/width;
    let v=0;
    for (let x=0;x<width;x++){const i=(y*width+x)*channels;const dR=data[i]-mR,dG=data[i+1]-mG,dB=data[i+2]-mB;v+=dR*dR+dG*dG+dB*dB;}
    return Math.sqrt(v/width);
  };
  const colLocalFlat = (x) => {
    const lo = Math.max(0, x - localWin), hi = Math.min(width - 1, x + localWin);
    const n = hi - lo + 1;
    let flat = 0;
    for (let y=0; y<height; y++) {
      let sR=0,sG=0,sB=0;
      for (let xi=lo; xi<=hi; xi++) { const i=(y*width+xi)*channels; sR+=data[i]; sG+=data[i+1]; sB+=data[i+2]; }
      const mR=sR/n, mG=sG/n, mB=sB/n;
      let v=0;
      for (let xi=lo; xi<=hi; xi++) { const i=(y*width+xi)*channels; const dR=data[i]-mR,dG=data[i+1]-mG,dB=data[i+2]-mB; v+=dR*dR+dG*dG+dB*dB; }
      if (Math.sqrt(v/n) < localStdThreshold) flat++;
    }
    return flat / height;
  };
  const rowLocalFlat = (y) => {
    const lo = Math.max(0, y - localWin), hi = Math.min(height - 1, y + localWin);
    const n = hi - lo + 1;
    let flat = 0;
    for (let x=0; x<width; x++) {
      let sR=0,sG=0,sB=0;
      for (let yi=lo; yi<=hi; yi++) { const i=(yi*width+x)*channels; sR+=data[i]; sG+=data[i+1]; sB+=data[i+2]; }
      const mR=sR/n, mG=sG/n, mB=sB/n;
      let v=0;
      for (let yi=lo; yi<=hi; yi++) { const i=(yi*width+x)*channels; const dR=data[i]-mR,dG=data[i+1]-mG,dB=data[i+2]-mB; v+=dR*dR+dG*dG+dB*dB; }
      if (Math.sqrt(v/n) < localStdThreshold) flat++;
    }
    return flat / width;
  };
  const isBandCol = (x) => colStd(x) < stdThreshold || colLocalFlat(x) > localFlatFrac;
  const isBandRow = (y) => rowStd(y) < stdThreshold || rowLocalFlat(y) > localFlatFrac;
  const maxXTrim = Math.floor(width * maxFraction);
  const maxYTrim = Math.floor(height * maxFraction);
  let left=0;       while (left < maxXTrim && isBandCol(left)) left++;
  let right=width-1; while (width-1-right < maxXTrim && isBandCol(right)) right--;
  let top=0;        while (top < maxYTrim && isBandRow(top)) top++;
  let bottom=height-1; while (height-1-bottom < maxYTrim && isBandRow(bottom)) bottom--;
  const cropW = right - left + 1;
  const cropH = bottom - top + 1;
  if (cropW === width && cropH === height) return buffer;
  console.log(`  cropFlatBorders: L=${left} R=${width-1-right} T=${top} B=${height-1-bottom} -> ${cropW}x${cropH}`);
  return sharp(buffer).extract({ left, top, width: cropW, height: cropH }).toBuffer();
}

// Modelos: si la API rechaza gpt-4.1 en tu cuenta, cambia a "gpt-4o".
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";
const DIY_MODEL = process.env.OPENAI_DIY_MODEL || "gpt-4o";

// ── Temas ──────────────────────────────────────────────────────────────────
const TOPICS = [
  // TOPICS shuffled intentionally: picking is random, but the source order is also randomized so no category grouping is visible.
  "Hormonas vegetales, auxinas, giberelinas y citoquininas",
  "Leyendas de Quetzalcoatl, ciencia detras de los mitos",
  "Aguacate, grasas saludables y nutricion mexicana",
  "Cromosomas, telomeros y envejecimiento celular",
  "Microbioma intestinal y dieta milpa, fibra y fermentos para salud digestiva",
  "Polinizacion por palomas y aves frugivoras en arboles tropicales",
  "Vuelo de aves planeadoras, termales y aerodinamica de gran escala",
  "Agua, manantiales, derechos del agua, rios, acuiferos, gestion comunitaria del agua",
  "Ballena gris, migracion epica al Pacifico mexicano y avistamiento en Baja",
  "Volcanes mexicanos, fisica del magma y erupciones del Popocatepetl",
  "Ayuno intermitente, ciencia y tradiciones rituales",
  "Hongos psicodelicos, psilocibina y revolucion terapeutica",
  "Sapogeninas del maguey, fitoquimica del agave, esteroides naturales",
  "Manatíes como mantenedores de pastos marinos",
  "Levaduras del pan, ciencia de la fermentacion",
  "Moronga y embutidos mexicanos, fermentacion del intestino animal",
  "Pajaros lira que imitan sonidos, plasticidad vocal",
  "Curare amazonico, anestesico tradicional y origen",
  "Filotaxis, disposicion de hojas para maximizar luz, matematica de las plantas",
  "Vaquita marina, el mamifero mas pequeno y su extincion por redes pesqueras",
  "Hule natural de Castilla elastica y los juegos de pelota prehispanicos",
  "Termorregulacion en serpientes y reptiles, ectotermia y calor",
  "Saberes wixaritari, peyote, geografia sagrada y arte",
  "Ondas Belousov-Zhabotinsky en patrones biologicos, reacciones quimicas oscilantes",
  "Saberes purepecha, lago de Patzcuaro y agricultura lacustre",
  "Chiles y endorfinas, capsaicina, dolor y placer en la dieta",
  "Cenotes mayas, formacion karstica y agua subterranea de Yucatan",
  "Comunidad, asambleas comunitarias, tequio, usos y costumbres, organizacion indigena, gobernanza local",
  "Cristales y simetria, fisica del estado solido en la naturaleza",
  "Laguna de Bacalar y sus siete colores, estromatolitos y microbios arqueanos",
  "Tepezcuintle y dispersores tropicales en selvas mexicanas",
  "Voladores de Papantla, ceremonia totonaca al sol y la lluvia",
  "Sobadores y huesos, medicina manual ancestral",
  "Cerebro psicodelico, neurologia del estado expandido",
  "Sierra norte de Oaxaca, mayor concentracion de biodiversidad de Mexico",
  "Cuidado parental en aves, cooperacion familiar en cria",
  "Inmortalidad biologica, hidra y medusas que rejuvenecen",
  "Cambio de sexo en peces, payaso y mero",
  "Floricultura ritual, cempasuchil y ofrenda de muertos",
  "Lombrices de tierra como ingenieras del suelo, aireacion y fertilidad",
  "Domesticacion del chile, capsicum y centros mexicanos de diversidad",
  "Inteligencia de pulpos y cefalopodos, neurologia distribuida",
  "Ahuehuete de Santa Maria del Tule, el arbol de 2000 anos mas ancho del mundo",
  "Isla Guadalupe y tiburon blanco, reserva biosfera unica",
  "Sentidos extras, magnetorrecepcion, electrolocalizacion y ecolocacion",
  "Endosimbiosis, mitocondrias y cloroplastos, origen bacteriano de los organelos",
  "Regeneracion en estrellas de mar y ajolotes, biologia del reemplazo",
  "Coevolucion lemur-baobab, polinizadores nocturnos de Madagascar",
  "Vibracion de cuerdas en instrumentos tradicionales, fisica musical",
  "Naturaleza, restauracion ecologica, polinizadores, humedales, suelos vivos",
  "Pulpos que suenan, actividad cerebral REM en invertebrados",
  "Hongos descontaminantes, micorremediacion de suelos toxicos",
  "Atoles regionales de Mexico, mas de 50 variedades por estado",
  "Frijoles y maiz combinados, complementariedad de aminoacidos esenciales",
  "Hipopotamos como bombas de nutrientes entre rio y pradera",
  "Pajaros carpinteros como creadores de cavidades para otras especies",
  "Esponjas como animales mas simples, filtros del oceano",
  "Pigmentos naturales, clorofila, antocianinas, carotenoides, betalainas",
  "Resonancia Schumann, la frecuencia electromagnetica de la Tierra",
  "Toloache, datura y planta peligrosa de la herbolaria",
  "Cuervos y herramientas, inteligencia animal y resolucion de problemas",
  "Resistencia a antibioticos, alimentacion y microbioma",
  "Saberes zapoteca, escritura prehispanica y arquitectura monumental",
  "Fermentos, fermento de col morada, fermentacion lactica de col morada mexicana, probioticos caseros con col morada, receta tradicional paso a paso, beneficios del fermento de col morada",
  "Vuelo de las semillas, fisica de la dispersion por viento",
  "Plasticidad fenotipica, mismo gen, distintos cuerpos",
  "Chocolate y placer, anandamida y feniletilamina",
  "Antibioticos de hongos, descubrimiento de penicilina",
  "Codices prehispanicos, escritura, calendario y memoria visual",
  "Pino Hartwegii, bosques de altura y monarca como refugio",
  "Eclipses solares en culturas mesoamericanas, Codice Dresde y predicciones mayas",
  "Tlacuache, unico marsupial americano y supervivencia desde los dinosaurios",
  "Tomate jitomate, arquitectura floral y origen mesoamericano",
  "Primeros pobladores de America, Clovis y los yacimientos mexicanos",
  "Micorrizas en raices, simbiosis de hongos y plantas, intercambio de nutrientes",
  "Quimica del mole, fusion de chiles, especias y chocolate",
  "Ayahuasca y dimetiltriptamina, ritual y farmacologia",
  "Quimica de los esmaltes ceramicos, oxidos minerales y coccion",
  "Toxinas de ranas dardo, alcaloides batracotoxina y dieta alimenticia",
  "Aloe vera y sabila, cicatrizacion y medicina popular",
  "Lobos y cuervos, cooperacion entre depredador y carronero",
  "Quetzal en bosque mesofilo, plumas sagradas, ave dificil de ver",
  "Cantos de las ballenas azules, la cancion mas baja del oceano",
  "Origen de las plantas terrestres, salida del agua y conquista del continente",
  "Mohos en quesos, penicillium y artes de la fermentacion",
  "Aceite de oregano y antimicrobianos naturales",
  "Termitas y protozoos intestinales, digestion de celulosa, simbiosis dentro del intestino",
  "Plantas y cancer, investigacion oncologica de origen vegetal",
  "Quimica del cafe, tostado, aroma y reaccion de Maillard",
  "Apareamiento de cefalopodos, hectocotilo y comunicacion visual",
  "Zapatismo y autonomia indigena en la Selva Lacandona desde 1994",
  "Pradera de pastos altos en Janos, perro llanero y bisonte",
  "Aromas de bosque, terpenos, monoterpenos y comunicacion vegetal",
  "Pulque versus mezcal, dos caminos del maguey en bebidas mexicanas",
  "Vuelo de insectos, aerodinamica a baja escala y vortices",
  "Inteligencia animal, pulpos, cuervos y monos",
  "Ejercicio y cerebro, neurogenesis y BDNF",
  "Castores ingenieros, presas naturales, humedales, hidrologia restaurada",
  "Orcas como reguladoras de poblaciones marinas, depredador apice oceanico",
  "Extincion del Pleistoceno, humanos y el fin de la megafauna americana",
  "Epigenetica del suelo, memoria del estres y herencia ambiental",
  "Acidos del nopal, oxalatos, acido isocitrico y propiedades",
  "Adaptacion a altitud, sherpas y poblaciones andinas, gen EPAS1",
  "ADN antiguo, paleogenetica de poblaciones americanas precolombinas",
  "Patrones de Turing en pieles, manchas del jaguar y rayas de cebra",
  "Hongos bioluminiscentes, panellus stipticus y luz en bosques",
  "Cuerpo humano por dentro, sistema circulatorio y sus 100 mil km de vasos",
  "Energia alternativa, energia solar comunitaria, biogas, lena sostenible, autonomia energetica",
  "Maices criollos en peligro, razas nativas, contaminacion transgenica, defensa de las semillas",
  "Polinizacion del cacao por mosquitas Forcipomyia, los polinizadores diminutos del chocolate",
  "Pulque, aguamiel, fermentacion tradicional, maguey pulquero, tlachiquero",
  "Plumeria o cacaloxochitl, la flor sagrada de la Luna",
  "Vida extremofila, bacterias en hielo, lava y radiacion",
  "Hongos descomponedores, cadena del carbono y suelo vivo",
  "Hormigas cortadoras de hojas y hongos, primer caso de agricultura no humana",
  "Feromonas en insectos, quimica de la atraccion sexual",
  "Semillas criollas, banco de semillas, variedades nativas, reproduccion vegetal, seleccion de semillas",
  "Chinicuil y meocuil, gusanos rojo y blanco del maguey, biologia de los gusanos del mezcal",
  "Hierro vegetal y anemia, plantas ricas y absorcion",
  "Marea roja en costas mexicanas, dinoflagelados y saxitoxina",
  "Espirales logaritmicas en nautilus, galaxias, huracanes y caracoles",
  "Diversidad genetica del cacao, Theobroma y centros de origen amazonico",
  "Encinares mexicanos, robles, bellotas y biodiversidad asociada",
  "Arte huichol y chaquira, cosmovision del peyote tejida con cuentas",
  "Conexion social y cerebro, oxitocina y vinculos",
  "Domesticacion del pavo, guajolote y cria mesoamericana",
  "Mar de Cortes, oceano biologicamente mas rico del planeta",
  "Hongos micorrizicos, simbiosis con plantas y nutricion vegetal",
  "Iguana negra y verde, reptiles emblematicos de bosques tropicales mexicanos",
  "Reserva de la biosfera Calakmul, jaguares y selvas mayas conservadas",
  "Atencion y distraccion, neurociencia de la era digital",
  "Medusas inmortales, Turritopsis dohrnii y reversion biologica",
  "Jaguar como controlador de poblaciones en selvas mexicanas",
  "Teoria de juegos en evolucion, estrategias evolutivamente estables",
  "Efecto Coriolis, por que giran los huracanes en cada hemisferio",
  "Pulque y nutricion, vitaminas, aminoacidos y bebida ancestral funcional",
  "Filosofia tojolabal, nosotros como ser y comunidad",
  "Mariposas nocturnas y plantas, evolucion paralela de proboscis y nectarios profundos",
  "Cocodrilo de pantano y rio, biologia de un superdepredador acuatico",
  "Humedales de Marismas Nacionales, ecosistema de manglar de Nayarit",
  "Fisica del temblor, ondas P y S, sismologia mexicana",
  "Vuelo del colibri, aleteo a 80 Hz, hover y vuelo invertido, fisica del beat",
  "Telaranas, propiedades mecanicas de la seda de arana, mas fuerte que el acero",
  "Geometria de cristales y simetria en minerales",
  "Desierto sonorense, saguaro y biznaga, adaptacion CAM al calor extremo",
  "Tradicion oral, transmision de conocimiento sin escritura",
  "Adiccion y dopamina, ciencia del comportamiento compulsivo",
  "Ballenas jorobadas en Bahia de Banderas, cantos complejos y migracion",
  "Hongos comestibles silvestres, identificacion y recoleccion segura",
  "Microbioma humano, bacterias en piel, boca e intestinos",
  "Flavanoides del cacao crudo, neuroproteccion y salud cerebral",
  "Magnetorrecepcion en aves migratorias, brujula biologica",
  "Permacultura aplicada al huerto, diseno y diversidad alimentaria",
  "Jumiles de Taxco, Atizies taxcoensis, insecto que se come vivo, festival y cosmovision nahua",
  "Aguacate Hass, origen en Atlixco Puebla y genealogia del arbol madre",
  "Cuero de micelio, hongos en moda sustentable",
  "Hidratacion, agua de tiempo y bebidas tradicionales",
  "Reserva Mariposa Monarca de Michoacan, ecologia del oyamel",
  "Tejate oaxaqueno, cacao, mamey y rosita de cacao en bebida ritual",
  "Murcielagos frugivoros, dispersion de semillas en selvas tropicales mexicanas",
  "Plantas y conciencia, neuroquimica del peyote y hongos",
  "Chicalote o amapola mexicana, Argemone mexicana y sus alcaloides",
  "Fullerenos y geometria de pelotas de futbol, matematicas en moleculas",
  "Anestesia y conciencia, misterio de la perdida temporal",
  "Cuervos que reconocen caras humanas y recuerdan por anos",
  "Prismas basalticos de Santa Maria Regla, lava enfriada en geometria perfecta",
  "Sueno y reparacion, ciencia del descanso profundo",
  "Trufas, hongos subterraneos y simbiosis con animales",
  "Papel picado de Huixcolotla, tecnica ancestral de cortar con gubias",
  "Salsa de soya y miso, fermentacion de aspergillus oryzae",
  "Virus y evolucion, pandemia, mutacion y seleccion natural",
  "Barro, ceramica tradicional, alfareria, arcilla, hornos de barro, tradicion alfarera mexicana",
  "Etnobotanica, plantas usadas por pueblos originarios",
  "Micelio como bioplastico, empaques y materiales sostenibles",
  "Genetica de la lactasa, persistencia y evolucion reciente",
  "Umami en hongos mexicanos, glutamato natural en quintoniles y setas",
  "Algoritmos de hormigas y enjambre, inteligencia colectiva en la naturaleza",
  "Bosque mesofilo de montana, ecosistema de niebla, biodiversidad relictual",
  "Xoloitzcuintle, perro prehispanico sin pelo y companero al Mictlan",
  "Mono arana, mono aullador y primates mexicanos en peligro",
  "Aguacate y grasas saludables, omega 9 y salud cardiovascular",
  "Geometria hexagonal de la colmena, eficiencia matematica de las abejas",
  "Especiacion alopatrica, formacion de nuevas especies por aislamiento",
  "Te de hierbabuena y menta, sistema digestivo",
  "Tiburon ballena en Holbox, gigante filtrador y turismo responsable",
  "Maguey, usos del agave, fibras, ixtle, pencas",
  "Ecolocalizacion de murcielagos y delfines, sonar biologico de alta resolucion",
  "Fisica de las olas, movimiento ondulatorio en oceano y mareas",
  "Hoja santa, anetol y sabor medicinal mexicano",
  "Colibries de Mexico, flores tubulares, coevolucion de picos y corolas, vuelo estacionario",
  "Comunicacion quimica entre plantas, defensa por aromas y alarmas vegetales",
  "Bisonte americano, restauracion de praderas en Janos, pastoreo y biodiversidad",
  "Aguila real en sierras mexicanas, simbolo nacional y conservacion",
  "Psicodelicos sagrados, peyote, hongos sagrados, temazcal, plantas de poder, medicina ancestral visionaria",
  "Medicina tradicional, plantas medicinales, herbolaria mexicana, curanderismo, remedios naturales",
  "Atole agrio, fermentacion de maiz y bebida prehispanica viva",
  "Fractales en sistemas vasculares de hojas y rios planetarios",
  "Escamoles, caviar azteca, hormigas Liometopum, recoleccion estacional en raices de maguey y mezquite",
  "Quimica del aguamiel, sacarosa, fructosa y fermentacion alcoholica del maguey",
  "Estres y cortisol, salud mental en el campo y la ciudad",
  "Suenos y REM, fase paradojica del descanso",
  "Quimica de la curcuma, curcumina y propiedades antiinflamatorias",
  "Pan de masa madre, lactobacilos, levaduras silvestres y fermentacion lenta",
  "Pesca artesanal, pesca tradicional, lagos y rios, artes de pesca, pesca sustentable",
  "Psicodelicos terapeuticos, psilocibina y depresion",
  "Etnoastronomia, lectura del cielo en culturas mexicanas",
  "Quimica del temazcal, vapor, sales y limpieza ritual",
  "Fractales en helechos, brocoli romanesco, costas y ramificaciones",
  "Vida en hidrotermales, quimiosintesis y ecosistemas sin sol",
  "Bioluminiscencia, luciferina y luciferasa, quimica de la luz fria",
  "Tepache, fermentacion de pina, levaduras y probioticos artesanales",
  "Tardigrados en el espacio, los limites biologicos de la vida extrema",
  "Pueblos originarios y agricultura, manejo del paisaje a 10 mil anos",
  "Ejercicio y longevidad, movimiento como medicina",
  "Hongos como umami natural, glutamato y sabor profundo en cocina",
  "Cleaner fish, peces limpiadores y sus clientes, estaciones de limpieza en arrecifes",
  "Magnesio y calcio, minerales en cocina mexicana",
  "Cafetales de sombra, agroforesteria y refugio de aves migratorias",
  "Musica y cerebro, dopamina y emocion auditiva",
  "Matematicas del oleaje, ondas y fisica del mar",
  "Quimica del olor a tierra mojada, geosmina y bacterias del suelo",
  "Salmones que llevan nutrientes del oceano al bosque, esqueletos en rios",
  "Hidraulica de los arboles, transpiracion y capilaridad, columna de agua de 100 metros",
  "Pez payaso y anemonas, simbiosis defensiva mutua en arrecifes",
  "Polifenoles del cacao y vino, antioxidantes y salud cardiovascular",
  "Cosmovision nahua, dualidad y equilibrio ometeotl",
  "Lagunas costeras de Tabasco y Veracruz, manglar y biodiversidad",
  "Cochinilla del nopal, Dactylopius coccus y el carmin que tino el mundo",
  "Ahuautle, caviar mexicano, huevos de mosca axayacatl del Lago de Texcoco, platillo casi perdido",
  "Quimica de la mostaza y el ajo, aliinasa y compuestos sulfurados",
  "Plantas que cuentan, mimosa pudica, dionaea y sentidos vegetales",
  "Chapulines de Oaxaca, sphenarium y nutricion de saltamontes",
  "Sierra tarahumara, biodiversidad, barrancas y pueblos originarios",
  "Coevolucion yuca y polilla yucca, mutualismo obligado entre planta e insecto",
  "Conexion intestino-cerebro, microbioma y emocion",
  "Tiburones y pez remora, transporte y limpieza, comensalismo marino",
  "Coevolucion humano-maiz, dependencia mutua de 9000 anos",
  "Abejas meliponas sin aguijon, melipona beecheii, miel maya, panales en espiral",
  "Efecto mariposa, Lorenz y teoria del caos determinista",
  "Fibras naturales, henequen, palma, mimbre, telar tradicional, textiles naturales mexicanos",
  "Evolucion convergente, alas de ave, murcielago e insecto, soluciones distintas",
  "Te de manzanilla, propiedades digestivas y herbolaria",
  "Musica tradicional mexicana, sones, jarana, teponaztle, cantos de trabajo, musica ritual",
  "Quimica del chocolate, conchado y temperado para textura perfecta",
  "Alfombras de aserrin de Huamantla, arte efimero y devocion mariana",
  "Hongos medicinales, reishi, melena de leon y shiitake",
  "Salud reproductiva femenina, plantas y conocimiento tradicional",
  "Virgen de Guadalupe como sincretismo, Tonantzin y la conversion",
  "Barbacoa de hoyo, termodinamica del vapor en penca de maguey",
  "Refraccion de la luz y el cielo rojo del atardecer",
  "Zopilote rey, carronero magnifico de selvas tropicales",
  "Sabiduria de parteras tradicionales y conocimiento del cuerpo",
  "Sistema inmunologico, defensa innata y adaptativa",
  "Cafeina y atencion, mecanismo neurologico",
  "Catrina de Jose Guadalupe Posada, historia del icono de la muerte",
  "Tension superficial y el zancudo que camina sobre el agua",
  "Anis y digestion, plantas para colicos",
  "Tortuga laud, gigante del oceano y anidacion en playas mexicanas",
  "Nixtamalizacion, alcali, biodisponibilidad de niacina, prevencion de pelagra",
  "Cocina con metate y molcajete, fisica de moler y propiedades del sabor",
  "Meditacion y cambios cerebrales, ciencia del mindfulness",
  "Dualidad onda-particula, mecanica cuantica para principiantes",
  "Talavera poblana, denominacion de origen y esmaltes virreinales",
  "Hibernacion en osos y mamiferos, fisiologia del sueno profundo",
  "Sonido de las ballenas, fisica de la comunicacion submarina",
  "Ramificacion fractal de pulmones, vasos sanguineos y rios",
  "Madera, carpinteria tradicional, maderas locales, construccion en madera, manejo forestal",
  "Amaranto, proteina completa y superalimento prehispanico",
  "Bosque de oyamel, refugio de la mariposa monarca y ecosistema de altura",
  "Tortugas terrestres como dispersoras de semillas duras",
  "Acustica de cuevas y resonancia en arquitecturas naturales",
  "Cacti como medicina, biznaga y antiinflamatorios",
  "Selva maya, frutos selvaticos y cosecha sustentable",
  "Telescopio James Webb, imagenes del universo temprano y primeras galaxias",
  "Tintes naturales, indigotina del anil y carmin de cochinilla",
  "Tlazoltli, conocimiento herbolario nahua y plantas catalogadas",
  "Mezcales por denominacion, ciencia de 48 especies de agave destiladas",
  "Coral y zooxantelas, simbiosis bajo amenaza, blanqueamiento por calor",
  "Chiles y capsaicina, metabolismo y endorfinas",
  "Redes miceliales, wood wide web, comunicacion entre arboles a traves de hongos",
  "Radiacion adaptativa, pinzones de Darwin y diversidad explosiva",
  "Genetica de poblaciones, deriva, flujo genico y seleccion",
  "Palenque y la acustica de sus templos, arquitectura sonica maya",
  "Salud oral, plantas mexicanas y enjuagues tradicionales",
  "Cacao, cacao criollo, pinole, tejate, ceremonias del cacao, chocolate artesanal",
  "Cascada de Agua Azul, quimica del carbonato de calcio",
  "Cultivo casero de setas, sustratos y temperatura ideal",
  "Bioconstruccion con tierra, adobe, bahareque, tierra compactada, techos verdes",
  "Agroforesteria, sistemas silvopastoriles, cercas vivas, arboles en parcelas, manejo forestal comunitario",
  "Linces y pumas, control de herbivoros y salud de bosques",
  "Mimetismo batesiano y mulleriano, defensa por imitacion",
  "Impacto del meteorito de Chicxulub en Yucatan, extincion de los dinosaurios hace 66 millones de anos",
  "Nopal tuna verde, roja y morada, pigmentos y antioxidantes",
  "Embriologia, desarrollo desde una celula hasta organismo",
  "Ecuaciones de poblacion, depredador-presa, modelo Lotka-Volterra en ecologia",
  "Fermentos tradicionales mexicanos, tepache, vinagre artesanal, atole agrio, fermentacion lactica, probioticos naturales",
  "Composta, lombricomposta, manejo de residuos organicos, humus, suelo fertil, abono casero",
  "Saberes mixteca, codices, escritura y memoria",
  "Cuachalalate, corteza y propiedades antiulceras",
  "Observatorio astrofisico de Tonantzintla, cuna de la astronomia mexicana",
  "Domesticacion de la calabaza, cucurbita y origen mesoamericano",
  "Monte Alban, 1500 anos de una ciudad sobre la montana zapoteca",
  "Aguila harpia y grandes rapaces tropicales como reguladoras",
  "Tornados y huracanes, fisica atmosferica y formacion en Golfo de Mexico",
  "Guajolote silvestre, origen del pavo domestico en Mesoamerica",
  "Origen de los animales, organizacion celular y simetria corporal",
  "Corrientes oceanicas y clima mexicano, la conexion con el Pacifico",
  "Aves silvestres, aves de corral criollas, corredores biologicos, ornitologia, biodiversidad aviar",
  "Eusocialidad en abejas, hormigas y termitas, sociedades de insectos",
  "Coati y tlacuache, mamiferos pequenos en bosques mexicanos",
  "Calendario agricola lunar, siembra segun fases y ciencia detras",
  "Acueducto de Tenochtitlan y la ingenieria hidraulica mexica",
  "Elefantes en duelo, rituales funerarios en mamiferos no humanos",
  "Chia, omega 3 y semilla de los aztecas",
  "Inflamacion cronica y dieta antiinflamatoria mexicana",
  "Hermafroditismo en babosas marinas y caracoles",
  "Yogurt y kefir, fermentacion lactica casera y probioticos",
  "Boldo y vesicula, plantas para el higado",
  "Fuego, fogones de lena, cocina tradicional, carbon vegetal, manejo del fuego en el campo",
  "Tortugas marinas, anidacion en duna, transporte de nutrientes oceano-playa",
  "Infancia en el campo, educacion comunitaria, juegos tradicionales, crianza con la tierra, ninez rural",
  "Quimica de los aromas florales, biosintesis de fragancias",
  "Mezcal y tequila, ciencia de la destilacion y diversidad de agaves",
  "Avispas parasitoides y orugas, manipulacion conductual del huesped",
  "Rios tropicales mexicanos, peces nativos y endemismos",
  "Tepezcuintle, mamifero dispersor de semillas en la selva maya",
  "Teocintle al maiz, domesticacion en Mesoamerica, mutacion del gen tga1",
  "Naturaleza y salud mental, biofilia y reduccion de estres",
  "Quimica del ceviche, desnaturalizacion proteica por acido en pescado crudo",
  "Defensa del territorio, autonomia comunitaria, derechos indigenas, tierra y agua",
  "Fisica de los geiseres y manantiales termales",
  "Buitres y carroneros, servicios ecosistemicos de limpieza y prevencion de enfermedades",
  "Domesticacion del jitomate, viaje del solanum desde los Andes hasta el mundo",
  "Pasiflora y ansiedad, sedantes vegetales tradicionales",
  "Migracion rural, comunidades en diaspora, retorno al campo, identidad comunitaria, remesas culturales",
  "Acidos humicos del suelo, quimica de la materia organica",
  "Mole poblano, quimica de 30 ingredientes en sinergia",
  "Inteligencia colectiva en enjambres, decisiones distribuidas",
  "Quinina del cinchona, malaria y descubrimiento andino",
  "Polinizacion del maguey por murcielagos magueyeros, Leptonycteris, vuelo nocturno, coevolucion agave-quiroptero",
  "Fisica del arco iris y refraccion de la luz en gotas",
  "Cero maya, descubrimiento matematico independiente, sistema vigesimal",
  "Aguamiel y diabetes, fructosa y consideraciones",
  "Manglar, raices respiratorias, vivero del oceano y carbono azul",
  "Ganaderia sustentable, razas criollas, pastoreo rotacional, manejo regenerativo, trashumancia",
  "Geometria de copos de nieve, simetria hexagonal y formacion del cristal",
  "Alcaloides sagrados, mescalina del peyote, psilocibina de hongos, DMT",
  "Calabaza y carotenoides, vision y salud",
  "Evolucion del ojo, surgimiento independiente en multiples linajes",
  "Umami y el quinto sabor, descubrimiento de Ikeda en algas kombu",
  "Pelo polar y aislamiento termico, fisica de la conservacion del calor",
  "Nopal, control de glucosa y diabetes",
  "Chinampas de Xochimilco, patrimonio UNESCO de agricultura flotante",
  "Materia oscura y energia oscura, 95 por ciento del universo invisible",
  "Dia de Muertos UNESCO, cosmogonia nahua del inframundo",
  "Conservacion ancestral, salar, secar, ahumar y enchilar",
  "Hormigas y acacias, mutualismo defensivo, hormigas guardianas de plantas espinosas",
  "Polinizacion por moscas en aros y plantas que huelen a carrona",
  "Plantas que pagan a las hormigas con nectar extrafloral, defensa contratada",
  "Hongos cordyceps, parasitismo y manipulacion conductual",
  "Epazote, antiparasitario tradicional y compuestos activos",
  "Pico de Orizaba, volcan mas alto de Mexico y su deshielo",
  "Lobos del Yellowstone, cascada trofica, recuperacion de rios y bosques",
  "Carpintero imperial, ave extinta de bosques de pino mexicanos",
  "Cacomixtle, mapache y coati, mesodepredadores nocturnos mexicanos",
  "Vainilla de Papantla, Vanilla planifolia y su polinizacion obligada",
  "Acido salicilico en sauces, origen de la aspirina",
  "Selva lacandona, jaguares, monos arana y refugio de biodiversidad",
  "Pan, pan de horno de lena, masa madre, pan de muerto, panaderia tradicional mexicana",
  "Gran Intercambio Biotico, la conexion de las Americas hace 3 millones de anos",
  "Tardigrados, supervivientes extremos y biologia molecular",
  "Cinturon Volcanico Transmexicano, la columna de fuego de 1000 km",
  "Quelites de la milpa, hierbas comestibles y micronutrientes esenciales",
  "El Caracol de Chichen Itza, observatorio astronomico maya de Venus",
  "Iguana espinosa y iguana verde, reptiles iconicos del tropico",
  "Quesos artesanales mexicanos, microbiologia de la fermentacion lactea",
  "Tortugas marinas que regresan a su playa natal por campo magnetico",
  "Abejas, apicultura tradicional, colmenas nativas, miel, meliponas, polinizacion",
  "Neuronas espejo, empatia e imitacion",
  "Pinguica y vias urinarias, conocimiento popular",
  "Bioacumulacion de toxinas en cadena alimentaria, mercurio en peces",
  "Lenguas indigenas, nahuatl, otomi, mazateco, revitalizacion linguistica, lenguas originarias de Mexico",
  "Genoma del maguey, Agave salmiana, gen CAM y resistencia a sequia",
  "Vitamina D y sol, salud osea y sistema inmune",
  "Cerebros bicamerales, hemisferios y procesamiento dual",
  "Hongos en cuevas y oscuridad, biologia sin sol",
  "Vitamina C, escorbuto, citricos y descubrimiento historico",
  "Levaduras del pulque, microbiologia de la bebida ancestral",
  "Series de Fibonacci en reproduccion de conejos y abejas",
  "Mariposa monarca, migracion transcontinental, asclepias, oyamel, ruta de tres generaciones",
  "Cartografia indigena, mapas de relacion y codices",
  "Elefantes africanos como ingenieros del paisaje, dispersores y abridores de claros",
  "Calculo del vuelo de aves migratorias, optimizacion de rutas",
  "Cochinita pibil y fisica del horno de piedra, tecnica maya del pib",
  "Pirul, el falso pimentero que llego de los Andes",
  "Colorantes naturales, anil, cochinilla, palo de brasil, tintes vegetales, tintoreria tradicional",
  "Veneno de avispa de mar, investigacion farmacologica",
  "Hongos, cultivo de setas, micorrizas, fungi medicinales, recoleccion de hongos silvestres",
  "Arte tradicional mexicano, muralismo, artesanias, ceramica, textiles, papel amate, expresion cultural",
  "Avispas higueras del trópico americano y la mecánica del syconium",
  "Vibora de cascabel diamantada, biologia de la serpiente nacional",
  "Escala Scoville y neurobiologia del picante en chiles mexicanos",
  "Huitlacoche, hongo del maiz, manjar mexicano del maiz",
  "Cactus columnares, organo, pitayo y cardon, paisajes deserticos",
  "Huracanes del Caribe y Golfo de Mexico, fisica de la formacion ciclonica",
  "Capsaicina del chile, receptores TRPV1, evolucion del picante como defensa",
  "Perro llanero, mantenedor de praderas mexicanas y especies clave",
  "Suelo vivo, erosion del suelo, microvida del suelo, restauracion edafica, analisis de tierra",
  "Fisica del temazcal, vapor y termodinamica del bano ritual",
  "Estres cronico y cerebro, cortisol y atrofia",
  "Luis Ernesto Miramontes, quimico mexicano inventor de la pildora anticonceptiva",
  "Quimica del tequila, aromas, congeneres y diferencias de calidad",
  "Calendario maya, matematicas mesoamericanas y ciclos astronomicos",
  "Hormigas legionarias en selvas, control de plagas a gran escala",
  "Fusion nuclear, ITER y la promesa de energia limpia",
  "Tiburones, depredador apice, equilibrio de arrecifes y oceano",
  "Mamuts y gliptodontes del Valle de Mexico, megafauna del Pleistoceno",
  "Saberes mayas del campo, calendario, lluvia y siembra",
  "Guillermo Gonzalez Camarena, mexicano inventor de la TV a color",
  "Topologia de telaranas, geometria de la trampa optima",
  "Permacultura, diseno regenerativo, zonas de permacultura, observacion del paisaje, sistemas naturales",
  "Reproduccion del cacao por animales arboricolas, monos y dispersores",
  "Quimica del fuego, combustion, llama y reacciones de oxidacion",
  "Grutas de Cacahuamilpa, formacion de estalactitas en millones de anos",
  "Damiana, afrodisiaco mexicano y salud reproductiva",
  "Hongos zombies, ophiocordyceps y control mental de hormigas",
  "Saltos del pulgon y mecanica del salto explosivo",
  "Islas Revillagigedo, reserva marina mas grande de Norteamerica",
  "Acidos grasos omega 3 en pescados, EPA, DHA y cerebro",
  "Numero aureo y Fibonacci en girasoles, pinas, conchas, ramas y hojas",
  "Pumas y jaguares en Mexico, distribucion y conservacion",
  "Setas mexicanas, proteina vegetal y umami nutricional",
  "Cacao crudo, antioxidantes y salud cardiovascular",
  "Geometria de panal, problema del empaquetamiento eficiente, teorema de Hales",
  "Arrecifes de Veracruz y Quintana Roo, segunda barrera coralina del mundo",
  "Vinagre artesanal, fermentacion acetica y conservacion de alimentos",
  "Quelites de la milpa, quintoniles, huauzontles y verdolagas como genetica viva",
  "Cantos de ballenas, transmision cultural y dialectos",
  "Sincronia de floracion masiva en bambues, defensa por saciedad de depredadores",
  "Coyote como mesodepredador adaptable, ecologia urbana y rural",
  "Cafeina y teobromina, evolucion como defensa contra insectos",
  "Segunda ley de la termodinamica y el orden de la vida",
  "Cacao y salud cardiovascular, flavonoides y oxido nitrico",
  "Camuflaje y optica de pulpos, cromatoforos y mimetismo activo",
  "Salud de la piel, microbioma cutaneo y plantas mexicanas",
  "Lenguaje y cerebro, area de Broca y Wernicke",
  "Insectos comestibles, proteina y eficiencia ecologica frente a ganado",
  "Veneno de abejas y avispas, melitina y reaccion alergica",
  "Cosmologia indigena, calendario ritual, tonalpohualli, cosmovision nahua, saberes ancestrales, espiritualidad",
  "Sabiduria de los olores, aromaterapia tradicional y plantas mexicanas",
  "Ciencia y cosmovision, dialogo entre saberes",
  "Conocimiento ecologico tradicional, integracion con ciencia moderna",
  "Cenotes de Yucatan, hidrologia karstica y ruta del meteorito",
  "Tonalpohualli, calendario sagrado de 260 dias",
  "Isotopos radiactivos, datacion de fosiles y carbono 14",
  "Higos y avispas del higo, simbiosis dentro del fruto, sincronia evolutiva",
  "Sal, salineras tradicionales, sal de grano, preservacion de alimentos, comercio de sal",
  "Reaccion de Maillard, dorado del pan y la tortilla, quimica del sabor",
  "Pulpos, calamares y cefalopodos, inteligencia y sistema nervioso distribuido",
  "Veneno de viboras mexicanas, cascabel, nauyaca, componentes y antiveneno",
  "Memoria del territorio, toponimia indigena y paisaje cultural",
  "Genes y conducta, herencia y ambiente, debate naturaleza-crianza",
  "Domesticacion del frijol, dos centros de origen mesoamericano y andino",
  "Curanderos, susto, mal de ojo y limpias tradicionales",
  "Sueno y consolidacion de memoria, ciencia del descanso",
  "Reproduccion asexual, partenogenesis en lagartijas y plantas",
  "Probioticos vivos en pulque y tepache, microbioma de bebidas fermentadas",
  "Barranca del Cobre y origen geologico de la Sierra Tarahumara",
  "Alebrijes de Pedro Linares, arte nacido de un sueno febril en 1936",
  "Domesticacion del perro, lobo a perro xoloitzcuintle y razas precolombinas",
  "Arnica mexicana, antiinflamatorio topico y conocimiento popular",
  "Teselaciones en panal, escamas de pez y pieles de reptil",
  "Bacterias antibiotico-resistentes, evolucion en tiempo real",
  "Rayos y tormentas, fisica de la descarga electrica",
  "Quimica del vino y la cerveza, fermentacion y compuestos volatiles",
  "Antioxidantes naturales, polifenoles y prevencion",
  "Ruda, planta sagrada y compuestos medicinales",
  "Astronomia teotihuacana, alineacion de piramides y calendario de Venus",
  "Mario Molina, Nobel mexicano que descubrio el agujero de ozono",
  "Bilinguismo y plasticidad cerebral",
  "Quimica del cacao, teobromina, feniletilamina, anandamida y neurotransmisores",
  "Hormigas chicatanas, vuelo nupcial de una noche al ano tras las primeras lluvias, recoleccion en Oaxaca",
  "Polillas y mariposas, metamorfosis y biologia del cambio",
  "Memoria, hipocampo y formacion de recuerdos",
  "Mujeres en el campo, saberes femeninos, parteria, huertos familiares, liderazgo comunitario femenino",
  "Estructura de huevos y resistencia mecanica de la cascara",
  "Origen de la vida, sopa primigenia, hidrotermales y panspermia",
  "Ballenas como bombas biologicas, fertilizacion de oceano y captura de carbono",
  "Linfa, drenaje y sistema inmune secundario",
  "Cucaracha de Madagascar como dispersora de semillas, insectos olvidados",
  "Economia solidaria, trueque, mercados locales, autogestion comunitaria, finanzas rurales",
  "Ajolote de Xochimilco, regeneracion de extremidades, especie en peligro critico",
  "Neuroplasticidad, capacidad del cerebro para reorganizarse",
  "Volcan Popocatepetl, bosque, fauna y cultura nahua",
  "Maguey y salud, sapogeninas y compuestos medicinales",
  "Capsaicina y dolor, neurociencia del picante",
  "Exoplanetas habitables, telescopio Kepler y la busqueda de vida",
  "Curvas catenarias en telaranas y puentes naturales",
  "Cannabis y cannabinoides, sistema endocannabinoide",
  "Lobo mexicano, reintroduccion en Sierra Madre, depredador apice perdido",
  "Polinizacion por escarabajos en magnolias, polinizadores ancestrales antes de las abejas",
  "Barro negro de San Bartolo Coyotepec, quimica del brillo natural",
  "Liquenes, simbiosis hongo-alga, indicador de aire limpio, supervivientes extremos",
  "Teotihuacan como ciudad planificada, urbanismo mesoamericano de 250000 habitantes",
  "Hongos del bosque mexicano, recoleccion en sierra y temporada",
  "Ondas gravitacionales de LIGO, Einstein confirmado en 2015",
  "Murcielagos polinizadores nocturnos, flores que abren de noche, coevolucion olfato-aroma",
  "CRISPR y edicion genetica, riesgos y debate etico",
  "Polinizacion engano en orquideas, flores que imitan abejas hembras",
  "Aspirina del sauce, descubrimiento de la salicilina",
];

// ── Tags válidos ───────────────────────────────────────────────────────────
const VALID_TAGS = [
  "Pulque", "Bioconstruccion", "Naturaleza", "Territorio",
  "Semillas", "Agroforesteria", "Medicina", "Agua", "Fuego", "Comunidad",
  "Arte", "Economia", "Ganaderia", "Cosmologia", "Permacultura", "Hongos",
  "Aves", "Pesca", "Barro", "Madera", "Fibras", "Colorantes", "Sal",
  "Cacao", "Pan", "Insectos", "Suelo", "Energia", "Migracion",
  "Lenguas", "Infancia", "Mujeres", "Musica", "Psicodelicos", "Fermentos",
  "Evolucion", "Ciencia", "Mamiferos", "Polinizacion",
  "Biologia", "Salud", "Cerebro", "Sabiduria",
];
const TAG_EMOJI = {
  Pulque: "🍶", Bioconstruccion: "🏗️", Naturaleza: "🌿", Territorio: "✊",
  Semillas: "🌱", Agroforesteria: "🌳", Medicina: "🪴", Agua: "💧",
  Fuego: "🔥", Comunidad: "🤝", Arte: "🎨", Economia: "🤲",
  Ganaderia: "🐄", Cosmologia: "⭐", Permacultura: "♻️", Hongos: "🍄",
  Aves: "🦅", Pesca: "🎣", Barro: "🏺", Madera: "🪵",
  Fibras: "🧵", Colorantes: "🖌️", Sal: "🧂", Cacao: "🍫",
  Pan: "🍞", Insectos: "🦗", Suelo: "🌍", Energia: "⚡",
  Migracion: "🚶", Lenguas: "🗣️", Infancia: "👧", Mujeres: "👩",
  Musica: "🎶", Psicodelicos: "🌀", Fermentos: "🫙",
  Evolucion: "🧬", Ciencia: "🔬", Mamiferos: "🐾", Polinizacion: "🌸",
  Biologia: "🦠", Salud: "💚", Cerebro: "🧠", Sabiduria: "📜",
};
const DEFAULT_TAG = "Naturaleza";

// ── Estilos de imagen (muralismo mexicano como base) ─────────────────────
const IMAGE_SUBSTYLES = [
  {
    name: "oleo-empaste",
    desc: "óleo pesado con empaste grueso, capas densas de pintura, textura tridimensional de espátula",
  },
  {
    name: "fresco-cal",
    desc: "fresco sobre muro de cal, pigmentos minerales, textura de pared encalada con grietas sutiles",
  },
  {
    name: "tecnica-mixta",
    desc: "técnica mixta con collage, grabado y serigrafía, capas superpuestas de papel y tinta",
  },
  {
    name: "expresionismo-terroso",
    desc: "expresionismo con paleta terrosa, trazos gestuales amplios, pigmentos naturales de tierra",
  },
  {
    name: "claroscuro-social",
    desc: "realismo social con claroscuro dramático, luces fuertes y sombras profundas, volúmenes monumentales",
  },
  {
    name: "temple-antiguo",
    desc: "temple al huevo sobre tabla, acabado mate, colores saturados planos con bordes definidos",
  },
  {
    name: "litografia-color",
    desc: "litografía a color estilo Taller de Gráfica Popular, tintas planas, contrastes fuertes",
  },
  {
    name: "encaustica",
    desc: "encáustica con cera caliente y pigmentos, superficie translúcida con vetas y burbujas",
  },
  {
    name: "pastel-costumbrista",
    desc: "ilustración costumbrista en lápiz de color y pastel seco sobre papel granulado, trazos suaves visibles, textura arenosa cálida, tonos ocre-dorado y tierra, figuras con volumen sutil y expresiones amables, luz difusa dorada de atardecer",
  },
];

const TAG_PALETTES = {
  Pulque: "tonos ocre, ámbar, dorado, blanco hueso y verde maguey",
  Bioconstruccion: "tonos rojo arcilla, terracota, adobe, marrón tierra y beige",
  Naturaleza: "tonos verde bosque, verde musgo, tierra húmeda, azul agua y café corteza",
  Territorio: "tonos rojo profundo, negro obsidiana, ocre, dorado y verde selva",
  Semillas: "tonos verde claro, amarillo dorado, tierra marrón y blanco leche",
  Agroforesteria: "tonos verde profundo, café corteza, musgo, cielo azul y tierra",
  Medicina: "tonos verde medicinal, morado flor, blanco y ocre dorado",
  Agua: "tonos azul turquesa, verde agua, gris piedra y blanco espuma",
  Fuego: "tonos rojo llama, naranja brasa, negro carbón y amarillo chispa",
  Comunidad: "tonos ocre, rojo ladrillo, verde oliva y azul cielo",
  Arte: "tonos multicolor vivo, rojo carmín, azul índigo y amarillo brillante",
  Economia: "tonos verde jade, dorado, marrón café y ocre",
  Ganaderia: "tonos verde pradera, marrón cuero, crema y azul cielo",
  Cosmologia: "tonos negro noche, azul índigo, dorado estrella y morado cósmico",
  Permacultura: "tonos verde hoja, tierra húmeda, azul cielo y amarillo sol",
  Hongos: "tonos marfil, café seta, verde musgo y morado oscuro",
  Aves: "tonos azul cielo, verde bosque, marrón pluma y ocre",
  Pesca: "tonos azul lago, verde agua, gris piedra y ocre arena",
  Barro: "tonos rojo arcilla, terracota, ocre y gris ceniza",
  Madera: "tonos café caoba, ocre, amarillo pino y verde bosque",
  Fibras: "tonos natural crema, henequén dorado, morado añil y rojo grana",
  Colorantes: "tonos añil azul, grana rojo, amarillo cempasúchil y verde hoja",
  Sal: "tonos blanco sal, gris piedra, azul cielo y ocre desierto",
  Cacao: "tonos café oscuro, marrón cacao, dorado y verde selva",
  Pan: "tonos dorado pan, ocre trigo, marrón costra y rojo brasa",
  Insectos: "tonos verde hoja, ocre, rojo carmín y negro",
  Suelo: "tonos negro humus, café tierra, ocre y verde vibrante",
  Energia: "tonos amarillo solar, azul cielo, verde y naranja",
  Migracion: "tonos ocre camino, rojo ladrillo, azul añil y verde esperanza",
  Lenguas: "tonos ocre pergamino, negro tinta, rojo y dorado",
  Infancia: "tonos amarillo girasol, verde tierno, azul cielo y ocre",
  Mujeres: "tonos rojo flor, morado, verde jade y dorado",
  Musica: "tonos azul profundo, rojo vivo, ocre dorado y negro",
  Psicodelicos: "tonos morado visionario, azul profundo, verde sagrado, dorado y negro",
  Fermentos: "tonos morado col, magenta, verde lima y blanco sal",
  Evolucion: "tonos azul ADN, verde celular, naranja fosil y blanco hueso",
  Ciencia: "tonos azul cobalto, blanco laboratorio, verde matraz y dorado",
  Mamiferos: "tonos cafe pelaje, ocre sabana, verde monte y gris piedra",
  Polinizacion: "tonos amarillo polen, rosa flor, verde tallo y dorado abeja",
  Biologia: "tonos verde celular, azul agua, amarillo polen y violeta nucleo",
  Salud: "tonos verde manzana, blanco leche, rojo betabel y dorado dia",
  Cerebro: "tonos rosa neuronal, azul electrico, dorado sinapsis y violeta",
  Sabiduria: "tonos ocre pergamino, dorado antiguo, cafe madera y rojo tierra",
};
const DEFAULT_PALETTE = "tonos tierra, ocre, verde y rojo óxido";

// ── Perfiles de tono ───────────────────────────────────────────────────────
// Base narrativa compartida: reglas duras para evitar prosa genérica de LLM.
const NARRATIVE_BASE = `Eres redactor veterano de periodismo narrativo y divulgación científica en español mexicano, formado en la tradición de Juan Villoro, Elena Poniatowska en crónica, Gatopardo, Pie de Página y Ojalá. Escribes artículos que la gente TERMINA de leer — no por obligación, sino porque cada párrafo la jala al siguiente.

REGLAS DE ESCRITURA (no negociables, son la diferencia entre lectura adictiva y prosa de IA genérica):

1. APERTURA: escena, no tesis.
   Abre SIEMPRE con una escena concreta: un lugar con referencia geográfica real (estado, pueblo, altitud, coordenada), un gesto físico, un sonido u olor. La persona de la escena debe ser un composite anónimo arquetípico ("don X, campesino de…", "doña Y, partera de…") — NUNCA una figura histórica/académica nombrada (ver regla 10). JAMÁS abras con "X es un proceso que", "X se erige como", "X representa una alternativa", "X juega un papel fundamental". El primer párrafo debe leerse como la primera escena de una crónica: lector puede visualizar algo.

2. ESPECIFICIDAD ANCLADA por sección (h2).
   Cada sección incluye, no negociable:
   - 1+ ANCLA GEOGRÁFICA/BIOLÓGICA REAL Y VERIFICABLE: estado mexicano, comunidad/pueblo, ecosistema (sierra, río, lago, manglar, bosque mesófilo), altitud típica de la zona, o especie con nombre científico binomial bien establecido. Es conocimiento estable y comprobable.
   - 1+ detalle sensorial: olor, textura, sonido, color específico, temperatura corporal, gesto físico.
   - OPCIONAL (no obligatorio): dato numérico SOLO si lo conoces con certeza pública. Rangos típicos del ecosistema, conocimiento climatológico general, datos taxonómicos verificables, fechas históricas bien documentadas (Nobel, publicaciones famosas, descubrimientos clave).

   PROHIBIDO ABSOLUTAMENTE — esto es exactamente lo que produce desinformación y mata la credibilidad del sitio:
   - Estudios con la fórmula "(año + investigador con nombre + institución + porcentaje o cifra exacta + ubicación experimental)". Ejemplo PROHIBIDO: "en 2019, el doctor Jorge Molina de la UNAM midió en parcelas de Tlalpan que 36% de las plantas...". El modelo NO conoce ese estudio; lo está inventando con apariencia creíble. NO LO HAGAS.
   - Costos en pesos mexicanos atribuidos a programas, talleres, parcelas experimentales o productos específicos. PROHIBIDO inventar "el taller cuesta 350 pesos", "los insumos suben 12 pesos por 100 plantas". Solo válido si es un precio de referencia general (ej. "una penca de maguey en tianguis ronda 30 a 80 pesos").
   - Micro-precisiones meteorológicas locales presentadas como dato puntual ("8 km/h en las tardes de septiembre en Xalapa"), salvo que sea conocimiento climatológico general bien establecido.
   - Distancias o medidas experimentales muy precisas atribuidas a un montaje concreto ("1.2 metros entre plantas en el experimento", "cámaras de flujo acrílico de 40 cm").
   - Porcentajes exactos atribuidos a estudios concretos ("36% menos plantas con plaga", "35 nanogramos por gramo de hoja en menos de 20 minutos"). Si el porcentaje no es de conocimiento público y verificable, NO va.

   PERMITIDO y DESEABLE para anclar el texto:
   - "el ajolote (<em>Ambystoma mexicanum</em>) habita el sistema de canales de Xochimilco a 2,240 msnm"
   - "el bosque mesófilo de la sierra de Manantlán recibe entre 2,000 y 3,000 mm de lluvia al año"
   - "Mario Molina recibió el Nobel de Química en 1995 por su trabajo sobre los CFCs y la capa de ozono"
   - "Turlings y Tumlinson demostraron en 1990 que el maíz atacado por orugas emite una mezcla de volátiles, incluido linalool, que atrae a avispas parasitoides"

   Si una afirmación tiene forma de hecho concreto pero no la conoces con certeza, conviértela en descripción cualitativa o elimínala. PREFIERO omisión a invención. La regla 9 (HONESTIDAD EPISTÉMICA) gana siempre sobre la apariencia de precisión.

3. UN GIRO CONTRAINTUITIVO por artículo.
   Incluye AL MENOS un dato o idea que sorprenda al lector educado — un "espera, ¿en serio?". Va siempre en <aside class="aside-fact"><strong>Dato que rompe el molde:</strong> ...</aside>.

4. CIERRES DE SECCIÓN = GANCHO, no resumen.
   Termina cada sección (excepto la última) con una oración que abra una pregunta, tensión o misterio hacia la siguiente. Nada de "así vemos que", "en resumen", "por lo tanto". Micro-cliffhangers suaves.

5. FRASES ABSOLUTAMENTE PROHIBIDAS (si usas cualquiera, el artículo se considera fallido):
   - "se erige como", "se presenta como", "se convierte en", "se perfila como", "representa una alternativa", "juega un papel fundamental"
   - "puente hacia", "tapiz", "tejer", "reverberando", "reverbera", "en armonía con", "sinergia", "sinérgico", "holístico"
   - "es fundamental destacar", "cabe mencionar", "en este sentido", "resulta imperativo", "no podemos dejar de mencionar"
   - "múltiples beneficios", "gran variedad de", "el alma de", "el corazón de"
   - "madre tierra", "reconciliarse con la naturaleza", "legado de vida", "tapiz de vida", "desencadena un efecto"
   - "no solo X sino también Y" (muletilla estructural — varía la construcción)
   - "cada acción cuenta", "juntos podemos", "el futuro depende de nosotros", "sembrar el cambio"
   - "a menudo olvidadas", "a menudo olvidados"
   - Cualquier frase intercambiable: si la oración cabría idéntica en un artículo sobre cualquier otro tema, no va.

6. CADENCIA VARIADA.
   Alterna oraciones cortas (5-12 palabras) con largas (20-35). Nunca dos párrafos seguidos con apertura igual. Varía verbos: no abuses de "es", "son", "tiene", "representa", "constituye". Prefiere verbos concretos: raspa, hierve, migra, cuaja, prende, destila, mide, carga, guarda.

7. MOSTRAR > DECIR.
   "Una milpa de 3 hectáreas rinde más calorías por metro cuadrado que una hectárea del mismo maíz solo" > "Las milpas son más productivas". Si citas, atribuye a alguien real verificable (investigador, institución, publicación). Nunca inventes citas.

8. CONCLUSIÓN que NO resume.
   Último párrafo: una imagen, una escena futura, una pregunta abierta, un llamado concreto con acción específica (nombre del taller, dirección, colectivo, fecha). Nada de "en definitiva", "en conclusión", "para finalizar", ni repetir ideas ya dichas.

9. HONESTIDAD EPISTÉMICA.
   Si no sabes un dato con certeza, OMÍTELO. Prefiero omisión a invención. Las fechas, cifras e instituciones deben existir en la realidad: usa conocimiento que tengas, no fabriques.

10. REGLA DURA SOBRE PERSONAS CON NOMBRE (muy importante):
   Hay DOS tipos de personas en el texto y cada una tiene reglas distintas:

   (a) FIGURAS PÚBLICAS / HISTÓRICAS / ACADÉMICAS con nombre propio verificable (ej. Luis Álvarez, Lynn Margulis, Suzanne Simard, Miguel León-Portilla, Mario Molina, Elena Poniatowska, Pedro Linares, Luis Ernesto Miramontes, Diego Rivera, José Clemente Orozco, investigadores citados por institución, autores publicados):
       - PROHIBIDO inventar escenas específicas, diálogos, gestos, estados de ánimo, micro-ubicaciones, fechas-momento que no sean verificables.
       - Ejemplo PROHIBIDO: "Luis Álvarez se agachó en la arena de Chicxulub en febrero de 1981 con el ceño fruncido".
       - Ejemplo PROHIBIDO: "Diego Rivera, con el pincel en la mano, contempló el muro vacío del Palacio Nacional un martes de 1929".
       - PERMITIDO — y de hecho ESPERADO para que el artículo sea informativo de verdad — todo lo que esté DOCUMENTADO públicamente: técnicas que usaron, métodos, materiales, pigmentos, obras, fechas de publicación/obra, instituciones, teorías, citas publicadas verificables, colaboradores conocidos, conceptos que acuñaron, temas recurrentes en su obra.
       - Ejemplo PERMITIDO: "En 1980, Luis y Walter Álvarez publicaron en Science la hipótesis del impacto: una capa de iridio de 1 cm en el límite K-Pg revelaba una firma extraterrestre."
       - Ejemplo PERMITIDO: "Rivera pintó los murales de la Secretaría de Educación Pública entre 1922 y 1928 con técnica de buon fresco — aplicando pigmentos minerales sobre mortero de cal fresca en paneles llamados giornate, cada uno del tamaño que podía terminar antes de que el mortero secara."
       - La distinción clave: ¿estás contando lo que HICIERON, PUBLICARON, USARON, CONCIBIERON? Adelante. ¿Estás narrando un momento específico de su vida como si fueras testigo? No.

   (b) PERSONAS ANÓNIMAS arquetípicas del campo/comunidad (ej. "don Gervasio, campesino de Acaxochitlán", "doña Remedios, partera de la Sierra", "Benito, ejidatario tzeltal"):
       - SÍ puedes construir escenas con ellos para anclar la explicación al territorio.
       - Son composites representativos del oficio/región, el lector entiende que son voz y no dossier biográfico.
       - Úsalos para la apertura y transiciones. Son la licencia narrativa honesta.

   Si un párrafo cita a una persona real nombrada, debe estar basado en algo que esa persona efectivamente dijo, escribió o hizo, no en una reconstrucción imaginativa.

EJEMPLO de apertura que SÍ cumple (tema: pulque):
"Antes de las seis de la mañana, don Eulalio Hernández ya subió al maguey. Cuarenta y siete años clavando el acocote en la misma variedad de Agave salmiana en las laderas de Epazoyucan, Hidalgo. Succiona, escupe, vuelve a succionar. Lo que sale es aguamiel: un líquido dulce, tibio, que en doce horas — sin que él intervenga — se convertirá en pulque. Lo que ocurre entre medias es una de las fermentaciones más extrañas del planeta."

(Nombre propio, años exactos, ubicación, acción física, término técnico, nombre científico en contexto, gancho al final.)`;

const TONE_PROFILES = [
  {
    name: "cronica-rural",
    systemPrompt: NARRATIVE_BASE + "\n\nTONO ESPECÍFICO: crónica rural. Cuentas escenas del campo mexicano con nombres, pueblos, oficios reales. El saber científico entra a través de las historias, no al revés. Usa verbos de acción concreta.",
    sectionRange: [7, 9],
    temperatureRange: [0.75, 0.9],
  },
  {
    name: "reportaje-ciencia",
    systemPrompt: NARRATIVE_BASE + "\n\nTONO ESPECÍFICO: reportaje de divulgación científica. Arrancas con escena humana (composite anónimo arquetípico, no figura nombrada), después explicas el mecanismo biológico/químico/físico con precisión. Cita investigadores, instituciones y estudios SOLO cuando conozcas el trabajo con certeza pública (ej. Turlings 1990 en volátiles de maíz, Margulis 1967 en endosimbiosis, Mario Molina 1995 en CFCs, Luis Ernesto Miramontes en la píldora, Diego Rivera en SEP 1922-1928). Si no conoces un estudio con seguridad, NO lo inventes — explica el mecanismo científico bien sin atribuirlo a un montaje experimental específico ni a un investigador con nombre. PREFERIBLE divulgar el concepto con precisión que rellenar con un estudio falso. Las instituciones (UNAM, Cinvestav, INAH, IPN, Conabio) solo se nombran si la investigación que les atribuyes es real y documentada. Cada sección desarrolla UN concepto científico a profundidad.",
    sectionRange: [7, 9],
    temperatureRange: [0.65, 0.8],
  },
  {
    name: "ensayo-cortito",
    systemPrompt: NARRATIVE_BASE + "\n\nTONO ESPECÍFICO: ensayo breve y filoso. Párrafos cortos (60-100 palabras), ritmo rápido, una idea por párrafo, transiciones tensas. Sin meandros, pero con especificidad absoluta. Piensa en columna de Alma Guillermoprieto o Carlos Monsiváis.",
    sectionRange: [6, 8],
    temperatureRange: [0.7, 0.85],
  },
  {
    name: "cronica-lirica",
    systemPrompt: NARRATIVE_BASE + "\n\nTONO ESPECÍFICO: prosa con aliento lírico pero anclada en lo físico. Metáforas del territorio mexicano (no genéricas). El lirismo viene de observación, no de adjetivos. Evita lo abstracto; una metáfora vale solo si se puede tocar.",
    sectionRange: [7, 9],
    temperatureRange: [0.8, 0.95],
  },
];

// ── Utilidades ─────────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fechaMx(date) {
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uniqueSlug(base) {
  const articulosDir = path.join(__dirname, "..", "articulos");
  let slug = base;
  let n = 2;
  while (fs.existsSync(path.join(articulosDir, slug))) {
    slug = `${base}-${n}`;
    n++;
  }
  return slug;
}

function validateTag(tag) {
  if (VALID_TAGS.includes(tag)) return tag;
  // Accept new tags GPT suggests — add emoji fallback
  if (typeof tag === "string" && tag.length > 0 && tag.length < 40) return tag;
  return DEFAULT_TAG;
}

// ── Utilidad: tiempo de lectura ────────────────────────────────────────────
function readingTime(body) {
  const words = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
  const mins = Math.max(3, Math.round(words / 200));
  return `${mins}–${mins + 2} min`;
}

// ── Template HTML ──────────────────────────────────────────────────────────
function buildHTML({ title, excerpt, body, diy, tag, emoji, slug, dateStr, isoDate }) {
  const safeExcerpt = excerpt.replace(/"/g, "&quot;");
  const readTime = readingTime(body);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="../../images/logo_transparente.png">
  <title>${title} — Guardianes del Pulque</title>
  <meta name="description" content="${safeExcerpt}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${safeExcerpt}" />
  <meta property="og:image" content="${SITE_URL}/articulos/${slug}/${slug}.png" />
  <meta property="og:url" content="${SITE_URL}/articulos/${slug}/${slug}.html" />
  <meta property="og:site_name" content="Guardianes del Pulque" />
  <meta property="og:locale" content="es_MX" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${safeExcerpt}" />
  <meta name="twitter:image" content="${SITE_URL}/articulos/${slug}/${slug}.png" />
  <link rel="canonical" href="${SITE_URL}/articulos/${slug}/${slug}.html" />

  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${safeExcerpt}",
    "image": "${SITE_URL}/articulos/${slug}/${slug}.png",
    "datePublished": "${isoDate}",
    "author": {
      "@type": "Organization",
      "name": "Guardianes del Pulque",
      "url": "${SITE_URL}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Guardianes del Pulque",
      "logo": {
        "@type": "ImageObject",
        "url": "${SITE_URL}/images/logo_transparente.png"
      }
    }
  }
  <\/script>

  <style>
    *,*::before,*::after{box-sizing:border-box}
    body{
      margin:0;
      font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,'Helvetica Neue',Arial,'Apple Color Emoji','Segoe UI Emoji';
      line-height:1.6;
      color:#0f172a;
      background:#f6f8fb;
    }
    :root{
      --brand:#059669;
      --ink:#0f172a;
      --muted:#64748b;
      --card:#ffffff;
    }
    a{color:inherit;text-decoration:none}
    img{max-width:100%;display:block}

    .container{max-width:960px;margin-inline:auto;padding:0 16px}
    @media (min-width:640px){.container{padding:0 24px}}

    /* NAV */
    .nav{
      position:sticky;top:0;z-index:40;
      background:transparent;
      border-bottom:1px solid transparent;
      backdrop-filter:saturate(180%) blur(14px);
      transition:background .25s ease,border-color .25s ease,box-shadow .25s ease;
    }
    .nav-row{
      display:flex;align-items:center;
      justify-content:space-between;
      padding:10px 0;gap:1rem;
    }
    .brand{display:flex;align-items:center;gap:.5rem;font-weight:700;}
    .brand-logo{height:40px;width:auto;}
    @media (min-width:768px){.brand-logo{height:52px}}
    .brand-text{font-size:1rem;color:#111827;letter-spacing:.02em;}
    .links{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:flex-end;align-items:center;}
    .chip{
      display:inline-flex;align-items:center;gap:.35rem;
      padding:.4rem .85rem;border-radius:999px;
      border:2px solid var(--brand);color:var(--brand);
      background:rgba(255,255,255,.98);font-weight:700;
      font-size:.75rem;cursor:pointer;
      transition:all .18s ease;white-space:nowrap;
    }
    .chip .emoji{font-size:.95rem}
    .chip:hover{background:var(--brand);color:#020817;transform:translateY(-1px);}
    .nav.scrolled{
      background:#020817;
      border-bottom-color:rgba(148,163,253,.2);
      box-shadow:0 14px 40px rgba(0,0,0,.55);
    }
    .nav.scrolled .brand-text{color:#f9fafb}
    .nav.scrolled .chip{background:transparent;border-color:#22c55e;color:#bbf7d0;}
    .nav.scrolled .chip:hover{background:#22c55e;color:#020817;}

    /* LAYOUT */
    main{padding:32px 0 40px}
    .breadcrumbs{font-size:.78rem;color:#9ca3af;margin-bottom:8px;}
    .breadcrumbs a{color:#6b7280}
    .breadcrumbs a:hover{color:var(--brand)}
    .article-header{margin-bottom:18px;}
    .article-title{
      margin:0 0 6px;
      font-size:clamp(26px,5.5vw,38px);
      line-height:1.15;letter-spacing:-.01em;color:#0f172a;
    }
    .article-meta{display:flex;flex-wrap:wrap;gap:.6rem 1.2rem;font-size:.78rem;color:#6b7280;}
    .meta-pill{display:inline-flex;align-items:center;gap:.3rem;}
    .meta-pill span{font-size:.82rem}
    .meta-pill-views{padding:.2rem .55rem;border-radius:999px;background:rgba(5,150,105,.09);color:#065f46;font-weight:600;transition:opacity .3s;}
    .meta-pill-views[data-state="loading"]{opacity:.55}
    .article-lead{margin:14px 0 18px;font-size:.98rem;color:#4b5563;}
    .hero-img{margin:14px auto 24px;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(15,23,42,.16);width:100%;max-width:912px;height:500px;display:block;} .hero-img img{width:100%;height:100%;object-fit:cover;display:block;}

    /* DIY SECTION */
    .diy-section{
      margin:2rem 0;padding:1.4rem 1.6rem;border-radius:16px;
      background:rgba(5,150,105,.06);border:2px solid rgba(5,150,105,.25);
    }
    .diy-section h2{margin:0 0 .8rem;font-size:1.15rem;color:#065f46;}
    .diy-section h3{margin:.8rem 0 .4rem;font-size:.95rem;color:#0f172a;font-weight:700;}
    .diy-section p{margin:0 0 .7rem;font-size:.92rem;color:#374151;}
    .diy-section ul,.diy-section ol{margin:0 0 .8rem 1.2rem;font-size:.92rem;color:#374151;}
    .diy-section li{margin-bottom:.3rem;}

    /* CUERPO */
    .article-body{font-size:.97rem;color:#111827;}
    .article-body h2{margin:36px 0 10px;font-size:1.35rem;color:#065f46;font-weight:800;letter-spacing:-.01em;border-bottom:2px solid rgba(5,150,105,.18);padding-bottom:6px;}
    .article-body h3{margin:22px 0 8px;font-size:1.05rem;color:#0d9488;font-weight:700;}
    .article-body p{margin:0 0 12px}
    .article-body ul,.article-body ol{margin:0 0 14px 1.1rem;padding:0;color:#374151;}
    .highlight{
      padding:10px 12px;border-left:3px solid var(--brand);
      background:rgba(5,150,105,.04);border-radius:10px;
      margin:14px 0;font-size:.86rem;color:#374151;
    }
    .aside-fact{
      display:block;margin:20px 0;padding:16px 20px;
      background:linear-gradient(135deg,rgba(5,150,105,.08),rgba(13,148,136,.06));
      border-left:4px solid var(--brand);border-radius:14px;
      font-size:.95rem;color:#0f172a;
    }
    .aside-fact strong{display:block;color:#065f46;margin-bottom:.35rem;font-size:.95rem;letter-spacing:.01em;}
    .glossary{margin:16px 0 0;padding:18px 22px;background:rgba(15,23,42,.03);border-radius:14px;}
    .glossary dt{font-weight:800;color:#065f46;margin-top:10px;font-size:.98rem;}
    .glossary dt:first-child{margin-top:0}
    .glossary dd{margin:4px 0 0 0;color:#374151;font-size:.92rem;line-height:1.55;}
    .article-body em{font-style:italic;color:#065f46;}

    /* CTA */
    .cta-section{
      margin:2rem 0 1rem;padding:1.4rem;border-radius:16px;
      background:rgba(5,150,105,.04);border:1px dashed rgba(5,150,105,.3);
      text-align:center;
    }
    .cta-section h3{font-size:1rem;margin:0 0 .5rem;color:#065f46;}
    .cta-section p{font-size:.84rem;color:#4b5563;margin:0 0 .9rem;}
    .cta-form{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-bottom:.9rem;}
    .cta-form label{font-size:.8rem;color:#4b5563;margin-bottom:.25rem;display:block;text-align:center;}
    .cta-form input[type="email"]{
      padding:.45rem .8rem;border:1.5px solid #d1d5db;
      border-radius:999px;font-size:.82rem;width:220px;max-width:100%;
    }
    .cta-form input[type="email"]:focus{border-color:var(--brand);outline:2px solid var(--brand);outline-offset:2px;}
    .cta-form button{
      padding:.45rem 1.1rem;border:none;border-radius:999px;
      background:var(--brand);color:#fff;font-size:.82rem;font-weight:700;cursor:pointer;
    }
    .cta-form button:hover{background:#047857;}

    .skip-link{position:absolute;top:-44px;left:6px;z-index:9999;background:#059669;color:#fff;padding:8px 16px;border-radius:0 0 8px 8px;font-size:.85rem;font-weight:600;text-decoration:none;transition:top .15s ease;}
    .skip-link:focus{top:0;}
    .back-links{margin-top:26px;display:flex;flex-wrap:wrap;gap:.6rem;font-size:.8rem;}
    button.chip{font-family:inherit;}
    footer{border-top:1px solid rgba(15,23,42,.08);padding:18px 0 22px;font-size:.78rem;color:#9ca3af;}
    footer .row{display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap;}
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">Ir al contenido principal</a>
  <!-- NAV -->
  <header class="nav" id="mainNav">
    <div class="container nav-row">
      <a class="brand" href="../../index.html">
        <img src="../../images/logo_transparente.png" alt="Guardianes del Pulque" class="brand-logo" />
        <span class="brand-text">Guardianes del Pulque</span>
      </a>
      <nav class="links">
        <a class="chip" href="../../posts.html">📰 Artículos</a>
        <a class="chip" href="../../recursos.html">🛠️ Recursos</a>
        <a class="chip" href="../../index.html#donar"><span class="emoji">💚</span> Donar</a>
      </nav>
    </div>
  </header>

  <main class="container" id="main-content">
    <div class="breadcrumbs">
      <a href="../../index.html">Inicio</a> ·
      <a href="../../posts.html">Artículos</a> ·
      ${title}
    </div>

    <header class="article-header">
      <h1 class="article-title">${title}</h1>
      <div class="article-meta">
        <div class="meta-pill">${emoji} <span>${tag}</span></div>
        <div class="meta-pill">🕒 <span>Lectura: ${readTime}</span></div>
        <div class="meta-pill">📅 <span>${dateStr}</span></div>
        <div class="meta-pill meta-pill-views" id="viewCounter" aria-label="Visitas"><span aria-hidden="true">👁️</span> <span id="viewCount">—</span></div>
      </div>
      <p class="article-lead">${excerpt}</p>
    </header>

    <figure class="hero-img">
      <img src="${slug}.png" alt="${title}" />
    </figure>

    <article class="article-body">
      ${body}
    </article>

    <!-- DIY SECTION -->
    <section class="diy-section" id="hazlo-tu-mismo">
      <h2>🛠️ Hazlo tú mismo</h2>
      ${diy}
    </section>

    <!-- CTA SUSCRIPCIÓN -->
    <div class="cta-section">
      <h3>Recibe más artículos como este</h3>
      <p>Suscríbete al boletín de Guardianes del Pulque y recibe contenido sobre pulque, bioconstrucción y defensa del territorio directamente en tu correo.</p>
      <form class="cta-form" action="#suscribirse" method="post">
        <div>
          <label for="ctaEmail">Tu correo electrónico</label>
          <input id="ctaEmail" type="email" placeholder="tu@correo.com" required />
        </div>
        <button type="submit">Suscribirme</button>
      </form>
      <a class="chip" href="../../index.html#donar"><span class="emoji">💚</span> Donar a Guardianes del Pulque</a>
    </div>

    <div class="back-links">
      <a href="../../posts.html" class="chip">← Todos los artículos</a>
      <span class="chip">${emoji} ${tag}</span>
      <button class="chip" id="btnStory" type="button">📲 Historia</button>
    </div>
  </main>

  <!-- FOOTER -->
  <footer>
    <div class="container row">
      <div style="display:flex;align-items:center;gap:.5rem">
        <img src="../../images/logo_transparente.png" alt="Guardianes del Pulque" style="height:22px;width:auto">
        <span>Guardianes del Pulque</span>
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap">
        <a class="chip" href="../../index.html#donar"><span class="emoji">💚</span> Donar</a>
        <a class="chip" href="../../posts.html">Más artículos</a>
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
  // CONTADOR DE VISITAS (abacus.jasoncameron.dev — sin DB propia)
  // Usa hash SHA-256 del slug porque abacus limita keys a 64 chars y varios slugs son mas largos.
  (async function(){
    const el=document.getElementById('viewCount');
    const wrap=document.getElementById('viewCounter');
    if(!el||!wrap)return;
    wrap.setAttribute('data-state','loading');
    const slug=location.pathname.split('/').filter(Boolean).slice(-2,-1)[0]||'home';
    let key='gdp-'+slug.slice(0,55);
    try{
      const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(slug));
      key='gdp-'+Array.from(new Uint8Array(buf)).slice(0,12).map(b=>b.toString(16).padStart(2,'0')).join('');
    }catch{}
    try{
      const r=await fetch('https://abacus.jasoncameron.dev/hit/guardianesdelpulque/'+key);
      if(!r.ok)throw new Error(r.status);
      const d=await r.json();
      const n=typeof d.value==='number'?d.value:0;
      el.textContent=n.toLocaleString('es-MX');
      wrap.removeAttribute('data-state');
    }catch{wrap.style.display='none';}
  })();
  </script>
  <script>
  // COMPARTIR COMO HISTORIA
  (function(){
    const btn=document.getElementById('btnStory');
    if(!btn)return;
    function wrapText(ctx,text,x,topY,maxW,lineH,maxLines){
      const words=text.split(' ');let line='',lines=[];
      for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;}
      if(line)lines.push(line);
      if(maxLines&&lines.length>maxLines){lines=lines.slice(0,maxLines);let last=lines[maxLines-1];while(last.length&&ctx.measureText(last+'…').width>maxW)last=last.slice(0,-1);lines[maxLines-1]=last.replace(/[\\s,;:.]+$/,'')+'…';}
      let yy=topY;
      for(const l of lines){ctx.fillText(l,x,yy);yy+=lineH;}
      return yy;
    }
    btn.addEventListener('click',async()=>{
      const orig=btn.textContent;btn.textContent='⏳';btn.disabled=true;
      try{
        const slug=location.pathname.split('/').slice(-2,-1)[0]||'';
        const coverUrl=slug?(slug+'.png'):(document.querySelector('meta[property="og:image"]')?.content||'');
        const title=(document.querySelector('meta[property="og:title"]')?.content||document.title).replace(/\\s*[—\\-]\\s*Guardianes del Pulque/,'');
        const excerpt=(document.querySelector('meta[property="og:description"]')?.content||document.querySelector('meta[name="description"]')?.content||'').trim();
        const W=1080,H=1920,IMGSLICE=1150;
        const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
        const ctx=canvas.getContext('2d');
        const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#011a10');bg.addColorStop(1,'#000c06');
        ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
        try{
          const img=new Image();
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
        else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='historia-guardianesdelpulque.png';document.body.appendChild(a);a.click();document.body.removeChild(a);}
      }catch(e){console.error(e);}
      finally{btn.textContent=orig;btn.disabled=false;}
    });
  })();
  </script>
</body>
</html>`;
}

// ── Prompt de usuario (construye el brief concreto por artículo) ───────────
function buildUserPrompt({ topic, sectionCount, forceTitle }) {
  const titleRule = forceTitle
    ? `TÍTULO FIJO (no lo cambies, úsalo tal cual en el campo "title"): "${forceTitle}"`
    : `TÍTULO: sé específico y con gancho. NO descriptivo plano ("Guía de X"), NO con dos puntos academicistas. Un titular que da ganas de clic: una promesa concreta, un dato sorpresivo, una pregunta. Ejemplos buenos: "Por qué cinco árboles plantados dentro de una milpa producen más que la milpa sola", "El día que un químico mexicano inventó la píldora anticonceptiva sin saberlo". Ejemplos malos: "La Importancia de X", "X: Un Análisis Completo".`;

  return [
    `TEMA: ${topic}`,
    ``,
    `Escribe el artículo siguiendo TODAS las reglas del system prompt. Responde SOLO con JSON válido (sin markdown, sin backticks) con esta estructura exacta:`,
    ``,
    `{"title":"...", "excerpt":"...", "tag":"...", "imageSubjects":"...", "body":"<h2>...</h2><p>...</p>..."}`,
    ``,
    titleRule,
    ``,
    `EXCERPT: es GANCHO, no resumen descriptivo. Máximo 140 caracteres. Debe dar curiosidad, no anunciar el tema.`,
    `  MAL: "Explora el impacto de la agroforestería en la sostenibilidad y el desarrollo rural."`,
    `  BIEN: "Por qué cinco árboles plantados dentro de una milpa pueden producir más que la misma milpa sola."`,
    ``,
    `IMAGE_SUBJECTS: lista en INGLÉS de 4-6 elementos visuales concretos separados por comas, que ilustren LITERALMENTE el tema del artículo. Esto se usa como prompt visual para DALL-E.`,
    `- Describe el CONTENIDO REAL del tema. Si es neurociencia → cerebros, neuronas, sinapsis; si es química → moléculas, reacciones, instrumentos; si es astronomía → planetas, telescopios, constelaciones; si es biología celular → células, organelos, microscopio; si es física → partículas, ondas, experimentos.`,
    `- NO agregues catrinas, sombreros, mariachis, calaveras de azúcar, ni "escenas del campo mexicano" si el tema NO lo pide. Esos clichés contaminan la imagen.`,
    `- Si el tema SÍ es del campo o cultura mexicana (milpa, maguey, fermentos tradicionales, oficios rurales, comunidades indígenas, fauna mexicana), entonces sí incluye esos elementos literalmente — pero solo si el tema lo justifica.`,
    `- Sin texto, sin etiquetas, sin palabras en la imagen.`,
    `- Ejemplos:`,
    `   Tema "Cerebros bicamerales": "giant human brain cross-section, both hemispheres symmetric, corpus callosum bridge, neurons firing across midline, dendrites weaving, halftone cortex texture"`,
    `   Tema "Nixtamalización del maíz": "hands grinding nixtamal on metate, comal with tortillas, lime water in clay pot, masa being patted, corn kernels turning gold"`,
    `   Tema "Patrones de Turing en pieles": "majestic jaguar with rosette spots, zebra with bold stripes, reaction-diffusion waves rippling across their fur, mathematical spiral patterns emerging organically"`,
    ``,
    `BODY (HTML, sin <style> ni <script>, sin incluir el título principal):`,
    `- Exactamente ${sectionCount} secciones con <h2>. Los h2 deben ser específicos y cargados, no genéricos ("La importancia de…").`,
    `- Cada sección: 3-4 párrafos <p> de 70-130 palabras cada uno. Alterna con listas <ul>/<ol> cuando el contenido lo pida (no siempre).`,
    `- Artículo completo: 1900-2600 palabras.`,
    `- Primer párrafo (dentro de la primera sección): ESCENA CONCRETA — persona con nombre, lugar, gesto físico. Regla #1 del system.`,
    ``,
    `ELEMENTOS OBLIGATORIOS (si falta uno, el artículo está mal):`,
    `1. Por cada sección h2: 1+ ancla geográfica/biológica REAL y verificable (ver regla 2 del system: estado, ecosistema, comunidad, altitud, especie con binomial) + 1+ detalle sensorial. Dato numérico SOLO si lo conoces con certeza pública — opcional, NO obligatorio. Vale más una sección sin números que una con cifras inventadas. PROHIBIDO inventar estudios con investigador+año+institución+%, costos exactos, o micro-medidas experimentales.`,
    `2. Nombres científicos binomiales en <em> cuando aparezcan especies (ej. <em>Agave salmiana</em>).`,
    `3. 1 o 2 <aside class="aside-fact"><strong>Dato que rompe el molde:</strong> ...</aside> con el giro contraintuitivo del artículo — algo genuinamente sorprendente, no un dato trivial.`,
    `4. Citas directas entre comillas: OPCIONAL, no obligatorio. PROHIBIDO inventar atribuciones tipo "según la investigadora X de la UNAM" o "en palabras del Dr. Y" si no conoces a esa persona y su frase real con certeza pública. Patrón prohibido: nombre propio + institución + cita inventada (es exactamente lo que el modelo tiende a fabricar para cumplir el requisito). Alternativas válidas: (a) cita real verificable de figura conocida que sí dijo o escribió eso públicamente, con fuente identificable; (b) voz parafraseada SIN comillas; (c) frase atribuida a un personaje anónimo arquetípico del campo ("don X, campesino de…", "doña Y, partera de…") — esa es licencia narrativa permitida. PREFERIBLE artículo sin cita directa que con atribución falsa.`,
    `5. SECCIÓN PRÁCTICA OBLIGATORIA: AL MENOS UNA de las secciones h2 debe ser APLICABLE — con información que permita a un lector intentar hacer el proyecto en la vida real. Debe incluir elementos concretos como: especies o materiales específicos con nombre, cantidades o medidas, temporadas o tiempos, espaciamientos, temperaturas, costos aproximados en pesos mexicanos, dónde conseguir insumos (viveros regionales, tianguis, colectivos), errores comunes que se deben evitar. Esta sección NO reemplaza al "Hazlo tú mismo" final — es contenido técnico-práctico dentro del cuerpo del artículo, con detalle que el DIY (por su brevedad) no puede cubrir.`,
    `6. DESCRIPCIÓN TÉCNICA DE MÉTODOS: si el tema involucra una técnica, oficio, proceso científico, práctica tradicional o metodología (bioconstrucción, fermentación, muralismo, nixtamalización, curtido, destilación, cultivo, etc.), DEDICA espacio a explicar CÓMO se hace paso a paso, con materiales, proporciones, tiempos, temperaturas, herramientas. El artículo debe dejar al lector con capacidad de entender la técnica, no solo admirarla desde lejos. Si el tema es una persona histórica con una técnica propia (Diego Rivera y el fresco, Mario Molina y la química atmosférica), describe esa técnica con precisión documentada.`,
    `7. Al FINAL del body, sección <h2>Glosario</h2> con <dl class="glossary"> y 5-7 términos técnicos del artículo (dt/dd). Las definiciones son de 1-2 oraciones, concretas, no circulares.`,
    `8. Penúltima sección (antes del glosario): cierra con una escena, imagen o llamado específico — nunca "en conclusión", nunca resumiendo.`,
    ``,
    `TAG: elige UNO de: ${VALID_TAGS.join(", ")}. Si ninguno encaja, propone uno nuevo de 1 palabra.`,
    ``,
    `AUTOCHEQUEO antes de responder, en orden:`,
    `  (a) ¿Inventaste algún estudio con la fórmula "(año + investigador + institución + porcentaje o cifra exacta)"? Si sí, elimina el estudio o reescribe como mecanismo general sin atribución falsa. Esta es la verificación MÁS IMPORTANTE.`,
    `  (b) ¿Inventaste un costo en pesos, una velocidad de viento local, una distancia experimental precisa, o una cifra de "X% menos plagas" sin saberla con certeza? Si sí, elimínala o conviértela en descripción cualitativa.`,
    `  (c) ¿Alguna persona nombrada real (Mario Molina, Diego Rivera, etc.) tiene escenas/diálogos/gestos que NO están documentados públicamente? Si sí, reescribe como información verificable (lo que publicó, técnica que usó, año del Nobel, etc.).`,
    `  (c+) ¿Hay alguna cita entre comillas atribuida a un investigador/académico/autor? Verifica: (i) ¿esa persona existe realmente como figura pública identificable? (ii) ¿dijo o escribió esa frase con certeza? Si la persona NO la reconoces como figura pública, o si no estás seguro de la frase, ELIMINA la cita o conviértela en parafraseo sin comillas. Patrón típico de invento: "según la investigadora X de la UNAM/Cinvestav...". No lo hagas.`,
    `  (c++) ¿Atribuiste a una figura histórica real (Marker, Pasteur, etc.) algo que NO hizo realmente — afiliación incorrecta, molécula equivocada, año mal? Verifica los hechos básicos antes de afirmar. Si dudas de un detalle factual sobre la persona, omítelo o usa lenguaje cauto ("hacia mediados del siglo XX", "químicos trabajando con saponinas esteroideas").`,
    `  (d) ¿Cada h2 tiene ancla geográfica/biológica verificable + detalle sensorial? Si no, corrige.`,
    `  (e) ¿Alguna frase de tu borrador podría caber idéntica en un artículo sobre otro tema? Si sí, reescríbela con anclaje específico.`,
    `  (f) ¿Usaste alguna frase prohibida del system (reverbera, tapiz, sinergia, etc.)? Si sí, reescríbela.`,
  ].join("\n");
}

// ── Flujo principal ────────────────────────────────────────────────────────
async function generateArticle() {
  const postsPath = path.join(__dirname, "..", "posts.json");
  const posts = JSON.parse(fs.readFileSync(postsPath, "utf-8"));

  // Leer --tag y --topic opcionales desde CLI
  const tagArg = process.argv.find((a) => a.startsWith("--tag="))?.split("=")[1]
    || process.argv[process.argv.indexOf("--tag") + 1];
  const topicArg = process.argv.find((a) => a.startsWith("--topic="))?.split("=")[1]
    || (process.argv.includes("--topic") ? process.argv[process.argv.indexOf("--topic") + 1] : null);

  // Si se especificó --topic, usarlo directamente
  let topic;
  if (topicArg) {
    topic = topicArg;
  } else {
    // Evitar temas ya usados (por topic exacto O por keywords de títulos existentes)
    const STOPWORDS = new Set(["el","la","los","las","de","del","en","y","a","un","una","por","con","su","sus","al","que","se","es","son","como","para","más","un","o","e","i","u","lo","le","les","hay","sin","no","si","fue"]);
    const usedTopics = new Set(posts.map((p) => p.topic).filter(Boolean));
    // Extraer palabras clave de todos los títulos existentes
    const titleKeywords = new Set(
      posts.flatMap((p) =>
        (p.title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
          .replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter((w) => w.length > 3 && !STOPWORDS.has(w))
      )
    );
    let availableTopics = TOPICS.filter((t) => {
      if (usedTopics.has(t)) return false;
      // Bloquear solo si MAS del 50% de las palabras clave del topic ya aparecen en títulos existentes
      const topicWords = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
        .replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter((w) => w.length > 3 && !STOPWORDS.has(w));
      if (topicWords.length === 0) return true;
      const overlap = topicWords.filter((w) => titleKeywords.has(w)).length;
      return overlap / topicWords.length < 0.5;
    });

    // Si se especificó --tag, filtrar temas que empiecen con ese tag
    if (tagArg) {
      const norm = tagArg.toLowerCase();
      const tagged = availableTopics.filter((t) => t.toLowerCase().startsWith(norm));
      if (tagged.length > 0) availableTopics = tagged;
      else {
        // Buscar en todos los topics (aunque ya usados) como fallback
        const fallback = TOPICS.filter((t) => t.toLowerCase().startsWith(norm));
        if (fallback.length > 0) availableTopics = fallback;
      }
    }

    topic = pick(availableTopics.length > 0 ? availableTopics : TOPICS);
  }

  const profile = pick(TONE_PROFILES);
  const [minSec, maxSec] = profile.sectionRange;
  const sectionCount = randInt(minSec, maxSec);
  const temperature = randFloat(...profile.temperatureRange);

  console.log(`Tema:  ${topic}`);
  console.log(`Tono:  ${profile.name} (${sectionCount} secciones, temp ${temperature.toFixed(2)})`);

  // 1. Generar articulo con GPT
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: profile.systemPrompt },
      {
        role: "user",
        content: buildUserPrompt({ topic, sectionCount, forceTitle: null }),
      },
    ],
    temperature,
    response_format: { type: "json_object" },
  });

  function tryParseJson(raw) {
    try { return JSON.parse(raw); } catch {}
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch {}
    // Intentar reparar: escapar saltos de línea dentro de strings
    try {
      const repaired = match[0].replace(/("body"\s*:\s*")([\s\S]*?)("(?:\s*,|\s*\}))/g,
        (_, pre, content, suf) => pre + content.replace(/\n/g, "\\n").replace(/\r/g, "") + suf);
      return JSON.parse(repaired);
    } catch {}
    return null;
  }

  let raw = completion.choices[0].message.content.trim();
  let article = tryParseJson(raw);

  // Retry hasta 2 veces si el JSON es inválido
  for (let retry = 0; !article && retry < 2; retry++) {
    console.log(`JSON inválido, reintentando GPT (intento ${retry + 2})...`);
    const retryCompletion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: profile.systemPrompt },
        {
          role: "user",
          content:
            buildUserPrompt({ topic, sectionCount, forceTitle: null }) +
            `\n\nCRÍTICO: Responde JSON válido en una sola línea para el body (usa espacios, no saltos de línea literales dentro de los strings JSON).`,
        },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });
    raw = retryCompletion.choices[0].message.content.trim();
    article = tryParseJson(raw);
  }
  if (!article) throw new Error("GPT no devolvió JSON válido tras 3 intentos");

  // 2. Generar sección "Hazlo tú mismo"
  const diyCompletion = await openai.chat.completions.create({
    model: DIY_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Eres instructor de saberes rurales mexicanos. Instrucciones claras, físicas, que funcionan. " +
          "Nada de prosa motivacional vacía: materiales reales con cantidades exactas, pasos con tiempos y temperaturas, " +
          "errores comunes señalados. Nunca digas 'disfruta del proceso' ni 'siente la magia'. El lector va a hacer algo, " +
          "no a leer autoayuda. Idioma: español mexicano.",
      },
      {
        role: "user",
        content:
          `El artículo es sobre: "${article.title}".\n\n` +
          "Escribe la sección 'Hazlo tú mismo' con una actividad SIMPLE, física, que alguien en casa pueda hacer con materiales accesibles en México.\n\n" +
          "Responde SOLO con JSON válido (sin markdown):\n" +
          '{"diy_title": "Nombre concreto de la actividad (no genérico)", ' +
          '"intro": "2-3 oraciones que dicen qué vas a hacer, cuánto tarda y qué vas a obtener — sin motivación vacía", ' +
          '"materials": ["material con cantidad exacta, ej: \'2 kg de adobe fresco\'", ...], ' +
          '"steps": ["paso con tiempo/temperatura/medida cuando aplique, ej: \'Deja reposar 4 horas a la sombra, hasta que la superficie cristalice\'", ...], ' +
          '"tip": "Un error común que la gente comete o un truco específico — no generalidades"}\n\n' +
          "Máximo 6 pasos, máximo 7 materiales. Lo que obtienes al final debe ser tangible y medible.",
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
    const mats = diyData.materials.map((m) => `<li>${m}</li>`).join("\n        ");
    const stps = diyData.steps.map((s) => `<li>${s}</li>`).join("\n        ");
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

  // 3. Validar tag (si se pasó --tag, forzarlo)
  const tag = tagArg && VALID_TAGS.includes(tagArg) ? tagArg : validateTag(article.tag);
  const emoji = TAG_EMOJI[tag] || "📝";

  // 3. Generar slug unico
  const baseSlug = slugify(article.title);
  const slug = uniqueSlug(baseSlug);

  // 4. Generar imagen con DALL-E (muralismo mexicano + sub-estilo único)
  console.log("Generando imagen DALL-E...");

  // Leer estilos ya usados para evitar repetir
  const usedStyles = new Set(posts.map((p) => p.imageStyle).filter(Boolean));
  const availableStyles = IMAGE_SUBSTYLES.filter((s) => !usedStyles.has(s.name));
  const chosenStyle = pick(availableStyles.length > 0 ? availableStyles : IMAGE_SUBSTYLES);
  const palette = TAG_PALETTES[tag] || DEFAULT_PALETTE;

  console.log(`Estilo imagen: ${chosenStyle.name}`);

  const TAG_NOTES = {
    Pulque:    " Pulque is a traditional Mexican fermented drink, milky white and opaque — depict it white and cloudy. The maguey pulquero is Agave salmiana: a massive plant with long, wide, fleshy, blue-grey-green leaves with spines along the edges.",
    Naturaleza:" The maguey pulquero (Agave salmiana) has long, wide, fleshy, blue-grey-green leaves — use it if maguey appears.",
    Territorio:" The maguey pulquero (Agave salmiana) has long, wide, fleshy, blue-grey-green leaves — use it if maguey appears.",
  };
  const pulqueNote = TAG_NOTES[tag] || "";

  // ── Estilo de imagen: pop-art por defecto para todos los artículos ────────
  const useFresco = false;
  console.log(`Estilo imagen: pop-art`);

  // Sujetos visuales: vienen de GPT (article.imageSubjects). Si por alguna razón
  // no llegaron, usamos el título como último recurso — pero sin imponer
  // "escena mexicana rural", porque contaminaba temas abstractos con clichés
  // (catrinas, sombreros) cuando el contenido era neurociencia, química, etc.
  const subjects = (article.imageSubjects || article.title || "").toString().trim();

  // ESTILO FRESCO MONUMENTAL (temas serios: territorio, cultura, saberes...):
  const frescoBasePrompt =
    `Monumental fresco in the style of Mexican muralism, continuous composition without panels or divisions. ` +
    `Subject: "${article.title}". Depicted elements: ${subjects}.${pulqueNote} ` +
    `Color palette: ${palette}. ` +
    `Broad brushstrokes, monumental volumes, natural mineral pigments visible in texture, dramatic light, ` +
    `depth and movement in the composition, figures with weight and dignity. ` +
    `SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no panels, no grids, no borders. ` +
    `NO photography, NO 3D render, NO text, NO letters, NO words, NO labels, NO typography, NO writing of any kind.`;
  const frescoFallbackPrompt =
    `Monumental fresco painting style, wide continuous scene. ` +
    `Depicted elements: ${subjects}. ` +
    `Color palette: ${palette}. ` +
    `Broad brushstrokes, monumental volumes, dramatic light, no panels, no divisions. ` +
    `SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins. ` +
    `NO text, NO letters, NO words, NO typography, NO writing of any kind.`;

  // ESTILO POP ART (temas ligeros: recetas, música, insectos, arte, cocina...):
  const popArtBasePrompt =
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Subject: "${article.title}". Depicted elements: ${subjects}.${pulqueNote} ` +
    `Use these color families in the illustration: ${palette}. ` +
    `Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look, vibrant and expressive composition. ` +
    `The ENTIRE 1536x1024 canvas must be a SINGLE continuous illustrated scene from edge to edge. The scene itself fills 100% of the canvas. No portion of the canvas may be blank, empty, or occupied by abstract color fields. ` +
    `ABSOLUTELY FORBIDDEN elements (these must NOT appear anywhere in the image): color palette strips, color swatches, color sample bars, vertical color columns, horizontal color bands, reference color charts, side panels showing colors, isolated rectangles of solid color, color chips, Pantone-style blocks, any design-reference element showing the palette. ` +
    `Also forbidden: divisions, panels, grids, borders, frames, vignettes, margins, white space, empty bands, comic panel separators, before/after splits, diptychs, triptychs. ` +
    `Forbidden content: photography, 3D render, text, letters, words, labels, typography, writing, signatures, watermarks, urban buildings, cityscape skyline.`;
  const popArtFallbackPrompt =
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Wide continuous scene filling the entire canvas. ` +
    `Depicted elements: ${subjects}. ` +
    `Use these color families within the illustration: ${palette}. ` +
    `Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, high contrast, screen-print look. ` +
    `SINGLE continuous illustrated scene from edge to edge filling 100% of the canvas. ` +
    `ABSOLUTELY FORBIDDEN: color palette strips, color swatches, color bars, vertical color columns, side panels with color samples, reference color charts, isolated color blocks, divisions, grids, panels, borders, frames, margins, text, letters, typography.`;

  const basePrompt    = useFresco ? frescoBasePrompt    : popArtBasePrompt;
  const fallbackPrompt = useFresco ? frescoFallbackPrompt : popArtFallbackPrompt;

  let imageBuffer;
  for (const prompt of [basePrompt, fallbackPrompt]) {
    try {
      const imageResponse = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1536x1024",
      });
      imageBuffer = Buffer.from(imageResponse.data[0].b64_json, "base64");
      break;
    } catch (e) {
      console.log("Prompt rechazado, intentando alternativo...");
    }
  }
  if (!imageBuffer) throw new Error("No se pudo generar imagen");

  // Recortar márgenes blancos, recortar franjas planas (paletas/marcos) y redimensionar a 912px
  let _trimmed = await sharp(imageBuffer).trim({ threshold: 80 }).toBuffer();
  _trimmed = await cropFlatBorders(_trimmed);
  imageBuffer = await sharp(_trimmed).resize(IMAGE_WIDTH).toBuffer();

  // 5. Guardar imagen
  const artDir = path.join(__dirname, "..", "articulos", slug);
  fs.mkdirSync(artDir, { recursive: true });
  fs.writeFileSync(path.join(artDir, `${slug}.png`), imageBuffer);

  // 6. Generar y guardar HTML
  const now = new Date();
  const dateStr = fechaMx(now);
  const html = buildHTML({
    title: article.title,
    excerpt: article.excerpt,
    body: article.body,
    diy,
    tag,
    emoji,
    slug,
    dateStr,
    isoDate: now.toISOString().split("T")[0],
  });
  fs.writeFileSync(path.join(artDir, `${slug}.html`), html);

  // 7. Actualizar posts.json
  posts.unshift({
    tag,
    title: article.title,
    excerpt: article.excerpt,
    date: dateStr,
    url: `articulos/${slug}/${slug}.html`,
    cover: `articulos/${slug}/${slug}.png`,
    imageStyle: chosenStyle.name,
    topic,
  });
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2) + "\n");

  console.log(`\nCreado: articulos/${slug}/${slug}.html`);
  console.log(`Cover:  articulos/${slug}/${slug}.png`);
  console.log(`Tag:    ${emoji} ${tag}`);
  console.log(`Titulo: ${article.title}`);
  console.log(`Fecha:  ${dateStr}`);
  console.log(`Tono:   ${profile.name}`);
}

// Exponer helpers para que otros scripts (regen-all-articles.js) puedan reusar
// la misma lógica de prompts/plantilla sin duplicar código.
module.exports = {
  openai,
  MODEL,
  DIY_MODEL,
  TONE_PROFILES,
  VALID_TAGS,
  TAG_EMOJI,
  DEFAULT_TAG,
  buildHTML,
  buildUserPrompt,
  slugify,
  validateTag,
  fechaMx,
  pick,
  randInt,
  randFloat,
  readingTime,
};

if (require.main === module) {
  generateArticle().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
