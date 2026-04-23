const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const OpenAI = require("openai");
const sharp = require("sharp");

const openai = new OpenAI();
const IMAGE_WIDTH = 912;
const SITE_URL = "https://guardianesdelpulque.org";

// ── Temas ──────────────────────────────────────────────────────────────────
const TOPICS = [
  // === Saberes rurales y tradicionales (base) ===
  "Pulque, aguamiel, fermentacion tradicional, maguey pulquero, tlachiquero",
  "Bioconstruccion con tierra, adobe, bahareque, tierra compactada, techos verdes",
  "Naturaleza, restauracion ecologica, polinizadores, humedales, suelos vivos",
  "Maguey, usos del agave, fibras, ixtle, pencas",
  "Agua, manantiales, derechos del agua, rios, acuiferos, gestion comunitaria del agua",
  "Defensa del territorio, autonomia comunitaria, derechos indigenas, tierra y agua",
  "Abejas, apicultura tradicional, colmenas nativas, miel, meliponas, polinizacion",
  "Fermentos tradicionales mexicanos, tepache, vinagre artesanal, atole agrio, fermentacion lactica, probioticos naturales",
  "Composta, lombricomposta, manejo de residuos organicos, humus, suelo fertil, abono casero",
  "Semillas criollas, banco de semillas, variedades nativas, reproduccion vegetal, seleccion de semillas",
  "Agroforesteria, sistemas silvopastoriles, cercas vivas, arboles en parcelas, manejo forestal comunitario",
  "Medicina tradicional, plantas medicinales, herbolaria mexicana, curanderismo, remedios naturales",
  "Fuego, fogones de lena, cocina tradicional, carbon vegetal, manejo del fuego en el campo",
  "Comunidad, asambleas comunitarias, tequio, usos y costumbres, organizacion indigena, gobernanza local",
  "Arte tradicional mexicano, muralismo, artesanias, ceramica, textiles, papel amate, expresion cultural",
  "Economia solidaria, trueque, mercados locales, autogestion comunitaria, finanzas rurales",
  "Ganaderia sustentable, razas criollas, pastoreo rotacional, manejo regenerativo, trashumancia",
  "Cosmologia indigena, calendario ritual, tonalpohualli, cosmovision nahua, saberes ancestrales, espiritualidad",
  "Permacultura, diseno regenerativo, zonas de permacultura, observacion del paisaje, sistemas naturales",
  "Hongos, cultivo de setas, micorrizas, fungi medicinales, recoleccion de hongos silvestres",
  "Aves silvestres, aves de corral criollas, corredores biologicos, ornitologia, biodiversidad aviar",
  "Pesca artesanal, pesca tradicional, lagos y rios, artes de pesca, pesca sustentable",
  "Barro, ceramica tradicional, alfareria, arcilla, hornos de barro, tradicion alfarera mexicana",
  "Madera, carpinteria tradicional, maderas locales, construccion en madera, manejo forestal",
  "Fibras naturales, henequen, palma, mimbre, telar tradicional, textiles naturales mexicanos",
  "Colorantes naturales, anil, cochinilla, palo de brasil, tintes vegetales, tintoreria tradicional",
  "Sal, salineras tradicionales, sal de grano, preservacion de alimentos, comercio de sal",
  "Cacao, cacao criollo, pinole, tejate, ceremonias del cacao, chocolate artesanal",
  "Pan, pan de horno de lena, masa madre, pan de muerto, panaderia tradicional mexicana",
  "Escamoles, caviar azteca, hormigas Liometopum, recoleccion estacional en raices de maguey y mezquite",
  "Chinicuil y meocuil, gusanos rojo y blanco del maguey, biologia de los gusanos del mezcal",
  "Ahuautle, caviar mexicano, huevos de mosca axayacatl del Lago de Texcoco, platillo casi perdido",
  "Hormigas chicatanas, vuelo nupcial de una noche al ano tras las primeras lluvias, recoleccion en Oaxaca",
  "Jumiles de Taxco, Atizies taxcoensis, insecto que se come vivo, festival y cosmovision nahua",
  "Suelo vivo, erosion del suelo, microvida del suelo, restauracion edafica, analisis de tierra",
  "Energia alternativa, energia solar comunitaria, biogas, lena sostenible, autonomia energetica",
  "Migracion rural, comunidades en diaspora, retorno al campo, identidad comunitaria, remesas culturales",
  "Lenguas indigenas, nahuatl, otomi, mazateco, revitalizacion linguistica, lenguas originarias de Mexico",
  "Infancia en el campo, educacion comunitaria, juegos tradicionales, crianza con la tierra, ninez rural",
  "Mujeres en el campo, saberes femeninos, parteria, huertos familiares, liderazgo comunitario femenino",
  "Musica tradicional mexicana, sones, jarana, teponaztle, cantos de trabajo, musica ritual",
  "Psicodelicos sagrados, peyote, hongos sagrados, temazcal, plantas de poder, medicina ancestral visionaria",
  "Fermentos, fermento de col morada, fermentacion lactica de col morada mexicana, probioticos caseros con col morada, receta tradicional paso a paso, beneficios del fermento de col morada",

  // === Coevolucion y polinizacion ===
  "Polinizacion del maguey por murcielagos magueyeros, Leptonycteris, vuelo nocturno, coevolucion agave-quiroptero",
  "Polinizacion del cacao por mosquitas Forcipomyia, los polinizadores diminutos del chocolate",
  "Mariposa monarca, migracion transcontinental, asclepias, oyamel, ruta de tres generaciones",
  "Colibries de Mexico, flores tubulares, coevolucion de picos y corolas, vuelo estacionario",
  "Abejas meliponas sin aguijon, melipona beecheii, miel maya, panales en espiral",
  "Coevolucion yuca y polilla yucca, mutualismo obligado entre planta e insecto",
  "Higos y avispas del higo, simbiosis dentro del fruto, sincronia evolutiva",
  "Polinizacion por escarabajos en magnolias, polinizadores ancestrales antes de las abejas",
  "Hormigas y acacias, mutualismo defensivo, hormigas guardianas de plantas espinosas",
  "Liquenes, simbiosis hongo-alga, indicador de aire limpio, supervivientes extremos",
  "Micorrizas en raices, simbiosis de hongos y plantas, intercambio de nutrientes",
  "Termitas y protozoos intestinales, digestion de celulosa, simbiosis dentro del intestino",
  "Coral y zooxantelas, simbiosis bajo amenaza, blanqueamiento por calor",
  "Polinizacion por moscas en aros y plantas que huelen a carrona",
  "Murcielagos polinizadores nocturnos, flores que abren de noche, coevolucion olfato-aroma",
  "Polinizacion por palomas y aves frugivoras en arboles tropicales",
  "Mariposas nocturnas y plantas, evolucion paralela de proboscis y nectarios profundos",
  "Hormigas cortadoras de hojas y hongos, primer caso de agricultura no humana",
  "Pez payaso y anemonas, simbiosis defensiva mutua en arrecifes",
  "Cleaner fish, peces limpiadores y sus clientes, estaciones de limpieza en arrecifes",
  "Avispas parasitoides y orugas, manipulacion conductual del huesped",
  "Lobos y cuervos, cooperacion entre depredador y carronero",
  "Tiburones y pez remora, transporte y limpieza, comensalismo marino",
  "Reproduccion del cacao por animales arboricolas, monos y dispersores",
  "Coevolucion lemur-baobab, polinizadores nocturnos de Madagascar",
  "Sincronia de floracion masiva en bambues, defensa por saciedad de depredadores",
  "Polinizacion engano en orquideas, flores que imitan abejas hembras",
  "Plantas que pagan a las hormigas con nectar extrafloral, defensa contratada",
  "Cucaracha de Madagascar como dispersora de semillas, insectos olvidados",
  "Avispas higueras del trópico americano y la mecánica del syconium",

  // === Animales que transforman paisajes ===
  "Bisonte americano, restauracion de praderas en Janos, pastoreo y biodiversidad",
  "Castores ingenieros, presas naturales, humedales, hidrologia restaurada",
  "Lobos del Yellowstone, cascada trofica, recuperacion de rios y bosques",
  "Lobo mexicano, reintroduccion en Sierra Madre, depredador apice perdido",
  "Murcielagos frugivoros, dispersion de semillas en selvas tropicales mexicanas",
  "Tortugas marinas, anidacion en duna, transporte de nutrientes oceano-playa",
  "Tiburones, depredador apice, equilibrio de arrecifes y oceano",
  "Elefantes africanos como ingenieros del paisaje, dispersores y abridores de claros",
  "Hipopotamos como bombas de nutrientes entre rio y pradera",
  "Orcas como reguladoras de poblaciones marinas, depredador apice oceanico",
  "Salmones que llevan nutrientes del oceano al bosque, esqueletos en rios",
  "Buitres y carroneros, servicios ecosistemicos de limpieza y prevencion de enfermedades",
  "Lombrices de tierra como ingenieras del suelo, aireacion y fertilidad",
  "Tepezcuintle y dispersores tropicales en selvas mexicanas",
  "Coyote como mesodepredador adaptable, ecologia urbana y rural",
  "Jaguar como controlador de poblaciones en selvas mexicanas",
  "Aguila harpia y grandes rapaces tropicales como reguladoras",
  "Tortugas terrestres como dispersoras de semillas duras",
  "Hormigas legionarias en selvas, control de plagas a gran escala",
  "Manatíes como mantenedores de pastos marinos",
  "Perro llanero, mantenedor de praderas mexicanas y especies clave",
  "Ballenas como bombas biologicas, fertilizacion de oceano y captura de carbono",
  "Linces y pumas, control de herbivoros y salud de bosques",
  "Pajaros carpinteros como creadores de cavidades para otras especies",
  "Iguana negra y verde, reptiles emblematicos de bosques tropicales mexicanos",

  // === Matematicas en la naturaleza ===
  "Numero aureo y Fibonacci en girasoles, pinas, conchas, ramas y hojas",
  "Fractales en helechos, brocoli romanesco, costas y ramificaciones",
  "Geometria hexagonal de la colmena, eficiencia matematica de las abejas",
  "Espirales logaritmicas en nautilus, galaxias, huracanes y caracoles",
  "Patrones de Turing en pieles, manchas del jaguar y rayas de cebra",
  "Filotaxis, disposicion de hojas para maximizar luz, matematica de las plantas",
  "Ecuaciones de poblacion, depredador-presa, modelo Lotka-Volterra en ecologia",
  "Topologia de telaranas, geometria de la trampa optima",
  "Ondas Belousov-Zhabotinsky en patrones biologicos, reacciones quimicas oscilantes",
  "Geometria de panal, problema del empaquetamiento eficiente, teorema de Hales",
  "Cero maya, descubrimiento matematico independiente, sistema vigesimal",
  "Calendario maya, matematicas mesoamericanas y ciclos astronomicos",
  "Astronomia teotihuacana, alineacion de piramides y calendario de Venus",
  "Teselaciones en panal, escamas de pez y pieles de reptil",
  "Ramificacion fractal de pulmones, vasos sanguineos y rios",
  "Series de Fibonacci en reproduccion de conejos y abejas",
  "Algoritmos de hormigas y enjambre, inteligencia colectiva en la naturaleza",
  "Geometria de cristales y simetria en minerales",
  "Calculo del vuelo de aves migratorias, optimizacion de rutas",
  "Matematicas del oleaje, ondas y fisica del mar",
  "Curvas catenarias en telaranas y puentes naturales",
  "Teoria de juegos en evolucion, estrategias evolutivamente estables",
  "Fullerenos y geometria de pelotas de futbol, matematicas en moleculas",
  "Fractales en sistemas vasculares de hojas y rios planetarios",
  "Geometria de copos de nieve, simetria hexagonal y formacion del cristal",

  // === Quimica fascinante ===
  "Quimica del aguamiel, sacarosa, fructosa y fermentacion alcoholica del maguey",
  "Capsaicina del chile, receptores TRPV1, evolucion del picante como defensa",
  "Quimica del cacao, teobromina, feniletilamina, anandamida y neurotransmisores",
  "Pigmentos naturales, clorofila, antocianinas, carotenoides, betalainas",
  "Alcaloides sagrados, mescalina del peyote, psilocibina de hongos, DMT",
  "Sapogeninas del maguey, fitoquimica del agave, esteroides naturales",
  "Veneno de viboras mexicanas, cascabel, nauyaca, componentes y antiveneno",
  "Cafeina y teobromina, evolucion como defensa contra insectos",
  "Toxinas de ranas dardo, alcaloides batracotoxina y dieta alimenticia",
  "Bioluminiscencia, luciferina y luciferasa, quimica de la luz fria",
  "Aromas de bosque, terpenos, monoterpenos y comunicacion vegetal",
  "Feromonas en insectos, quimica de la atraccion sexual",
  "Veneno de abejas y avispas, melitina y reaccion alergica",
  "Quimica del cafe, tostado, aroma y reaccion de Maillard",
  "Quimica del vino y la cerveza, fermentacion y compuestos volatiles",
  "Acidos del nopal, oxalatos, acido isocitrico y propiedades",
  "Quimica de la mostaza y el ajo, aliinasa y compuestos sulfurados",
  "Acido salicilico en sauces, origen de la aspirina",
  "Quimica del olor a tierra mojada, geosmina y bacterias del suelo",
  "Quimica de la curcuma, curcumina y propiedades antiinflamatorias",
  "Polifenoles del cacao y vino, antioxidantes y salud cardiovascular",
  "Acidos grasos omega 3 en pescados, EPA, DHA y cerebro",
  "Vitamina C, escorbuto, citricos y descubrimiento historico",
  "Quimica de los esmaltes ceramicos, oxidos minerales y coccion",
  "Tintes naturales, indigotina del anil y carmin de cochinilla",
  "Acidos humicos del suelo, quimica de la materia organica",
  "Hormonas vegetales, auxinas, giberelinas y citoquininas",
  "Quimica del temazcal, vapor, sales y limpieza ritual",
  "Quimica del fuego, combustion, llama y reacciones de oxidacion",
  "Quimica de los aromas florales, biosintesis de fragancias",

  // === Fisica en la naturaleza ===
  "Vuelo del colibri, aleteo a 80 Hz, hover y vuelo invertido, fisica del beat",
  "Telaranas, propiedades mecanicas de la seda de arana, mas fuerte que el acero",
  "Hidraulica de los arboles, transpiracion y capilaridad, columna de agua de 100 metros",
  "Ecolocalizacion de murcielagos y delfines, sonar biologico de alta resolucion",
  "Camuflaje y optica de pulpos, cromatoforos y mimetismo activo",
  "Vuelo de insectos, aerodinamica a baja escala y vortices",
  "Magnetorrecepcion en aves migratorias, brujula biologica",
  "Termorregulacion en serpientes y reptiles, ectotermia y calor",
  "Pelo polar y aislamiento termico, fisica de la conservacion del calor",
  "Estructura de huevos y resistencia mecanica de la cascara",
  "Saltos del pulgon y mecanica del salto explosivo",
  "Vuelo de las semillas, fisica de la dispersion por viento",
  "Fisica de las olas, movimiento ondulatorio en oceano y mareas",
  "Tornados y huracanes, fisica atmosferica y formacion en Golfo de Mexico",
  "Rayos y tormentas, fisica de la descarga electrica",
  "Fisica de los geiseres y manantiales termales",
  "Acustica de cuevas y resonancia en arquitecturas naturales",
  "Fisica del temazcal, vapor y termodinamica del bano ritual",
  "Fisica del arco iris y refraccion de la luz en gotas",
  "Sonido de las ballenas, fisica de la comunicacion submarina",
  "Vuelo de aves planeadoras, termales y aerodinamica de gran escala",
  "Vibracion de cuerdas en instrumentos tradicionales, fisica musical",
  "Fisica del temblor, ondas P y S, sismologia mexicana",
  "Volcanes mexicanos, fisica del magma y erupciones del Popocatepetl",
  "Cristales y simetria, fisica del estado solido en la naturaleza",

  // === ADN, genetica y evolucion ===
  "Maices criollos en peligro, razas nativas, contaminacion transgenica, defensa de las semillas",
  "Teocintle al maiz, domesticacion en Mesoamerica, mutacion del gen tga1",
  "Genoma del maguey, Agave salmiana, gen CAM y resistencia a sequia",
  "Epigenetica del suelo, memoria del estres y herencia ambiental",
  "Endosimbiosis, mitocondrias y cloroplastos, origen bacteriano de los organelos",
  "Evolucion convergente, alas de ave, murcielago e insecto, soluciones distintas",
  "ADN antiguo, paleogenetica de poblaciones americanas precolombinas",
  "Domesticacion del frijol, dos centros de origen mesoamericano y andino",
  "Domesticacion del jitomate, viaje del solanum desde los Andes hasta el mundo",
  "Domesticacion del chile, capsicum y centros mexicanos de diversidad",
  "Domesticacion de la calabaza, cucurbita y origen mesoamericano",
  "Diversidad genetica del cacao, Theobroma y centros de origen amazonico",
  "Domesticacion del perro, lobo a perro xoloitzcuintle y razas precolombinas",
  "Domesticacion del pavo, guajolote y cria mesoamericana",
  "Coevolucion humano-maiz, dependencia mutua de 9000 anos",
  "Genetica de la lactasa, persistencia y evolucion reciente",
  "Adaptacion a altitud, sherpas y poblaciones andinas, gen EPAS1",
  "CRISPR y edicion genetica, riesgos y debate etico",
  "Cromosomas, telomeros y envejecimiento celular",
  "Genes y conducta, herencia y ambiente, debate naturaleza-crianza",
  "Bacterias antibiotico-resistentes, evolucion en tiempo real",
  "Virus y evolucion, pandemia, mutacion y seleccion natural",
  "Especiacion alopatrica, formacion de nuevas especies por aislamiento",
  "Radiacion adaptativa, pinzones de Darwin y diversidad explosiva",
  "Evolucion del ojo, surgimiento independiente en multiples linajes",
  "Pulpos, calamares y cefalopodos, inteligencia y sistema nervioso distribuido",
  "Tardigrados, supervivientes extremos y biologia molecular",
  "Origen de la vida, sopa primigenia, hidrotermales y panspermia",
  "Genetica de poblaciones, deriva, flujo genico y seleccion",
  "Quelites de la milpa, quintoniles, huauzontles y verdolagas como genetica viva",

  // === Comida y ciencia ===
  "Reaccion de Maillard, dorado del pan y la tortilla, quimica del sabor",
  "Nixtamalizacion, alcali, biodisponibilidad de niacina, prevencion de pelagra",
  "Microbioma intestinal y dieta milpa, fibra y fermentos para salud digestiva",
  "Umami en hongos mexicanos, glutamato natural en quintoniles y setas",
  "Probioticos vivos en pulque y tepache, microbioma de bebidas fermentadas",
  "Quimica del mole, fusion de chiles, especias y chocolate",
  "Quimica del ceviche, desnaturalizacion proteica por acido en pescado crudo",
  "Pan de masa madre, lactobacilos, levaduras silvestres y fermentacion lenta",
  "Yogurt y kefir, fermentacion lactica casera y probioticos",
  "Vinagre artesanal, fermentacion acetica y conservacion de alimentos",
  "Salsa de soya y miso, fermentacion de aspergillus oryzae",
  "Quesos artesanales mexicanos, microbiologia de la fermentacion lactea",
  "Aguacate y grasas saludables, omega 9 y salud cardiovascular",
  "Quimica del chocolate, conchado y temperado para textura perfecta",
  "Pulque y nutricion, vitaminas, aminoacidos y bebida ancestral funcional",
  "Tepache, fermentacion de pina, levaduras y probioticos artesanales",
  "Atole agrio, fermentacion de maiz y bebida prehispanica viva",
  "Tejate oaxaqueno, cacao, mamey y rosita de cacao en bebida ritual",
  "Mezcal y tequila, ciencia de la destilacion y diversidad de agaves",
  "Pulque versus mezcal, dos caminos del maguey en bebidas mexicanas",
  "Insectos comestibles, proteina y eficiencia ecologica frente a ganado",
  "Chapulines de Oaxaca, sphenarium y nutricion de saltamontes",
  "Cocina con metate y molcajete, fisica de moler y propiedades del sabor",
  "Frijoles y maiz combinados, complementariedad de aminoacidos esenciales",
  "Cacao y salud cardiovascular, flavonoides y oxido nitrico",
  "Chiles y endorfinas, capsaicina, dolor y placer en la dieta",
  "Quimica del tequila, aromas, congeneres y diferencias de calidad",
  "Hongos como umami natural, glutamato y sabor profundo en cocina",
  "Conservacion ancestral, salar, secar, ahumar y enchilar",
  "Permacultura aplicada al huerto, diseno y diversidad alimentaria",

  // === Ecosistemas y especies mexicanas ===
  "Bosque mesofilo de montana, ecosistema de niebla, biodiversidad relictual",
  "Cenotes mayas, formacion karstica y agua subterranea de Yucatan",
  "Manglar, raices respiratorias, vivero del oceano y carbono azul",
  "Desierto sonorense, saguaro y biznaga, adaptacion CAM al calor extremo",
  "Ajolote de Xochimilco, regeneracion de extremidades, especie en peligro critico",
  "Vaquita marina, el mamifero mas pequeno y su extincion por redes pesqueras",
  "Quetzal en bosque mesofilo, plumas sagradas, ave dificil de ver",
  "Redes miceliales, wood wide web, comunicacion entre arboles a traves de hongos",
  "Selva lacandona, jaguares, monos arana y refugio de biodiversidad",
  "Bosque de oyamel, refugio de la mariposa monarca y ecosistema de altura",
  "Selva maya, frutos selvaticos y cosecha sustentable",
  "Sierra tarahumara, biodiversidad, barrancas y pueblos originarios",
  "Sierra norte de Oaxaca, mayor concentracion de biodiversidad de Mexico",
  "Pradera de pastos altos en Janos, perro llanero y bisonte",
  "Aguila real en sierras mexicanas, simbolo nacional y conservacion",
  "Tortuga laud, gigante del oceano y anidacion en playas mexicanas",
  "Ballena gris, migracion epica al Pacifico mexicano y avistamiento en Baja",
  "Tiburon ballena en Holbox, gigante filtrador y turismo responsable",
  "Cocodrilo de pantano y rio, biologia de un superdepredador acuatico",
  "Mono arana, mono aullador y primates mexicanos en peligro",
  "Coati y tlacuache, mamiferos pequenos en bosques mexicanos",
  "Pumas y jaguares en Mexico, distribucion y conservacion",
  "Zopilote rey, carronero magnifico de selvas tropicales",
  "Carpintero imperial, ave extinta de bosques de pino mexicanos",
  "Cactus columnares, organo, pitayo y cardon, paisajes deserticos",
  "Encinares mexicanos, robles, bellotas y biodiversidad asociada",
  "Pino Hartwegii, bosques de altura y monarca como refugio",
  "Mar de Cortes, oceano biologicamente mas rico del planeta",
  "Lagunas costeras de Tabasco y Veracruz, manglar y biodiversidad",
  "Volcan Popocatepetl, bosque, fauna y cultura nahua",
  "Rios tropicales mexicanos, peces nativos y endemismos",
  "Reserva de la biosfera Calakmul, jaguares y selvas mayas conservadas",

  // === Biologia fascinante ===
  "Inmortalidad biologica, hidra y medusas que rejuvenecen",
  "Regeneracion en estrellas de mar y ajolotes, biologia del reemplazo",
  "Hibernacion en osos y mamiferos, fisiologia del sueno profundo",
  "Apareamiento de cefalopodos, hectocotilo y comunicacion visual",
  "Bioacumulacion de toxinas en cadena alimentaria, mercurio en peces",
  "Mimetismo batesiano y mulleriano, defensa por imitacion",
  "Cuidado parental en aves, cooperacion familiar en cria",
  "Eusocialidad en abejas, hormigas y termitas, sociedades de insectos",
  "Plasticidad fenotipica, mismo gen, distintos cuerpos",
  "Reproduccion asexual, partenogenesis en lagartijas y plantas",
  "Hermafroditismo en babosas marinas y caracoles",
  "Cambio de sexo en peces, payaso y mero",
  "Embriologia, desarrollo desde una celula hasta organismo",
  "Cuerpo humano por dentro, sistema circulatorio y sus 100 mil km de vasos",
  "Microbioma humano, bacterias en piel, boca e intestinos",
  "Sistema inmunologico, defensa innata y adaptativa",
  "Linfa, drenaje y sistema inmune secundario",
  "Origen de las plantas terrestres, salida del agua y conquista del continente",
  "Origen de los animales, organizacion celular y simetria corporal",
  "Polillas y mariposas, metamorfosis y biologia del cambio",
  "Esponjas como animales mas simples, filtros del oceano",
  "Medusas inmortales, Turritopsis dohrnii y reversion biologica",
  "Vida en hidrotermales, quimiosintesis y ecosistemas sin sol",
  "Vida extremofila, bacterias en hielo, lava y radiacion",
  "Pajaros lira que imitan sonidos, plasticidad vocal",
  "Cantos de ballenas, transmision cultural y dialectos",
  "Cuervos y herramientas, inteligencia animal y resolucion de problemas",
  "Inteligencia de pulpos y cefalopodos, neurologia distribuida",
  "Plantas que cuentan, mimosa pudica, dionaea y sentidos vegetales",
  "Comunicacion quimica entre plantas, defensa por aromas y alarmas vegetales",

  // === Hongos profundos ===
  "Hongos micorrizicos, simbiosis con plantas y nutricion vegetal",
  "Hongos descomponedores, cadena del carbono y suelo vivo",
  "Hongos psicodelicos, psilocibina y revolucion terapeutica",
  "Hongos comestibles silvestres, identificacion y recoleccion segura",
  "Cultivo casero de setas, sustratos y temperatura ideal",
  "Hongos medicinales, reishi, melena de leon y shiitake",
  "Trufas, hongos subterraneos y simbiosis con animales",
  "Levaduras del pulque, microbiologia de la bebida ancestral",
  "Levaduras del pan, ciencia de la fermentacion",
  "Mohos en quesos, penicillium y artes de la fermentacion",
  "Hongos bioluminiscentes, panellus stipticus y luz en bosques",
  "Hongos cordyceps, parasitismo y manipulacion conductual",
  "Hongos zombies, ophiocordyceps y control mental de hormigas",
  "Hongos descontaminantes, micorremediacion de suelos toxicos",
  "Micelio como bioplastico, empaques y materiales sostenibles",
  "Cuero de micelio, hongos en moda sustentable",
  "Antibioticos de hongos, descubrimiento de penicilina",
  "Hongos en cuevas y oscuridad, biologia sin sol",
  "Huitlacoche, hongo del maiz, manjar mexicano del maiz",
  "Hongos del bosque mexicano, recoleccion en sierra y temporada",

  // === Sabiduria tradicional + ciencia ===
  "Calendario agricola lunar, siembra segun fases y ciencia detras",
  "Cartografia indigena, mapas de relacion y codices",
  "Tlazoltli, conocimiento herbolario nahua y plantas catalogadas",
  "Sabiduria de parteras tradicionales y conocimiento del cuerpo",
  "Curanderos, susto, mal de ojo y limpias tradicionales",
  "Sobadores y huesos, medicina manual ancestral",
  "Tonalpohualli, calendario sagrado de 260 dias",
  "Floricultura ritual, cempasuchil y ofrenda de muertos",
  "Cosmovision nahua, dualidad y equilibrio ometeotl",
  "Codices prehispanicos, escritura, calendario y memoria visual",
  "Leyendas de Quetzalcoatl, ciencia detras de los mitos",
  "Pueblos originarios y agricultura, manejo del paisaje a 10 mil anos",
  "Saberes mayas del campo, calendario, lluvia y siembra",
  "Saberes wixaritari, peyote, geografia sagrada y arte",
  "Saberes purepecha, lago de Patzcuaro y agricultura lacustre",
  "Saberes mixteca, codices, escritura y memoria",
  "Saberes zapoteca, escritura prehispanica y arquitectura monumental",
  "Conocimiento ecologico tradicional, integracion con ciencia moderna",
  "Etnobotanica, plantas usadas por pueblos originarios",
  "Etnoastronomia, lectura del cielo en culturas mexicanas",
  "Sabiduria de los olores, aromaterapia tradicional y plantas mexicanas",
  "Tradicion oral, transmision de conocimiento sin escritura",
  "Memoria del territorio, toponimia indigena y paisaje cultural",
  "Filosofia tojolabal, nosotros como ser y comunidad",
  "Ciencia y cosmovision, dialogo entre saberes",

  // === Salud y nutricion ===
  "Quelites de la milpa, hierbas comestibles y micronutrientes esenciales",
  "Amaranto, proteina completa y superalimento prehispanico",
  "Chia, omega 3 y semilla de los aztecas",
  "Cacao crudo, antioxidantes y salud cardiovascular",
  "Aguacate, grasas saludables y nutricion mexicana",
  "Chiles y capsaicina, metabolismo y endorfinas",
  "Calabaza y carotenoides, vision y salud",
  "Setas mexicanas, proteina vegetal y umami nutricional",
  "Nopal, control de glucosa y diabetes",
  "Aguamiel y diabetes, fructosa y consideraciones",
  "Hidratacion, agua de tiempo y bebidas tradicionales",
  "Ayuno intermitente, ciencia y tradiciones rituales",
  "Ejercicio y longevidad, movimiento como medicina",
  "Sueno y reparacion, ciencia del descanso profundo",
  "Estres y cortisol, salud mental en el campo y la ciudad",
  "Conexion intestino-cerebro, microbioma y emocion",
  "Vitamina D y sol, salud osea y sistema inmune",
  "Magnesio y calcio, minerales en cocina mexicana",
  "Hierro vegetal y anemia, plantas ricas y absorcion",
  "Antioxidantes naturales, polifenoles y prevencion",
  "Salud de la piel, microbioma cutaneo y plantas mexicanas",
  "Inflamacion cronica y dieta antiinflamatoria mexicana",
  "Resistencia a antibioticos, alimentacion y microbioma",
  "Salud oral, plantas mexicanas y enjuagues tradicionales",
  "Salud reproductiva femenina, plantas y conocimiento tradicional",

  // === Medicina tradicional + farmacologia ===
  "Te de manzanilla, propiedades digestivas y herbolaria",
  "Te de hierbabuena y menta, sistema digestivo",
  "Epazote, antiparasitario tradicional y compuestos activos",
  "Hoja santa, anetol y sabor medicinal mexicano",
  "Ruda, planta sagrada y compuestos medicinales",
  "Toloache, datura y planta peligrosa de la herbolaria",
  "Pinguica y vias urinarias, conocimiento popular",
  "Cuachalalate, corteza y propiedades antiulceras",
  "Damiana, afrodisiaco mexicano y salud reproductiva",
  "Anis y digestion, plantas para colicos",
  "Aceite de oregano y antimicrobianos naturales",
  "Aspirina del sauce, descubrimiento de la salicilina",
  "Quinina del cinchona, malaria y descubrimiento andino",
  "Curare amazonico, anestesico tradicional y origen",
  "Veneno de avispa de mar, investigacion farmacologica",
  "Cacti como medicina, biznaga y antiinflamatorios",
  "Maguey y salud, sapogeninas y compuestos medicinales",
  "Aloe vera y sabila, cicatrizacion y medicina popular",
  "Plantas y cancer, investigacion oncologica de origen vegetal",
  "Cannabis y cannabinoides, sistema endocannabinoide",
  "Psicodelicos terapeuticos, psilocibina y depresion",
  "Ayahuasca y dimetiltriptamina, ritual y farmacologia",
  "Arnica mexicana, antiinflamatorio topico y conocimiento popular",
  "Boldo y vesicula, plantas para el higado",
  "Pasiflora y ansiedad, sedantes vegetales tradicionales",

  // === Cerebro y neurociencia ===
  "Neuroplasticidad, capacidad del cerebro para reorganizarse",
  "Memoria, hipocampo y formacion de recuerdos",
  "Sueno y consolidacion de memoria, ciencia del descanso",
  "Suenos y REM, fase paradojica del descanso",
  "Meditacion y cambios cerebrales, ciencia del mindfulness",
  "Plantas y conciencia, neuroquimica del peyote y hongos",
  "Cafeina y atencion, mecanismo neurologico",
  "Chocolate y placer, anandamida y feniletilamina",
  "Capsaicina y dolor, neurociencia del picante",
  "Musica y cerebro, dopamina y emocion auditiva",
  "Lenguaje y cerebro, area de Broca y Wernicke",
  "Bilinguismo y plasticidad cerebral",
  "Neuronas espejo, empatia e imitacion",
  "Adiccion y dopamina, ciencia del comportamiento compulsivo",
  "Estres cronico y cerebro, cortisol y atrofia",
  "Ejercicio y cerebro, neurogenesis y BDNF",
  "Naturaleza y salud mental, biofilia y reduccion de estres",
  "Conexion social y cerebro, oxitocina y vinculos",
  "Inteligencia animal, pulpos, cuervos y monos",
  "Anestesia y conciencia, misterio de la perdida temporal",
  "Cerebros bicamerales, hemisferios y procesamiento dual",
  "Inteligencia colectiva en enjambres, decisiones distribuidas",
  "Sentidos extras, magnetorrecepcion, electrolocalizacion y ecolocacion",
  "Cerebro psicodelico, neurologia del estado expandido",
  "Atencion y distraccion, neurociencia de la era digital",
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
const TONE_PROFILES = [
  {
    name: "practico-calido",
    systemPrompt:
      "Eres un redactor experto en temas rurales, ecologicos, cientificos y de territorio mexicano. " +
      "Escribes articulos profundos, claros, calidos y practicos para comunidades. " +
      "Tu tono es directo, comunitario y respetuoso, pero con rigor cientifico cuando el tema lo pide. " +
      "Cada seccion es densa en contenido: incluye ejemplos concretos, datos verificables, pasos practicos y cifras. " +
      "Los parrafos son sustanciosos y reflexivos, nunca de una sola linea. " +
      "Integras nombres cientificos, fechas historicas, cifras concretas y menciones a investigadores reales.",
    sectionRange: [9, 12],
    temperatureRange: [0.7, 0.9],
  },
  {
    name: "poetico-con-mesura",
    systemPrompt:
      "Eres un escritor que combina conocimiento rural, ecologico y cientifico con un lenguaje lirico pero contenido. " +
      "Usas metaforas del territorio mexicano sin caer en excesos. " +
      "Tu prosa respira como la milpa: con ritmo y proposito. " +
      "Cada seccion desarrolla ideas con profundidad: no basta nombrar, hay que explicar, describir, contextualizar y mostrar conexiones. " +
      "Minimo 3 parrafos sustanciosos por seccion, con datos concretos, fechas y nombres reales cuando aplique.",
    sectionRange: [9, 12],
    temperatureRange: [0.85, 1.0],
  },
  {
    name: "cortito-conciso",
    systemPrompt:
      "Eres un redactor que escribe guias completas, densas y bien documentadas sobre temas rurales, ecologicos y cientificos de Mexico. " +
      "Vas directo al grano sin perder profundidad: cada idea esta sustentada con datos, fechas, cifras o nombres reales. " +
      "Usa listas detalladas, pasos numerados y ejemplos especificos. " +
      "Cada punto de una lista debe tener al menos una oracion explicativa con contenido concreto. " +
      "Integras nombres cientificos, fechas y cifras con naturalidad.",
    sectionRange: [9, 12],
    temperatureRange: [0.6, 0.8],
  },
  {
    name: "narrativo",
    systemPrompt:
      "Eres un narrador que cuenta historias y escenas del campo mexicano para transmitir saberes cientificos y culturales. " +
      "Empiezas con una escena vivida (un tlachiquero al amanecer, una cuadrilla mezclando adobe, " +
      "una lluvia cayendo en la milpa, un murcielago cruzando la noche) y de ahi extraes aprendizajes profundos. " +
      "Equilibras relato y ensenanza. Cada seccion desarrolla tanto la historia como el conocimiento cientifico: " +
      "no dejes ideas a medias, lleva cada tema hasta sus consecuencias practicas. " +
      "Integras nombres cientificos, fechas historicas precisas, cifras verificables y menciones a investigadores reales.",
    sectionRange: [9, 12],
    temperatureRange: [0.85, 1.0],
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
  // COMPARTIR COMO HISTORIA
  (function(){
    const btn=document.getElementById('btnStory');
    if(!btn)return;
    function wrapText(ctx,text,x,y,maxW,lineH){
      const words=text.split(' ');let line='',lines=[];
      for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;}
      if(line)lines.push(line);
      let yy=y-(lines.length-1)*lineH/2;
      for(const l of lines){ctx.fillText(l,x,yy);yy+=lineH;}
    }
    btn.addEventListener('click',async()=>{
      const orig=btn.textContent;btn.textContent='⏳';btn.disabled=true;
      try{
        const slug=location.pathname.split('/').slice(-2,-1)[0]||'';
        const coverUrl=slug?(slug+'.png'):(document.querySelector('meta[property="og:image"]')?.content||'');
        const title=(document.querySelector('meta[property="og:title"]')?.content||document.title).replace(/\\s*[—\\-]\\s*Guardianes del Pulque/,'');
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
        ctx.fillStyle='#ffffff';ctx.textAlign='center';
        ctx.font='bold 76px system-ui,ui-sans-serif,sans-serif';
        wrapText(ctx,title,W/2,IMGSLICE+280,W-160,98);
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
    model: "gpt-4o",
    messages: [
      { role: "system", content: profile.systemPrompt },
      {
        role: "user",
        content:
          `Escribe un articulo original, profundo y ricamente documentado sobre: ${topic}.\n\n` +
          "Responde SOLO con un JSON valido (sin markdown ni backticks) con esta estructura:\n" +
          `{"title": "Titulo del articulo", "excerpt": "Resumen de 1 linea (max 120 chars)", "tag": "Etiqueta principal", "body": "<h2>...</h2><p>...</p>..."}\n\n` +
          `EXTENSION Y ESTRUCTURA:\n` +
          `- El body debe ser HTML con h2, p, ul/li, ol/li y elementos enriquecidos descritos abajo.\n` +
          `- Usa exactamente ${sectionCount} secciones con h2.\n` +
          `- Cada seccion con minimo 3 parrafos sustanciosos de al menos 100 palabras cada uno, o un parrafo profundo mas una lista detallada.\n` +
          `- El articulo completo entre 1800 y 2800 palabras.\n` +
          `- No incluyas el titulo principal en el body. No uses etiquetas style ni script.\n\n` +
          `RIQUEZA OBLIGATORIA (estos elementos deben aparecer en el body):\n` +
          `1. AL MENOS 3 fechas historicas especificas (ej. "en 1952", "desde el siglo XVI", "hasta 1810").\n` +
          `2. AL MENOS 2 nombres reales de cientificos, investigadores, historiadores o autores relevantes (ej. "Alan Turing", "Luz Maria del Razo", "Miguel Leon-Portilla"). Integralos naturalmente.\n` +
          `3. Nombres cientificos binomiales cuando se mencionen especies (ej. "Agave salmiana", "Leptonycteris nivalis") en cursiva con <em>.\n` +
          `4. AL MENOS 5 cifras concretas (porcentajes, medidas, distancias, cantidades, anos, poblaciones).\n` +
          `5. AL MENOS 1 cuadro destacado con datos sorprendentes usando este formato exacto:\n` +
          `   <aside class="aside-fact"><strong>¿Sabias que?</strong> [dato fascinante de 1-2 oraciones]</aside>\n` +
          `6. Al FINAL del body, una seccion h2 "Glosario" con entre 5 y 8 terminos tecnicos definidos asi:\n` +
          `   <h2>Glosario</h2><dl class="glossary"><dt>Termino</dt><dd>Definicion clara de 1-2 oraciones.</dd><dt>...</dt><dd>...</dd></dl>\n` +
          `7. Cierra el articulo (antes del glosario) con un parrafo motivador de al menos 100 palabras que invite a la accion.\n\n` +
          `ESTILO:\n` +
          `- Integra ciencia, cultura mexicana, historia y saberes tradicionales cuando aplique.\n` +
          `- Evita frases vacias o generalidades. Cada parrafo debe contener informacion sustancial.\n` +
          `- No inventes datos: si no estas seguro de una cifra o nombre, omitelo en lugar de inventar.\n` +
          `- Sin fuentes ni bibliografia al final (la integracion es organica).\n\n` +
          `TAG: elige el mas apropiado entre: ${VALID_TAGS.join(", ")}. Si ninguno encaja, puedes sugerir uno nuevo.`,
      },
    ],
    temperature,
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
      model: "gpt-4o",
      messages: [
        { role: "system", content: profile.systemPrompt },
        {
          role: "user",
          content:
            `Escribe un articulo original, profundo y documentado sobre: ${topic}.\n\n` +
            "Responde SOLO con un JSON valido (sin markdown ni backticks) con esta estructura EXACTA:\n" +
            `{"title":"Titulo","excerpt":"Resumen max 120 chars","tag":"Tag","body":"<h2>...</h2><p>...</p>"}\n\n` +
            `IMPORTANTE: El body debe ser una sola linea de texto sin saltos de linea literales (usa espacios). ` +
            `Usa exactamente ${sectionCount} secciones con h2. ` +
            "Cada seccion minimo 3 parrafos de 100+ palabras. Sin style ni script. Entre 1800 y 2800 palabras. " +
            "Incluye 3+ fechas, 2+ nombres de cientificos/autores reales, 5+ cifras, 1+ <aside class=\"aside-fact\"> y un glosario final con <dl class=\"glossary\">.\n\n" +
            `Tag entre: ${VALID_TAGS.join(", ")}.`,
        },
      ],
      temperature: 0.5,
    });
    raw = retryCompletion.choices[0].message.content.trim();
    article = tryParseJson(raw);
  }
  if (!article) throw new Error("GPT no devolvió JSON válido tras 3 intentos");

  // 2. Generar sección "Hazlo tú mismo"
  const diyCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Eres un instructor práctico de saberes rurales mexicanos. Redactas instrucciones claras, concretas y motivadoras." },
      {
        role: "user",
        content:
          `El artículo es sobre: "${article.title}".\n\n` +
          "Escribe una sección 'Hazlo tú mismo' práctica y accesible relacionada con el tema del artículo.\n" +
          "Responde SOLO con un JSON válido (sin markdown) con esta estructura:\n" +
          '{"diy_title": "Nombre de la actividad práctica", "intro": "1 párrafo motivador (max 100 palabras)", ' +
          '"materials": ["material 1", "material 2", ...], "steps": ["paso 1", "paso 2", ...], "tip": "Consejo final útil (max 80 palabras)"}\n\n' +
          "La actividad debe ser simple, con materiales accesibles, máximo 6 pasos y 7 materiales. " +
          "Orientada a personas en comunidades rurales o urbanas sin recursos especializados.",
      },
    ],
    temperature: 0.7,
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

  // ESTILO FRESCO MONUMENTAL (temas serios: territorio, cultura, saberes...):
  const frescoBasePrompt =
    `Monumental fresco in the style of Mexican muralism, continuous composition without panels or divisions. ` +
    `Subject: "${article.title}" — epic scene of Mexican rural life related to this topic.${pulqueNote} ` +
    `Color palette: ${palette}. ` +
    `Broad brushstrokes, monumental volumes, natural mineral pigments visible in texture, dramatic light, ` +
    `depth and movement in the composition, figures with weight and dignity, landscape and people intertwined. ` +
    `SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins, no panels, no grids, no borders. ` +
    `NO photography, NO 3D render, NO text, NO letters, NO words, NO labels, NO typography, NO writing of any kind.`;
  const frescoFallbackPrompt =
    `Monumental fresco in the style of Mexican muralism, wide continuous scene of Mexican rural landscape. ` +
    `Color palette: ${palette}. ` +
    `Broad brushstrokes, monumental volumes, dramatic light, no panels, no divisions. ` +
    `SINGLE continuous illustration filling the entire frame edge to edge, no empty spaces, no white margins. ` +
    `NO text, NO letters, NO words, NO typography, NO writing of any kind.`;

  // ESTILO POP ART (temas ligeros: recetas, música, insectos, arte, cocina...):
  const popArtBasePrompt =
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Subject: "${article.title}" — Mexican scene related to this topic.${pulqueNote} ` +
    `Use these color families in the illustration: ${palette}. ` +
    `Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look, vibrant and expressive composition. ` +
    `The ENTIRE 1792x1024 canvas must be a SINGLE continuous illustrated scene from edge to edge. The scene itself fills 100% of the canvas. No portion of the canvas may be blank, empty, or occupied by abstract color fields. ` +
    `ABSOLUTELY FORBIDDEN elements (these must NOT appear anywhere in the image): color palette strips, color swatches, color sample bars, vertical color columns, horizontal color bands, reference color charts, side panels showing colors, isolated rectangles of solid color, color chips, Pantone-style blocks, any design-reference element showing the palette. ` +
    `Also forbidden: divisions, panels, grids, borders, frames, vignettes, margins, white space, empty bands, comic panel separators, before/after splits, diptychs, triptychs. ` +
    `Forbidden content: photography, 3D render, text, letters, words, labels, typography, writing, signatures, watermarks, urban buildings, cityscape skyline.`;
  const popArtFallbackPrompt =
    `Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. Wide Mexican rural scene filling the entire canvas. ` +
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
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",
      });
      const imageUrl = imageResponse.data[0].url;
      imageBuffer = Buffer.from(
        await fetch(imageUrl).then((r) => r.arrayBuffer())
      );
      break;
    } catch (e) {
      console.log("Prompt rechazado, intentando alternativo...");
    }
  }
  if (!imageBuffer) throw new Error("No se pudo generar imagen");

  // Recortar márgenes y redimensionar a 912px de ancho
  imageBuffer = await sharp(imageBuffer).trim({ threshold: 80 }).resize(IMAGE_WIDTH).toBuffer();

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

generateArticle().catch((err) => {
  console.error(err);
  process.exit(1);
});
