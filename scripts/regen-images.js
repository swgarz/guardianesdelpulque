const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const openai = new OpenAI();

// ESTILO POP ART (continuo, sin paneles):
const PANEL_STYLE =
  "Pop art illustration in the style of Roy Lichtenstein and Andy Warhol. " +
  "Heavy Ben-Day dots, solid black outlines, flat vivid colors, halftone patterns, comic-book aesthetic, high contrast, screen-print look, vibrant and expressive composition. " +
  "The ENTIRE canvas must be a SINGLE continuous illustrated scene from edge to edge. The scene itself fills 100% of the canvas. No portion of the canvas may be blank, empty, or occupied by abstract color fields. " +
  "ABSOLUTELY FORBIDDEN elements (these must NOT appear anywhere in the image): color palette strips, color swatches, color sample bars, vertical color columns, horizontal color bands, reference color charts, side panels showing colors, isolated rectangles of solid color, color chips, Pantone-style blocks, any design-reference element showing the palette. " +
  "Also forbidden: divisions, panels, grids, borders, frames, vignettes, margins, white space, empty bands, comic panel separators, before/after splits, diptychs, triptychs. " +
  "Forbidden content: photography, 3D render, text, letters, words, labels, typography, writing, signatures, watermarks, urban buildings, cityscape skyline.";

const images = [
  {
    slug: "el-fuego-en-la-cocina-tradicional-mexicana",
    title: "El Fuego en la Cocina Tradicional Mexicana",
    palette: "tonos rojo llama, naranja brasa, negro carbon y amarillo chispa",
    subjects: "fogon de lena encendido, comal con tortillas, brasas rojas, manos echando lena, ollas de barro sobre fuego, humo y chispas",
  },
  {
    slug: "el-arte-tradicional-mexicano-un-legado-cultural-vivo",
    title: "El Arte Tradicional Mexicano",
    palette: "tonos multicolor vivo, rojo carmin, azul indigo y amarillo brillante",
    subjects: "telar con textiles coloridos, barro siendo moldeado, papel amate con disenos, pincel sobre mural, manos bordando, ceramica pintada",
  },
  {
    slug: "la-sabiduria-de-los-insectos-comestibles-en-la-cultura-mexicana",
    title: "Insectos Comestibles en la Cultura Mexicana",
    palette: "tonos verde hoja, ocre, rojo carmin y negro",
    subjects: "chapulines saltando, maguey con gusanos, mercado con insectos, manos sosteniendo chapulines, tacos con insectos, hormiga chicatana",
  },
  {
    slug: "revitalizacion-de-las-lenguas-indigenas-en-mexico",
    title: "Revitalizacion de las Lenguas Indigenas en Mexico",
    palette: "tonos ocre pergamino, negro tinta, rojo y dorado",
    subjects: "anciana enseñando a niños, codice con glifos, boca hablando, manos escribiendo, escuela comunitaria, simbolos indigenas",
  },
  {
    slug: "mujeres-en-el-campo-guardianas-de-saberes-y-vida",
    title: "Mujeres en el Campo: Guardianas de Saberes y Vida",
    palette: "tonos rojo flor, morado, verde jade y dorado",
    subjects: "mujer sembrando, partera con bebe, mujer tejiendo, huerto familiar, mujer curandera con plantas, asamblea comunitaria de mujeres",
  },
  {
    slug: "voces-de-la-tierra-la-musica-tradicional-mexicana",
    title: "Voces de la Tierra: La Musica Tradicional Mexicana",
    palette: "tonos azul profundo, rojo vivo, ocre dorado y negro",
    subjects: "jarana siendo tocada, teponaztle percutido, violin en manos campesinas, grupo de sones jarochos, cantos al atardecer, tambor ritual",
  },
  {
    slug: "el-arte-de-fermentar-chucrut-mexicano-y-sus-beneficios",
    title: "Fermento de Chucrut: el poder ancestral para tu salud",
    palette: "tonos verde col, blanco sal, amarillo mostaza y terracota",
    subjects: "col siendo cortada en tiras, manos masajeando col con sal, frasco de vidrio con chucrut fermentando, burbujas de fermentacion, chucrut terminado sobre taco, frasco en refrigerador",
  },
  {
    slug: "diego-rivera-maestro-del-muralismo-mexicano",
    prompt: "Fresco monumental al estilo del muralismo mexicano, composición continua sin paneles ni divisiones, escena épica de un muralista sobre andamio pintando una pared de cal con figuras de obreros y campesinos, pigmentos minerales visibles en la textura del muro, paleta de ocre dorado, rojo óxido, azul índigo, negro carbón y blanco cal, trazos amplios y volúmenes monumentales, luz dramática desde arriba, sin texto, sin letras, sin palabras.",
  },
  {
    slug: "el-abrazo-verde-agroforesteria-y-sus-beneficios-en-el-territorio-mexicano",
    title: "El Abrazo Verde: Agroforestería en el Territorio Mexicano",
    palette: "deep green, bark brown, moss green, sky blue, golden ochre",
    subjects: "large trees sheltering milpa and cattle, campesinos planting trees beside living fences, deep roots visible under fertile soil, community harvesting agroforestry fruits, birds nesting in canopy",
  },
  {
    slug: "raramuri-cultura-y-resistencia-en-la-sierra-tarahumara",
    title: "Rarámuri: Cultura y Resistencia en la Sierra Tarahumara",
    palette: "vivid red, sky blue, canyon ochre, pine green, white cloud",
    subjects: "barefoot runner on canyon trail, women in colorful skirts weaving and carrying pottery, men in community assembly under pine trees, children playing rarajipari with wooden ball, steep hillside milpa with native corn",
  },
  {
    slug: "las-fibras-naturales-en-mexico-henequen-palma-y-mimbre",
    title: "Las Fibras Naturales en México: Henequén, Palma y Mimbre",
    palette: "natural cream, golden henequen, indigo purple, crimson red, warm ochre",
    subjects: "hands weaving henequen on traditional loom, woman braiding palm under the sun, wicker baskets being shaped, maguey with fibrous leaves in the field, natural textiles hanging to dry",
  },
  {
    slug: "composta-y-lombricomposta-transformando-residuos-en-suelo-fertil",
    title: "Composta y Lombricomposta: Transformando Residuos en Suelo Fértil",
    palette: "deep black humus, dark earth brown, golden ochre, leaf green, worm red",
    subjects: "hands mixing moist compost in layers, red worms in dark fertile soil, compost pile beside worm bin, vigorous plants sprouting from fertilized earth, organic scraps transforming into rich humus",
  },
  {
    slug: "banco-de-semillas-de-svalbard-y-su-relevancia-para-mexico",
    title: "Banco de Semillas de Svalbard",
    palette: "arctic white snow, teal blue glowing light, deep navy sky, silver metal, golden corn yellow",
    subjects: "iconic wedge-shaped concrete vault entrance jutting from a snowy arctic mountain with teal glowing facade, northern lights above, long underground corridor lined with aluminum seed packets on shelves, hands placing colorful native Mexican corn and bean seeds into metal containers",
  },
  {
    slug: "el-valor-de-las-semillas-criollas-en-la-conservacion-del-territorio-mexicano",
    title: "El Valor de las Semillas Criollas en la Conservación del Territorio Mexicano",
    palette: "vivid yellow corn, deep red bean, cream white squash, earth brown, leaf green",
    subjects: "hands selecting native corn seeds, colorful criollo seed varieties spread out, woman storing seeds in clay pot, traditional milpa with corn beans and squash, community seed bank gathering",
  },
  {
    slug: "la-polinizacion-del-maguey-por-murcielagos-magueyeros-un-ejemplo-de-coevolucion",
    title: "La Polinización del Maguey por Murciélagos Magueyeros",
    palette: "pollen yellow, flower pink, stem green, bee gold, deep night blue",
    subjects: "long-nosed bat Leptonycteris flying at night toward a flowering maguey salmiana, tall quiote stalk with open white-yellow blossoms, blue-grey-green fleshy spiky leaves of the agave, pollen dust on bat's fur, full moon and stars, desert landscape with other magueyes, nocturnal Mexican highland scene",
  },
  {
    slug: "migracion-rural-retornos-y-renovaciones-en-comunidades-en-diaspora",
    title: "Migración Rural: Retornos y Renovaciones en Comunidades en Diáspora",
    palette: "road ochre, brick red, indigo blue, hope green, warm cream",
    subjects: "campesino family walking with bundled belongings along a dirt road, rural Mexican village with adobe houses in the distance, milpa with corn in the foreground, elderly grandparents waving welcome at a doorway, hands exchanging a photograph, suitcase beside a bus stop, cross-generational embrace",
  },
  {
    slug: "psicodelicos-sagrados-conexiones-ancestrales-y-espirituales",
    title: "Psicodélicos Sagrados: Conexiones Ancestrales y Espirituales",
    palette: "visionary purple, deep cobalt blue, sacred green, ritual gold, night black",
    subjects: "indigenous wixárika shaman sitting in ceremony beside peyote cacti, hongos sagrados growing from forest floor, temazcal steaming under a starry sky, circle of candles and copal smoke, visionary geometric patterns emerging from the background, sacred plants of power, eyes closed in meditation, Mexican night landscape",
  },
  {
    slug: "patrones-de-turing-en-pieles-la-magia-de-las-manchas-del-jaguar-y-rayas-de-cebra",
    title: "Patrones de Turing en Pieles: La Magia de las Manchas del Jaguar y Rayas de Cebra",
    palette: "cellular green, water blue, pollen yellow, nucleus violet, jaguar gold and deep black",
    subjects: "majestic Mexican jaguar with rosette spot patterns stepping through jungle, zebra beside with bold black-and-white stripes, overlapping waves of reaction-diffusion patterns emerging across both animal skins, spiral and dotted halftone patterns rippling in the background, Turing morphogenesis patterns forming organically on the fur, tropical Mexican foliage, harmony between pure mathematics and living biology",
  },
  {
    slug: "la-endosimbiosis-puerta-a-la-complejidad-de-la-vida-eucariota",
    title: "La Endosimbiosis: Puerta a la Complejidad de la Vida Eucariota",
    palette: "cellular green, water blue, pollen yellow, nucleus violet, bacterial red, bone white",
    subjects: "giant cross-section of a eukaryotic cell filling the entire scene with a huge purple nucleus in the center, elongated magenta mitochondria shaped like ancient bacteria pulsing inside the cytoplasm, emerald-green chloroplasts floating nearby with visible thylakoid stacks, tiny bacterial ancestors merging into larger primitive cells in the background, curved membrane outlines everywhere, depictions of Lynn Margulis's endosymbiosis theory happening across one unified illustration, organic flowing composition edge to edge, absolutely no color swatches or side palette bars",
  },
  {
    slug: "la-danza-de-la-vida-coevolucion-entre-la-yuca-y-la-polilla-yucca",
    title: "La Danza de la Vida: Coevolución entre la Yuca y la Polilla Yucca",
    palette: "pollen yellow, flower pink, stem green, bee gold, deep night blue, desert cream",
    subjects: "giant blooming yucca plant with tall stalk of cream-white bell-shaped flowers at the center of the composition, a small Tegeticula moth hovering inside one open flower collecting pollen on her proboscis, another moth laying eggs inside a developing seed pod, sharp spiky leaves radiating outward, moonlit Mexican desert landscape with saguaros and organ pipe cacti, night sky with stars above, the entire scene is one continuous painting with no empty areas",
  },
  {
    slug: "el-ajolote-de-xochimilco-un-tesoro-biologico-y-medicina-regenerativa",
    title: "El Ajolote de Xochimilco: Un Tesoro Biológico y Medicina Regenerativa",
    palette: "water turquoise, salamander pink, chinampa green, axolotl cream, deep lake blue, pollen yellow",
    subjects: "majestic pink axolotl (Ambystoma mexicanum) smiling in the foreground with external feathery pink gills spread wide, swimming underwater through the canals of Xochimilco, one of its legs actively regenerating with tiny new cells emerging visibly, water lilies and lirios floating above, chinampa agricultural islands with corn and vegetables at the top edge, a trajinera boat silhouetted above the water line, small fish and dragonflies, continuous flowing scene from dark lake depths to bright surface",
  },
  {
    slug: "el-intrincado-mundo-de-la-wood-wide-web-comunicaciones-subterraneas-de-los-bosques",
    title: "El Intrincado mundo de la Wood Wide Web: Comunicaciones Subterráneas de los Bosques",
    palette: "moss green, mushroom cream, deep purple, earth brown, amber glow, root white",
    subjects: "giant vertical cross-section of a Mexican forest showing tall oyamel and oak trees reaching the sky above and their enormous interconnected root systems below ground, a vast network of bright white mycelium threads glowing and weaving between all the root tips like a living web, tiny pulses of amber light flowing along the fungal filaments representing nutrients and alarm signals being shared between trees, cluster of mushrooms fruiting at the forest floor, dark soil layers revealing worms and fungi, the entire composition is one continuous cross-section filling the canvas edge to edge",
  },
  {
    slug: "el-impacto-cosmico-de-chicxulub-fin-de-los-dinosaurios",
    title: "Chicxulub: impacto cosmico y fin de los dinosaurios",
    palette: "deep cosmic black, fireball orange, asteroid grey, jungle green, cenote turquoise, dinosaur teal, dust ochre, blood red",
    subjects: "split composition: in the sky a huge fiery asteroid streaks down with a bright tail of fire and dust toward the Yucatan peninsula at the upper right, in the foreground panicked dinosaurs run away from the impact zone — a Tyrannosaurus, a Triceratops, a small feathered raptor and pterosaurs flying in alarm, lush prehistoric Cretaceous jungle of palms and cycads and conifers, a glowing ring of cenotes forming a perfect arc visible across the coastal limestone landscape suggesting the future crater rim, halftone shockwave rings expanding from the impact point, smoke and ash clouds rising, no urban modern elements",
  },
  {
    slug: "lo-que-un-chocolate-amargo-puede-hacerle-a-tus-arterias-y-por-que-no-es-magia",
    title: "Chocolate amargo y salud cardiovascular: flavonoides",
    palette: "deep cacao brown, pod yellow, ruby red blood, arterial pink, leaf green, golden ochre, nib black",
    subjects: "halved cacao pod opened on a wooden table revealing rows of plump white-pink seeds covered in cream pulp, broken tablets of dark chocolate and roasted cacao nibs spread alongside, a large cross-section of a healthy human artery with smooth red endothelium and flowing blood cells in halftone dots, oversized stylized molecular hexagons of flavanols and epicatechin floating between the chocolate and the artery, a small clay cup of steaming bitter chocolate atole on a metate, a heart silhouette at the corner glowing with vitality, no text, no labels",
  },
  {
    slug: "ocho-mil-pasos-en-zacatlan-el-experimento-mexicano-que-desafia-tu-reloj-biologico",
    title: "Ocho mil pasos en Zacatlan: ejercicio y longevidad",
    palette: "cobblestone grey, apple red, sidra amber, sierra pine green, sky cobalt blue, tile terracotta, rebozo magenta",
    subjects: "diverse group of Mexican townspeople walking along a sunlit cobbled mountain street in Zacatlan de las Manzanas, Puebla — an older woman in rebozo, a middle-aged jogger, a man in straw hat, a young couple holding hands, a smiling abuelo with a cane, all in motion, halftone footstep trails behind them, red-and-green apple orchards on the slope beside the road, traditional Puebla houses with red-tile roofs and bougainvillea, the floral clock tower of Zacatlan in the distance, rolling Sierra Norte ranges with pine forest and morning mist, no urban downtown",
  },
  {
    slug: "las-plantas-que-aprendieron-a-mantener-despierto-a-medio-planeta",
    title: "Cosecha de cafe y cacao en Veracruz",
    palette: "coffee red cherry, cacao pod orange-purple, leaf green, mist mountain blue, caterpillar lime, brown bark, sunshine yellow",
    subjects: "lush tropical highland plantation scene in Veracruz: coffee shrubs heavy with bright red ripe cherries beside cacao trees with yellow, orange and deep purple pods growing on the trunks, a few fat green caterpillars trying to bite leaves and recoiling with wavy lines suggesting bitterness around their mouths, a campesina in white cotton clothes and straw hat picking coffee cherries into a wicker basket, an open cacao pod showing seeds in white pulp on a wooden tray, halftone steam swirls rising from a clay cup of dark hot chocolate, misty mountain ridges with shade canopy in the background, no buildings, no city",
  },
  {
    slug: "el-lodo-bajo-las-unas-ensena-mas-que-una-pizarra-infancia-rural-en-mexico",
    title: "Infancia rural en Mexico: jugar con la tierra",
    palette: "wet mud brown, milpa green, river blue, sunshine yellow, child-cheek pink, adobe ochre, sky cream",
    subjects: "joyful Mexican rural children with bare feet and dirty hands playing freely on muddy ground beside a milpa of young corn — one girl molding a clay figurine, two boys chasing a soccer ball made of rolled rags, a barefoot girl jumping into a shallow stream, another child planting a seed with her fingers, a grandmother in apron watching warmly from the doorway of an adobe house with red flowers, chickens and a dog around them, mountains in the distance, halftone sunlight rays, no school building, no urban modern setting",
  },
  {
    slug: "bajo-el-agua-arrecifes-que-respiran-historia-veracruz-y-quintana-roo-la-otra-frontera-viva-de-mexico",
    title: "Arrecifes de Veracruz y Quintana Roo",
    palette: "turquoise water, coral pink, anemone purple, parrotfish yellow, deep ocean indigo, white sand, seaweed green",
    subjects: "vibrant underwater scene of the Mesoamerican coral reef off the coast of Veracruz and Quintana Roo: branching staghorn and elkhorn corals in pink and orange, brain corals and sea fans, schools of bright yellow parrotfish and blue tangs weaving between coral heads, a green sea turtle gliding above, a moray eel peeking from a crevice, sun rays piercing the turquoise water in halftone dot patterns, a small Mexican freediver in mask and fins observing without touching, white sandy bottom with starfish, no boats, no urban elements above water",
  },
  {
    slug: "un-colibri-en-el-maizal-y-la-moneda-al-aire-de-tus-genes",
    title: "Colibri en el maizal mexicano",
    palette: "iridescent ruby red, emerald hummingbird green, corn-leaf green, kernel yellow, blue sky, soil brown, violet flower",
    subjects: "tiny ruby-throated hummingbird hovering mid-air at the center of a Mexican milpa, its wings blurred in halftone dot motion, beak extended toward a flowering corn tassel, vibrant native maize cobs with kernels of yellow, red, blue and white in the surrounding stalks, beans climbing the corn stalks and squash leaves spread across the ground (milpa polyculture), purple morning-glory flowers along the edge, a small stylized spiral motif in the sky like a swirl of seeds in the wind, morning sun rays, distant mountains, no urban elements",
  },
  {
    slug: "cuando-la-selva-alimenta-la-cosecha-oculta-de-los-frutos-mayas",
    title: "Frutos mayas: cosecha de la selva",
    palette: "deep jungle green, ramon-fruit yellow, mamey orange-brown, chicozapote russet, pitahaya magenta, toucan red-yellow, limestone cream",
    subjects: "dense lush Yucatan/Peten Maya jungle: tall ramon trees (Brosimum alicastrum) with oval leaves and round seeds dropping, chicozapote trees with brown sapodilla fruits, mamey trees with reddish-brown rough fruits hanging, clusters of small yellow guaya, magenta pitahaya cactus climbing a trunk, zapote negro on branches, a young Tzeltal Maya boy in white cotton clothes carrying a hand-woven palm basket overflowing with ramon seeds and guaya bunches reaches up to pick fruit, howler monkeys, a keel-billed toucan and a quetzal on branches, limestone karst boulders and ancient Maya stone steps emerging from the green undergrowth, no magueys, no agaves, no desert",
  },
  {
    slug: "el-barro-negro-de-los-acidos-humicos-lo-que-esconde-el-suelo-bajo-tus-pies",
    title: "Suelo negro fertil: vida bajo tus pies",
    palette: "deep black humus, dark earth brown, leaf green, golden ochre, mineral white, corn yellow",
    subjects: "Mexican campesino in white cotton clothes holding a handful of crumbly black soil in his open palm at the center, beside him a vertical cutaway of healthy dark earth showing layers of decomposing leaves, white root hairs, a few earthworms moving through tunnels and orange fungal threads weaving between soil particles, a strong corn milpa with deep roots growing from the same rich earth, beans and squash climbing nearby, halftone dot patterns across the soil layers, sunny highland landscape in the background",
  },
  {
    slug: "la-cosecha-invisible-dentro-de-la-raiz-donde-nacen-los-escamoles",
    title: "La cosecha de escamoles en raices de maguey",
    palette: "maguey blue-grey-green, soil ochre, larvae cream, mezquite bark brown, sky cobalt blue, leaf shadow black",
    subjects: "Mexican ant-egg harvester (escamolero) kneeling in dry Hidalgo highland scrubland with a wide straw hat, carefully digging with a small machete around the exposed roots of a large mezquite tree beside a tall Agave salmiana maguey pulquero — its long wide blue-grey-green fleshy leaves visible, a nest of Liometopum ants opened up in the root showing dozens of pearly cream-white ant larvae like grains of rice piled together, a clay pot and a folded cotton cloth ready to receive the escamoles, soldier ants defending the nest crawling on the harvester's gloves, low golden sun across the magueyal landscape, distant tepetate slopes",
  },
  {
    slug: "don-ezequiel-la-sequia-y-el-secreto-guardado-en-voz-baja",
    title: "Don Ezequiel: tradicion oral entre abuelo y nieto",
    palette: "adobe ochre, terracotta red, dry-grass yellow, deep huipil indigo, hearth orange, mountain blue, weathered white",
    subjects: "elderly Mexican grandfather with deeply lined face, long white moustache and a wide straw hat sitting on a low wooden bench outside an adobe house, leaning forward and speaking quietly to his young grandson seated beside him at his feet listening intently, the grandson cupping a hand to his ear, dry cracked earth and parched milpa stretching out behind them under a heavy hot sky, a clay olla of water and a worn cotton bag at their side, halftone heat ripples in the air, the grandfather's hand resting on the boy's shoulder, no urban modern elements",
  },
  {
    slug: "la-selva-que-habla-ayahuasca-moleculas-y-visiones-en-la-amazonia",
    title: "La selva amazonica: bejuco y hoja",
    palette: "deep jungle green, vine bark brown, leaf emerald, sunrise magenta, golden yellow, indigo night, river blue",
    subjects: "thick spiraling forest vine climbing a giant Amazon tree trunk at the center of the composition, glossy oval leaves of a small shrub growing beside it, an indigenous Amazonian elder in a beaded headdress and woven cotton tunic sitting beside a small ceremonial fire stirring a clay pot of plant decoction, dense humid rainforest surrounding the scene with broad heliconia leaves, a curious squirrel monkey on a branch, a bright macaw and a toucan in the canopy, geometric Shipibo-Conibo woven patterns appearing on a textile spread on the ground, halftone dot light filtering through the canopy, river and stars above",
  },
  {
    slug: "el-trueno-la-canela-y-los-30-milagros-la-alquimia-secreta-del-mole-poblano",
    title: "El mole poblano: alquimia de 30 ingredientes",
    palette: "deep mole brown, chili red, cacao dark, cinnamon ochre, almond cream, sesame gold, clove black, raisin purple, plantain yellow",
    subjects: "huge dark glossy mole poblano simmering in a wide cazuela of clay over a wood fire, a Mexican cook in white apron stirring with a tall wooden molinillo, scattered around on a wooden table the 30 alchemical ingredients laid out like a constellation — dried chiles ancho, mulato, pasilla and chipotle bundled together, a stick of cinnamon, cloves, anise stars, peppercorns, almonds, peanuts, sesame seeds toasting on a comal, raisins, slices of ripe plantain, broken tablets of dark chocolate and cacao beans, a small heap of stale bread, tortilla and tomato, a stone metate with ground spices, halftone steam swirling upward, traditional Poblano kitchen with talavera tiles glimpsed in the background",
  },
  {
    slug: "xoloitzcuintle-companero-prehispanico-y-guardian-del-mictlan",
    title: "Xoloitzcuintle: guardian del Mictlan",
    palette: "deep obsidian black, ash grey skin, ember orange, cempasuchil marigold yellow, jade green, blood red, moonlight cream, indigo night blue",
    subjects: "elegant hairless Xoloitzcuintle dog at the center with smooth dark grey skin and alert pointed ears, standing on the bank of a wide river of black water — the threshold between worlds — about to lead a small barefoot indigenous figure across, glowing cempasuchil marigold petals scattered like a path on the ground, prehispanic stepped pyramid silhouette and starry Mictlan underworld sky behind, a calaca skull and clay funerary urn at the foot of the path, codex-style glyphs of Xolotl the dog-god floating like halftone motifs around the scene, no urban modern elements",
  },
  {
    slug: "la-vainilla-de-papantla-historia-ciencia-y-polinizacion",
    title: "La vainilla de Papantla: polinizacion manual",
    palette: "deep emerald green, cream vanilla flower, golden pod brown, jungle shadow black, sky blue, totonac white, ochre soil",
    subjects: "close-up of Totonac woman hands in white embroidered blouse carefully holding a single pale yellow-cream Vanilla planifolia orchid flower open, the other hand using a slim wooden bamboo toothpick to lift the rostellum membrane and press the anther onto the stigma — the exact gesture of hand-pollination, long thick green vanilla vine climbing up a host tree trunk in the background, clusters of long ripening green vanilla pods hanging nearby, a few darker cured brown pods on a woven palm mat, lush humid jungle of Papantla Veracruz with broad tropical leaves and morning mist, a small wooden basket and a Totonac voladores pole faintly visible far behind",
  },
  {
    slug: "el-fascinante-origen-de-los-alebrijes-un-viaje-onirico-y-artistico",
    title: "El origen de los alebrijes: el sueno de Pedro Linares",
    palette: "vivid fuchsia, electric turquoise, lemon yellow, hot orange, deep violet, jade green, bone white, midnight blue",
    subjects: "fantastical chimeric alebrije creature at the center — a donkey body with butterfly-dragon wings spread wide, a serpent tongue, rooster legs and a feathered tail — painted in bright clashing colors with bold geometric patterns and dots all over its skin, an older Mexican artisan in white cotton shirt (Pedro Linares) lying feverish on a petate in the background, sketching the creature in a small notebook, papier-mache and cartoneria materials (newspaper strips, wheat-paste bowl, wire armatures) on a worktable, smaller alebrijes around — a winged iguana, a fish-bat, a horned rabbit — Mexico City Merced Balbuena neighborhood doorway visible behind, swirling dreamlike colored mist filling the air",
  },
  {
    slug: "etnobotanica-un-viaje-por-las-plantas-usadas-por-pueblos-originarios-de-mexico",
    title: "Etnobotanica: plantas usadas por pueblos originarios",
    palette: "leaf green, herb sage, flower pink, copal amber, earth brown, indigo blue, golden ochre",
    subjects: "indigenous Mexican curandera in traditional embroidered huipil and rebozo sitting on a woven petate, carefully sorting bundles of fresh medicinal herbs, a stone molcajete with crushed leaves and roots beside her, sprigs of epazote, ruda, santa maria, romero and copal resin spread on a cotton cloth, a young apprentice taking notes by drawing the plants in a folded amate-paper booklet, hanging strings of drying flowers and chiles, a clay pot with infusion steaming, a marigold and a peyote button in a small dish, milpa plants and a maguey visible through the open doorway of an adobe house, Sierra Madre highland landscape outside",
  },
  {
    slug: "teotihuacan-un-ejemplo-magistral-de-urbanismo-planificado-en-la-antiguedad",
    title: "Teotihuacan: urbanismo planificado",
    palette: "deep volcanic black, ochre stone, terracotta red, jade green, turquoise sky, sun gold",
    subjects: "bird's-eye view of the ceremonial city of Teotihuacan with the wide Avenue of the Dead running straight through the center, the monumental stepped Pyramid of the Sun on the right and the Pyramid of the Moon at the far end, the Temple of Quetzalcoatl with its carved serpent heads, perfectly aligned residential compounds arranged in a regular geometric grid on both sides of the avenue, surveyor cords and astronomical sight-lines marked over the layout, small priestly figures walking the avenue, volcanic mountains and a clear highland sky in the background",
  },
  {
    slug: "por-que-el-mole-sabe-distinto-a-doscientos-metros-del-mercado-de-puebla",
    title: "Por que el mole sabe distinto a doscientos metros del mercado de Puebla",
    palette: "deep mole brown, chili red, cacao dark, almond cream, sesame gold, smoky black",
    subjects: "large clay cazuela of bubbling dark mole on a wood-fire stove, dried chiles ancho, mulato and pasilla scattered alongside, broken chocolate tablets and cacao beans, almonds and sesame seeds toasting on a comal, hands grinding spices on a stone metate, steam rising in halftone swirls, Puebla market stalls glimpsed in the background",
  },
  {
    slug: "por-que-tu-hemisferio-derecho-no-es-el-artista-que-te-contaron-y-otras-mentiras-sobre-el-cerebro-bicameral",
    title: "Por qué tu hemisferio derecho no es el artista que te contaron",
    palette: "brain pink, neuron electric yellow, synapse cobalt blue, deep purple, blood red, cream white",
    subjects: "giant anatomical cross-section of a human brain at the center filling the canvas, both hemispheres rendered symmetrically with the thick corpus callosum bridge of nerve fibers crossing the midline, vivid neurons firing in yellow lightning bolts that travel freely between both sides simultaneously, dense network of dendrites and axons weaving across the entire cortex from edge to edge, halftone Ben-Day dot patterns rippling over the brain surface, a pair of hands at the bottom each holding both a paintbrush and a geometric ruler together symbolizing that both hemispheres do both creative and logical tasks, no labels, no diagrams, no anatomical text, no Mexican cultural elements",
  },
];

async function generateImage(img) {
  const prompt = img.prompt ||
    (PANEL_STYLE + ` Subject: "${img.title}" — Mexican rural scene related to this topic. Depicted elements: ${img.subjects}. Color palette: ${img.palette}.`);
  console.log("Generando:", img.slug);
  try {
    const res = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
    });
    const raw = Buffer.from(res.data[0].b64_json, "base64");
    const buf = await sharp(raw).trim({ threshold: 80 }).resize(912).png().toBuffer();
    const dest = path.join(__dirname, "..", "articulos", img.slug, img.slug + ".png");
    fs.writeFileSync(dest, buf);
    console.log("OK:", img.slug);
  } catch (e) {
    console.error("ERROR", img.slug, e.message);
  }
}

(async () => {
  const slugFilter = process.argv[2];
  const toRun = slugFilter ? images.filter(i => i.slug === slugFilter) : images;
  if (slugFilter && !toRun.length) {
    console.error("Slug no encontrado:", slugFilter);
    process.exit(1);
  }
  for (const img of toRun) await generateImage(img);
  console.log("Listo.");
})();
