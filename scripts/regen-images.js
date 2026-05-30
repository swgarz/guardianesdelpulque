const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const openai = new OpenAI();

// ESTILO POP ART (continuo, sin paneles):
const PANEL_STYLE =
  "Vintage pop art screen-print illustration in the style of Roy Lichtenstein and Andy Warhol, with the look of a 1960s comic-book splash page. " +
  "DENSE Ben-Day halftone dots must saturate EVERY surface of the image — not only the subjects but also the sky, mountains, ground, shadows, water and clouds. Dots vary in size and density to suggest gradients (for example a sunset sky should transition from large orange dots into smaller yellow dots). Halftone is the dominant visual texture. " +
  "Thick solid black outlines on every figure and object, flat saturated comic-book colors with no soft shading, high contrast, vibrant screen-print aesthetic with a slight off-register vintage feel. " +
  "Multi-plane composition with strong depth: a bold close-up element in the foreground, mid-ground figures or action, and a distant background of mountains, sky or horizon — all rendered with halftone dots. Include extra motion elements such as flying birds, drifting clouds, swirling dust or ripples to enliven the scene. " +
  "The ENTIRE canvas must be a SINGLE continuous illustrated scene from edge to edge. The scene itself fills 100% of the canvas. No portion of the canvas may be blank, empty, or occupied by abstract color fields. " +
  "ABSOLUTELY FORBIDDEN elements (these must NOT appear anywhere in the image): color palette strips, color swatches, color sample bars, vertical color columns, horizontal color bands, reference color charts, side panels showing colors, isolated rectangles of solid color, color chips, Pantone-style blocks, any design-reference element showing the palette. " +
  "Also forbidden: divisions, panels, grids, borders, frames, vignettes, margins, white space, empty bands, comic panel separators, before/after splits, diptychs, triptychs. " +
  "Forbidden content: photography, 3D render, text, letters, words, labels, typography, writing, signatures, watermarks, urban buildings, cityscape skyline.";

const images = [
  {
    slug: "el-fuego-en-la-cocina-tradicional-mexicana",
    title: "El Fuego en la Cocina Tradicional Mexicana",
    palette: "ember orange, flame red, soot black, comal terracotta, masa cream, chile dark red, smoke grey",
    subjects: "a single traditional Mexican kitchen scene with a wide round clay comal sitting on top of a U-shaped fogón de leña made of volcanic stones, dry split logs of mesquite burning underneath with tall orange flames, a campesina in rebozo crouching beside it gently flipping a corn tortilla on the comal with her bare hand, a clay pot of bubbling frijoles next to her, a stack of fresh tortillas in a cloth-covered chiquihuite basket, hanging strings of dried red chiles overhead, smoke spiraling up in halftone curls to the wooden rafters of the adobe kitchen — ONE continuous scene from corner to corner, ABSOLUTELY NO grid, NO panels, NO divided layouts, NO multi-frame compositions",
  },
  {
    slug: "el-arte-tradicional-mexicano-un-legado-cultural-vivo",
    title: "El Arte Tradicional Mexicano",
    palette: "talavera blue, alebrije fuchsia, copal amber, amate brown, marigold orange, jade green, indigo deep",
    subjects: "a Mexican artisans' courtyard at midday with three figures in action — at the left a potter in a white apron shaping a tall talavera vase on a foot-powered wheel, in the center a woman painting bright designs on cartonería alebrije creatures (a serpent and a bird) drying on a wooden table, at the right a weaver working a backstrap loom hanging from a low wooden post with a half-finished bright striped rebozo, on the floor stacked papel amate sheets with hand-painted birds, a basket of bright natural dye balls, a small clay incense burner with copal smoke — ONE continuous workshop scene, NO grid, NO comic panels, NO division lines, NO multi-frame layout",
  },
  {
    slug: "la-sabiduria-de-los-insectos-comestibles-en-la-cultura-mexicana",
    title: "Insectos Comestibles en la Cultura Mexicana",
    palette: "chapulín green, ochre dust, achiote red, deep agave blue, masa yellow, charcoal black",
    subjects: "a Oaxacan market stall at the center with a smiling vendor woman in white huipil offering a wide clay bowl heaped with toasted chapulines (grasshoppers) seasoned with lime and chile, a customer's hand reaching for a freshly made taco filled with chinicuiles (red maguey worms) and guacamole, on the left a maguey plant with visible worms inside its leaves and a basket of chicatana ants, on the right a stack of warm tortillas and a small clay cup of mezcal, in the background the volcanic Oaxaca hills under a bright sky — ONE continuous scene from edge to edge, ABSOLUTELY NO grid, NO panel divisions, NO comic strip layout, NO multi-frame composition",
  },
  {
    slug: "revitalizacion-de-las-lenguas-indigenas-en-mexico",
    title: "Revitalizacion de las Lenguas Indigenas en Mexico",
    palette: "codice ochre, ink black, jade green, sun yellow, cochineal red, paper cream, sky blue",
    subjects: "an elder Mexican abuela in traditional embroidered huipil sitting on a woven petate teaching three children to read aloud from an open codice (folded amate-paper book) covered in nahuatl glyphs, a young girl pointing at a glyph with her finger, a boy writing in a small notebook with charcoal, the abuela's mouth open speaking a word with a gentle halftone breath glyph escaping like a flower toward the children, in the background a rural classroom wall painted with colorful traditional patterns and a milpa visible through a doorway — ONE continuous painted scene, NO grid, NO panels, NO speech bubbles with garbled foreign text, NO comic layout, NO multi-frame composition",
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
    slug: "patrones-de-turing-en-pieles-la-magia-de-las-manchas-del-jaguar-y-rayas-de-cebra",
    title: "Patrones de Turing en Pieles: La Magia de las Manchas del Jaguar y Rayas de Cebra",
    palette: "jaguar gold, rosette black, zebra white, ink black, jungle green, blueprint blue",
    subjects: "extreme close-up of the flank of a Mexican jaguar filling the LEFT half of the canvas with its black rosette ring-spots large and detailed, and the flank of a zebra filling the RIGHT half with sharp parallel vertical black-and-white stripes — the two skin textures meeting at the vertical center line as a transition zone where spots gradually morph into stripes, faint mathematical reaction-diffusion equations and curved arrows sketched like chalkboard notes in the background, a small silhouette of Alan Turing pondering at the bottom corner, the SKIN PATTERN ITSELF is the protagonist, no jungle scenery",
  },
  {
    slug: "la-endosimbiosis-puerta-a-la-complejidad-de-la-vida-eucariota",
    title: "La Endosimbiosis: Puerta a la Complejidad de la Vida Eucariota",
    palette: "cellular emerald green, mitochondria magenta, nucleus deep violet, cytoplasm cyan, bacterial red, membrane gold",
    subjects: "huge anatomical cross-section of a single living plant-like eukaryotic cell filling 90% of the canvas, curved cell membrane outlined in thick black at the edges, large round violet nucleus dominant in the center with visible chromatin strands inside, several elongated magenta-red mitochondria scattered across the cytoplasm — each one shown with its own inner double membrane and tiny ribosomes hinting at ancient microbial ancestry, emerald-green chloroplasts with neatly stacked thylakoid discs nearby, small vacuoles and golgi structures in supporting positions, in the corners small thumbnail vignettes showing the gradual integration of ancestral microbes into early eukaryotic cells over evolutionary time as smooth diagrams, the image must unmistakably read as A LIVING CELL DIAGRAM not an abstract sun, calm scientific illustration not violent",
  },
  {
    slug: "la-danza-de-la-vida-coevolucion-entre-la-yuca-y-la-polilla-yucca",
    title: "La Danza de la Vida: Coevolución entre la Yuca y la Polilla Yucca",
    palette: "yucca cream white, desert ochre, moth silver, dusk indigo, stem green, pollen gold",
    subjects: "extreme close-up of ONE open bell-shaped Yucca cream-white flower filling the left half of the canvas, petals spread like a chalice, a small white Tegeticula moth inside the flower's center clearly visible with detailed silver wings and proboscis actively pressing a ball of pollen onto the stigma — the mutualistic gesture is the focal point, below it a second moth depositing tiny eggs inside a swelling green seed pod, the tall yucca flowering stalk rising into a dusk Mexican desert sky with first stars, small saguaros silhouetted, intimacy of moth-flower exchange centered",
  },
  {
    slug: "el-ajolote-de-xochimilco-un-tesoro-biologico-y-medicina-regenerativa",
    title: "El Ajolote de Xochimilco: Un Tesoro Biológico y Medicina Regenerativa",
    palette: "axolotl pink, gill coral, water turquoise, chinampa green, blastema cream, blood red",
    subjects: "huge smiling pink axolotl (Ambystoma mexicanum) head filling 60% of the foreground, iconic external feathery coral-pink gills spread like a crown, mouth in the gentle characteristic smile, ONE front leg in the lower foreground actively regenerating — a stump with a visible translucent blastema bud and tiny new fingers half-grown emerging, a small inset diagram showing four silhouettes of limb regrowth stages, dark Xochimilco canal water and a faint trajinera silhouette behind, no other competing animals",
  },
  {
    slug: "el-intrincado-mundo-de-la-wood-wide-web-comunicaciones-subterraneas-de-los-bosques",
    title: "El Intrincado mundo de la Wood Wide Web: Comunicaciones Subterráneas de los Bosques",
    palette: "moss green, mushroom cream, deep purple, earth brown, amber glow, root white",
    subjects: "giant vertical cross-section of a Mexican forest showing tall oyamel and oak trees reaching the sky above and their enormous interconnected root systems below ground, a vast network of bright white mycelium threads glowing and weaving between all the root tips like a living web, tiny pulses of amber light flowing along the fungal filaments representing nutrients and alarm signals being shared between trees, cluster of mushrooms fruiting at the forest floor, dark soil layers revealing worms and fungi, the entire composition is one continuous cross-section filling the canvas edge to edge",
  },
  {
    slug: "el-dia-que-taxco-huele-a-cilantro-vivo-la-invasion-de-los-jumiles-comestibles",
    title: "Jumiles de Taxco: el insecto que se come vivo",
    palette: "Taxco silver white, adobe pink, salsa red, tortilla golden, cilantro green, jumile grey-brown, mountain blue, festival magenta",
    subjects: "lively zocalo of Taxco at midday with white-and-pink colonial houses climbing the steep hillside and the silver-domed church of Santa Prisca in the background, a Mexican woman in embroidered blouse and apron at the foreground holding a clay molcajete full of tiny live grey-brown jumiles (Atizies taxcoensis stink bugs) crawling, scooping them into a warm corn tortilla with salsa verde and a sprig of fresh cilantro, smiling people gathered around eating tacos of live jumiles, a basket of more bugs on the cobbled ground, halftone wavy lines suggesting the cilantro-like smell rising into the air, blue mountain ranges of Guerrero behind, birds flying over the church",
  },
  {
    slug: "psicodelicos-sagrados-conexiones-ancestrales-y-espirituales",
    title: "Psicodelicos sagrados: ceremonia ancestral",
    palette: "ritual gold, copal smoke cream, sacred green, deep night indigo, candle orange, marigold yellow, ceremonial purple, earth brown",
    subjects: "indigenous Mexican Wixarika elder in a beaded headdress, embroidered tunic and feathered crown sitting cross-legged in a sacred ceremony at night, hands raised offering thanks toward a small fire in the center, a circle of cempasuchil marigolds and copal incense burning in clay pots around him, peyote cacti and sacred mushroom motifs growing softly at the edges of the circle, swirling geometric Wixarika yarn-art patterns and concentric mandala motifs in the night sky behind him as decorative halftone backdrop, a temazcal steam hut visible in the distance under a starry sky, mountains of central Mexico, no urban modern elements",
  },
  {
    slug: "el-quimico-de-la-unam-que-olia-a-laboratorio-y-salvo-el-cielo",
    title: "Mario Molina: el quimico que salvo la capa de ozono",
    palette: "stratospheric deep blue, ozone violet, chlorine green, aerosol grey, sun gold, Earth ocean blue, UNAM gold-and-blue, lab-coat white",
    subjects: "Mexican chemist with dark wavy hair, glasses and a white lab coat standing at the center beside a wooden bench with glass beakers and Erlenmeyer flasks, holding up a small aerosol spray can and pointing at it, behind him a huge cross-section view of the Earth's atmosphere rising up the canvas — surface clouds at the bottom and the stratosphere at the top with a visible thinning hole in the ozone layer over the South Pole rendered in violet halftone, stylized molecular hexagons of CFCs and chlorine atoms drifting upward, the sun shining at the upper corner with rays of ultraviolet light, the UNAM building entrance with its iconic mosaic mural at the lower left, a few birds in flight",
  },
  {
    slug: "el-secreto-inflamable-de-la-biznaga-cactus-que-curan-mas-alla-del-desierto",
    title: "La biznaga: cactus medicinal del altiplano",
    palette: "cactus deep green, spine red-yellow, blossom pink, sierra dust ochre, sky cobalt blue, adobe white, distant mountain violet",
    subjects: "large round-to-cylindrical biznaga barrel cacti (Ferocactus and Echinocactus) with prominent vertical ribs and clusters of long curved yellow-and-red spines along the ridges, some crowned with a circle of small pink and yellow flowers on top, an elderly Mexican curandero in white cotton clothes, huaraches and a wide straw hat kneels beside a biznaga carefully slicing off a piece with a small knife to reveal the pale translucent gelatinous pulp inside, on a nearby stone he has a clay molcajete, a bundle of medicinal herbs and a folded cotton cloth ready to use the pulp as an anti-inflammatory poultice, arid highland sierra of central Mexico with rolling rocky hills, scattered magueys and nopales, dry yellow grass, distant blue-violet mountain ranges, a few birds circling in the sky",
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
  {
    slug: "la-magia-de-la-nixtamalizacion-un-legado-mesoamericano-de-3500-anos",
    title: "La magia de la nixtamalización: un legado mesoamericano de 3500 años",
    palette: "corn kernel gold, lime cal white, comal black, ash grey, ember orange, masa cream",
    subjects: "wide clay olla of dried corn kernels submerged in milky lime-water (cal nixtamal) bubbling over a wood fire — the kernels swelling and turning yellow, a campesina in rebozo stirring slowly with a wooden spoon, in the foreground a stone metate with already-ground white masa being kneaded by hand, fresh corn tortillas warming on a clay comal at the right, a small chemistry diagram in the corner showing the niacin (vitamin B3) molecule being liberated by the alkali reaction, ABSOLUTELY no pyramids no temples, the CHEMICAL transformation is the focus",
  },
  {
    slug: "manejo-del-fuego-en-el-campo-fogones-de-lena-y-cocina-tradicional",
    title: "Manejo del Fuego en el Campo: Fogones de Leña y Cocina Tradicional",
    palette: "ember orange, flame red, soot black, smoke grey, terracotta, corn yellow, ash white",
    subjects: "traditional Mexican wood-fire stove (fogón de leña) at the center with a roaring fire of dry split logs burning under a wide round clay comal, an older woman in rebozo crouching to feed thick mesquite logs into the flames, on the comal corn tortillas puffing up and turning brown, a clay pot of frijoles simmering at the side, around the floor split firewood stacks, a leather bellows, charcoal pieces, a metate; volcanic stones forming the U-shape of the fogón, smoke spiraling up in halftone curls into the rafters of an adobe kitchen, strings of dried chiles hanging overhead",
  },
  {
    slug: "ecologia-profunda-y-ecopsicologia",
    title: "Ecología Profunda y Ecopsicología: Sanar la Tierra desde Adentro",
    palette: "forest deep green, oak brown, sky cyan, healing gold, river silver, blossom pink, root umber",
    subjects: "a barefoot Mexican person sitting cross-legged in quiet meditation at the base of an enormous old encino (Mexican oak) tree in a misty highland forest, the tree's wide root system extending downward and continuing as a transparent overlay into the meditator's body — roots and human nervous system mirroring each other in shape, the broad canopy above sheltering diverse butterflies, hummingbirds and dragonflies, a small clear stream flowing through the foreground reflecting both tree and person as one image, distant pine-clad mountains and soft clouds, a gentle halftone aura radiating outward from the meditator dissolving the boundary between self and forest (the ecological self of Arne Naess), no urban or modern elements",
  },
  {
    slug: "fermentos-de-nopal-y-xoconostle",
    title: "Fermentos de Nopal y Xoconostle: Probióticos Nativos de México",
    palette: "nopal jade green, xoconostle magenta pink, lime juice yellow, brine cream, jar glass blue, paddle green",
    subjects: "a Mexican kitchen counter with a wide glass jar at the center fermenting nopal cactus paddles diced into bright green cubes mixed with magenta xoconostle (sour prickly pear) chunks in cloudy brine bubbling with probiotic activity, a campesina hand sealing the jar with a fermentation airlock, on the side fresh whole nopal paddles with spines being cleaned and a small bowl of xoconostle fruits cut in half showing their pink flesh, a smaller jar of finished fermented nopal-xoconostle relish open on a wooden spoon, a milpa visible through a window with prickly pear cactus in the background",
  },
  {
    slug: "tejuino-bebida-fermentada-de-masa-de-maiz",
    title: "Tejuino — La Bebida Fermentada de Masa de Maíz",
    palette: "maize gold, piloncillo amber, lime sorbet green, salt white, chile red, jícara brown, fermentation cream",
    subjects: "a Jalisco street vendor pouring a tall stream of cloudy golden tejuino from a clay olla into a tall glass for a customer, the glass topped with a generous scoop of pale-green lime sorbet, a wedge of lime and a sprinkle of chile-salt on the rim, on the side a stone metate with ground nixtamal masa being mixed with brown piloncillo syrup, a wooden barrel of fermenting tejuino with rising halftone bubbles, traditional Tonalá clay cups stacked nearby, lively Guadalajara street market in the background, no readable text on any sign",
  },
  {
    slug: "la-cultura-otomi-saberes-y-tradiciones-de-un-pueblo-ancestral",
    title: "La Cultura Otomí: Saberes y Tradiciones de un Pueblo Ancestral",
    palette: "otomi tenango rainbow (red blue green yellow), agave green, sky blue, earth ochre, white cotton, ixtle cream",
    subjects: "a Hñähñu (Otomi) woman in white cotton blouse seated cross-legged embroidering a vivid Tenango cloth full of colorful birds, deer and trees-of-life in red, yellow, blue and green threads, behind her a stone-walled adobe house and a maguey landscape of the Mezquital valley, an older man weaving ixtle fiber from agave leaves into rope nearby, a clay aguamiel pot at his feet, a small altar with copal smoke, children playing among the magueyes, cloudy bright sky, one continuous panoramic scene",
  },
  {
    slug: "el-arte-del-pan-de-la-masa-madre-al-pan-de-muerto",
    title: "El Arte del Pan: De la Masa Madre al Pan de Muerto",
    palette: "wheat gold, golden crust, cempasuchil orange, deep crimson sugar, cinnamon brown, flour white, anise yellow, bone-shape cream",
    subjects: "a Mexican panadería interior with a wood-fire brick oven glowing orange at the back, a baker pulling out a wooden tray of freshly baked round Pan de Muerto loaves with their characteristic cross-shaped bone strips and round center button sprinkled with white sugar, in the foreground a marble counter with a glass jar of bubbling masa madre sourdough starter, hands kneading dough on a floured surface, a small bowl of orange-blossom water, a bowl of anise seeds, freshly baked conchas and cuernos arranged on a wicker basket, papel picado strings of marigolds hanging above",
  },
  {
    slug: "el-arte-del-barro-tradicion-y-futuro-de-la-alfareria-mexicana",
    title: "El Arte del Barro: Tradición y Futuro de la Alfarería Mexicana",
    palette: "barro negro shiny black, talavera cobalt blue, terracotta red, oaxacan grey, kiln amber, slip cream, glaze emerald",
    subjects: "a Oaxacan alfarera in traditional clothing seated at a foot-powered potter's wheel pulling up a tall barro negro vase with her wet hands, the clay walls thinning under her fingers, behind her a wood-fired horno (kiln) glowing orange with smoke rising, on a long wooden shelf a row of finished pieces — a shiny black olla, a talavera-blue plate, a green-glazed jarrita, terracotta cazuelas of various sizes, on the floor unfired clay paddles and stamps and brushes, a small stack of leather-hard pots drying, one continuous workshop scene",
  },
  {
    slug: "la-pesca-artesanal-y-sustentable-en-rios-y-lagos-de-mexico",
    title: "La Pesca Artesanal y Sustentable en Ríos y Lagos de México",
    palette: "lake turquoise, sky reflection blue, pescador red, white pelican, reed green, sunrise orange, net silver",
    subjects: "a Lake Pátzcuaro fisherman standing in a long narrow wooden canoe at dawn, casting a large butterfly net (red de mariposa) over the water with both arms — the net spread wide like wings catching the sunrise light, ripples spreading across the calm water, a smaller canoe with another fisherman pulling in a smaller net of pescado blanco fish behind him, white pelicans gliding above, distant Janitzio island silhouetted in the morning mist, reeds at the water's edge in the foreground",
  },
  {
    slug: "la-sal-un-tesoro-del-territorio-mexicano",
    title: "La Sal: Un Tesoro del Territorio Mexicano",
    palette: "salt white crystal, salina pink rose, sky cerulean, evaporation pond blue, mineral ochre, basket brown, palm roof yellow",
    subjects: "the pink salt flats of Cuyutlán, Colima at golden hour with geometric rectangular evaporation ponds catching the sky, a salinero in straw hat and rolled-up white pants walking through a shallow pond pushing a wooden rake gathering large pyramidal crystals of fleur-de-sel into a small mound, two large white pyramids of harvested salt rising beside the pond, a wooden wheelbarrow loaded with salt baskets, low palm-roofed wooden sheds (eras) drying salt, a pelican flying low overhead, distant sea horizon",
  },
  {
    slug: "fermentos-de-col-morada-un-tesoro-probiotico-de-mexico",
    title: "Fermento de Col Morada",
    palette: "deep purple cabbage, magenta brine, sea salt white, lime green, jar glass cream, garlic ivory, comino seed brown",
    subjects: "a wide-mouthed glass jar at the foreground center filled with shredded deep-purple-and-magenta col morada (red cabbage) packed tightly in its own purple-pink brine with tiny bubbles rising, a wooden tamper pressing it down, hands sprinkling sea salt over the shreds, a half cabbage cut in cross-section showing its swirling concentric layers, a small bowl of finished violet sauerkraut on a tortilla with avocado and a fried egg, fresh cabbage heads and a wooden cutting board behind, a Mexican kitchen with talavera tiles glimpsed in the background",
  },
  {
    slug: "el-arte-de-los-colorantes-naturales-en-mexico",
    title: "El Arte de los Colorantes Naturales en México",
    palette: "cochineal carmine red, indigo deep blue, marigold orange, palo de campeche purple-black, achiote orange-red, brazilwood crimson, copal yellow",
    subjects: "a Oaxacan natural-dye workshop with a teñidora dipping a long skein of cotton yarn into a steaming clay pot of bright cochineal-red dye, behind her another large pot of deep indigo blue with foam on its surface, a wooden table with the raw ingredients laid out — a small pile of dried cochineal insects, indigo leaves, marigold petals, brazilwood chips, achiote pods, palo de campeche; hanging on a wooden rack rows of dyed skeins drying in vivid red, blue, yellow, purple and orange, a small jar of mordant alum, a stone metate for grinding pigments",
  },
  {
    slug: "la-madera-en-la-tradicion-mexicana-construccion-y-sabiduria",
    title: "La Madera en la Tradición Mexicana",
    palette: "cedar red-brown, pine cream, oak deep brown, tool grey-blue, sawdust yellow, leaf green, forest blue",
    subjects: "a Mexican carpentry workshop with a maestro carpintero in apron planing a long cedar plank with a wooden hand-plane on a thick wooden workbench, curls of fragrant shavings falling around his feet, an apprentice using a chisel to carve a decorative pattern on a chair leg, on the wall a row of hand-tools — adzes, saws, gouges, augers, planes — hanging in order, in the corner finished pieces: a wooden saddle, a carved equipal chair, a chest, a guitar in progress, through an open door a forest of encinos and pinos visible with a campesino pulling logs in the distance",
  },
  {
    slug: "la-diversidad-de-aves-en-nuestros-territorios",
    title: "La Diversidad de Aves en Nuestros Territorios",
    palette: "quetzal emerald, hummingbird ruby, mountain blue, jungle green, sun gold, parrot scarlet, sky cyan",
    subjects: "a single Mexican mountain forest scene packed with native birds — a brilliant resplendent quetzal with long iridescent tail feathers perched on a branch at the center, a tiny ruby-throated hummingbird hovering at a red salvia flower below, a green-and-red scarlet macaw flying across the sky, a great horned owl in a hollow oak, a roadrunner darting across the lower foreground, a small kestrel hovering above, all rendered with distinct silhouettes and clear identification, a misty bosque mesofilo with bromeliads and tree ferns, one continuous edge-to-edge scene",
  },
  {
    slug: "energias-alternativas-caminos-hacia-la-autonomia-energetica-en-comunidades-rurales",
    title: "Energías Alternativas: Autonomía Energética en Comunidades Rurales",
    palette: "solar panel blue, biogas green, sun yellow, wood brown, sky cyan, leaf green, terracotta roof",
    subjects: "a Mexican rural community at golden hour with a small adobe house at the center, its roof covered with shining blue solar panels feeding a small battery shed at the side, behind the house a brick biodigester pit with a green dome capturing biogas piped to the kitchen, a campesino lighting a clean blue gas-stove flame inside through the open window, a small wooden wind-turbine on a tall post turning, neat firewood stacks of sustainably harvested branches drying, milpa fields and pine-clad hills in the background",
  },
  {
    slug: "tepache-bebida-fermentada-tradicional-de-mexico",
    title: "Tepache: La Bebida Fermentada Tradicional de México",
    palette: "pineapple gold, piloncillo amber, clove brown, cinnamon red, foam cream, glass cup blue, peel ochre",
    subjects: "a tall clay olla at the foreground center bubbling actively with golden tepache — chunks of ripe pineapple, broken piloncillo cones, cinnamon sticks, whole cloves floating on the foamy surface — a wooden ladle resting on the rim, a campesina ladling the bright golden drink into a tall clay cup with ice, a fresh pineapple cut in half nearby showing its yellow flesh, a small mound of brown piloncillo, the pineapple peels visible (where the fermentation actually happens), set in a rural Mexican kitchen with adobe walls",
  },
  {
    slug: "psicodelicos-sagrados-en-la-medicina-ancestral",
    title: "Psicodélicos Sagrados en la Medicina Ancestral",
    palette: "hongo violet, copal smoke white, sacred-fire orange, night indigo, mazatec red, healing gold, ocote pine green",
    subjects: "a Mazatec curandera in white huipil with an embroidered red flower pattern sitting cross-legged in candlelight at a small wooden altar, her hands open holding a velada offering of fresh native Psilocybe mushrooms with their stems and caps clearly visible, copal incense smoke spiraling up in halftone curls around her, a small clay incensario glowing with embers at her feet, an open codex with Mazatec mushroom glyphs (no readable letters) beside her, behind her the dark walls of an adobe ceremonial room hung with marigolds and ocote candles, no urban elements",
  },
  {
    slug: "el-maravilloso-mundo-de-las-abejas-y-la-apicultura-tradicional-en-mexico",
    title: "Las Abejas y la Apicultura Tradicional en México",
    palette: "honey gold, beeswax cream, melipona yellow-and-black stripe, flower pink and purple, tropical forest green, smoker silver",
    subjects: "a Mayan apiculturist in white veil and gloves holding up a hollow wooden jobón log hive opened on its side revealing the spiral honeycomb of stingless melipona beecheii bees inside, tiny stingless bees crawling on the spiral comb, a small clay pot collecting dripping amber miel virgen below, behind him a forest of flowering tropical trees with bees flying between blossoms, another traditional log hive hanging from a tree, in the foreground a bowl of fresh honeycomb and a wooden trowel covered in golden propolis, the Yucatecan jungle landscape",
  },
  {
    slug: "fermentos-tradicionales-mexicanos-sabores-que-sanan",
    title: "Fermentos Tradicionales Mexicanos: Sabores que Sanan",
    palette: "tepache gold, pulque cream, atole-agrio purple, vinegar straw, chile-pickle red, jar glass blue, salt white",
    subjects: "a rustic wooden table arranged with five different traditional Mexican ferments in clear glass jars side by side, all in one continuous still-life — golden bubbling tepache with pineapple peels, milky-white pulque foaming with bubbles, deep-purple atole agrio (sour blue corn drink), bright red pickled chiles en escabeche with carrots and onions, a jar of bubbling apple-pulque vinegar — each jar with a small hand-drawn icon (corn, maguey, pineapple, chile), a campesina behind the table stirring one with a wooden spoon, in the background an adobe kitchen with a clay pot of beans and hanging garlic braids",
  },
  {
    slug: "aprovechamiento-del-agua-captacion-pluvial-y-humedales-artificiales",
    title: "Aprovechamiento del Agua: Captación Pluvial y Humedales",
    palette: "rain blue, cistern grey, gravel ochre, reed green, water lily pink, sky cyan, tile terracotta",
    subjects: "a Mexican rural homestead with a sloped tile roof channeling rainwater through gutters into a large cylindrical concrete cistern at the side of an adobe house, a campesina filling a clay jar from the cistern tap, a small constructed wetland in the foreground — a shallow gravel-filled basin planted with green reeds, water lilies and totoras filtering greywater, the water flowing through different stages until clear, a milpa of corn and beans nourished by the cleaned water at the back, dark rain clouds approaching in the distance with halftone raindrops falling",
  },
  {
    slug: "defensa-del-territorio-estrategias-y-derechos",
    title: "Defensa del Territorio: Estrategias Comunitarias",
    palette: "earth red, agave green, fist gold, banner indigo, mountain ochre, flag red, sky cyan, cotton white",
    subjects: "a Mexican community assembly at the center — campesinos and indigenous community members of all ages standing together in a circle on their communal land, an older man at the front holding a wooden staff with a hand-painted banner showing a stylized symbol of corn and a mountain (no readable text), women with rebozos holding signs with painted icons of water and forest, in the background their ejido lands of milpa, pine forest and a small river, a wooden fence marking the communal boundary, mountains rising behind, one continuous peaceful scene of communal self-government, no urban elements",
  },
  {
    slug: "economia-solidaria-y-el-poder-del-trueque-en-comunidades-rurales",
    title: "Economía Solidaria y el Poder del Trueque",
    palette: "basket brown, corn yellow, cloth red, market striped multicolor, copper warmth, fruit green, sky cyan",
    subjects: "a vibrant Mexican rural tianguis (open-air market) with multiple campesino vendors exchanging goods without money — at the center two women trading a basket of red tomatoes and chiles for a stack of handwoven wool blankets, a man swapping a clay olla of frijoles for a sack of fresh-baked tortillas, another exchanging eggs from a wicker basket for a bunch of medicinal herbs, no money or coins visible anywhere, a hand-painted symbol of a balance scale above the market, colorful tarp roofs above on bamboo poles, milpa fields visible at the edges",
  },
  {
    slug: "cosmologia-indigena-y-su-relevancia-en-la-espiritualidad-nahua",
    title: "Cosmología Indígena y Espiritualidad Nahua",
    palette: "obsidian black, nahua red, jade green, sun gold, cempasuchil orange, copal smoke white, sky indigo, moon silver",
    subjects: "a symbolic Nahua cosmovision tableau — at the center a large concentric circle of the four cardinal directions with the sun Tonatiuh above and a maize plant Centeotl below, a moon disk on one side and a serpent Quetzalcoatl on the other, all rendered as bold halftone glyphs in the style of the Codex Borgia; below the cosmic circle a Nahua family at a domestic altar burning copal in a clay incensario, marigolds and a small bowl of cacao beans on the altar; behind them a starry indigo night sky with prehispanic constellations of the Pleiades and a rabbit-in-the-moon; no readable text, no modern elements",
  },
  {
    slug: "el-fascinante-mundo-de-los-hongos-y-su-cultivo",
    title: "El Fascinante Mundo de los Hongos",
    palette: "huitlacoche dark purple, oyster mushroom cream, amanita scarlet, soil brown, mycelium white, forest moss green, chanterelle gold",
    subjects: "a Mexican micocultivator in apron and hairnet harvesting a large cluster of fresh oyster mushrooms (setas) blooming from a vertical column of substrate hanging in a humid growing room, on the side a clay olla cooking dark-purple huitlacoche (corn-smut fungus) on the cob, a wicker basket of foraged wild mushrooms — chanterelles, boletes, and red-and-white amanitas, a microscope on a table showing branching mycelium threads in halftone, in the background a humid forest of encinos with mushrooms emerging from the leaf-litter floor, no text labels",
  },
  {
    slug: "bioconstruccion-tecnicas-sostenibles-con-tierra",
    title: "Bioconstrucción: Técnicas Sostenibles con Tierra",
    palette: "adobe red-ochre, cob earth brown, lime cal white, hay straw gold, sky cyan, water blue, stone grey",
    subjects: "an outdoor Mexican earth-construction site at midday — a campesino kneading wet cob (mud and straw) in a wide shallow pit with his bare feet, beside him an apprentice pressing fresh adobe bricks from a wooden mould and laying them out to sun-dry in a neat grid pattern, a half-finished adobe wall rising in the background with window openings roughed-in, bunches of dry golden straw and a wheelbarrow of moist red earth nearby, the gentle slope of a hill behind, distant pine-clad mountains, one continuous scene from edge to edge",
  },
  {
    slug: "el-renacer-de-la-tierra-polinizadores-y-humedales-en-la-restauracion-ecologica",
    title: "El Renacer de la Tierra: Polinizadores y Humedales",
    palette: "monarca orange, lily yellow, pond blue, reed green, sky cyan, leaf jade, lily pink",
    subjects: "a peaceful small wetland in a Mexican meadow at sunrise — a calm pond with floating pink water lilies and broad lily pads, tall green reeds growing along the edges, a colorful butterfly resting on a yellow daisy on the bank, a tiny hummingbird hovering at a red flower, a dragonfly skimming over the water, native flowers blooming everywhere, fresh green plants growing densely across the banks, gentle morning light, mountains far in the background, one continuous beautiful nature illustration from edge to edge",
  },
  {
    slug: "el-pulque-tradicion-y-sabor-del-maguey",
    title: "El Pulque: Tradición y Sabor del Maguey",
    palette: "maguey jade green, aguamiel honey gold, pulque cream white, terracotta clay red, sky cyan, agave silver-blue, sunset orange",
    subjects: "a huge mature maguey pulquero (Agave salmiana) at the foreground center with thick blue-green pencas reaching outward, a tlachiquero in white shirt and straw hat kneeling at its base extracting aguamiel from the hollowed-out heart of the plant with a long curved acocote gourd, a clay olla of milky-white fresh pulque beside him with foam at the top, another campesina in rebozo pouring pulque into a tall jícara cup, the agave plateau of Hidalgo stretching to the horizon with rows of more magueyes, no urban elements",
  },
  {
    slug: "delapencaaljarro",
    title: "De la penca al jarro: el proceso vivo",
    palette: "maguey blue-green, aguamiel gold, pulque cream, clay terracotta, cinta red, jícara brown, sky cyan",
    subjects: "a continuous step-by-step pulque-making scene from left to right (NOT panels) — at the left a tlachiquero hollowing the heart of a mature maguey with his small knife revealing the cavity that collects sweet aguamiel, in the center the same tlachiquero sucking aguamiel up through a long acocote gourd and emptying it into a wide clay olla, at the right a campesina in rebozo pouring milky pulque from a smaller olla into a tall painted jícara cup at a small wooden table, foreground maguey leaves and a curl of pulque foam; ONE continuous landscape with NO internal frames, NO panels, NO division lines, NO grid",
  },
  {
    slug: "guiadeadobe",
    title: "Guía práctica de adobe",
    palette: "adobe red-ochre, cob earth brown, hay straw gold, lime cal white, sky cyan, stone grey, mountain blue",
    subjects: "a Mexican rural adobe-making workshop in full sun — at the center two campesinos working together pressing wet earth-and-straw mix into a long wooden mould (adobera) with four bricks per pour, hands smoothing the tops with a flat wooden trowel, in the foreground a row of freshly demolded adobe bricks drying on the ground in neat rows, a wheelbarrow of red-brown moist earth and a bundle of golden straw beside them, an apprentice mixing more cob in a shallow pit with his bare feet, a half-built adobe wall at the right rising course by course, distant mountains, ABSOLUTELY NO color palette strips, NO color swatches, NO color sample bars, NO Pantone chips, NO color reference bars at the bottom or sides of the image",
  },
  {
    slug: "microbiotadelpulque",
    title: "Microbiota del pulque: quién es quién",
    palette: "pulque cream white, yeast pale yellow, lactobacilli rose pink, zymomonas blue, agave green, sugar gold, microscope cyan, foam highlight",
    subjects: "a generous cross-section illustration of a clay olla full of foaming milky pulque with a magnifying-glass 'zoom-in' to the right showing the rich microbiome inside the liquid — clusters of cream-pale-yellow oval yeast cells (Saccharomyces and Kloeckera) floating, chains of rose-pink lactic acid bacilli (Lactobacillus), comma-shaped blue Zymomonas mobilis bacteria, and small round bubbles of carbon dioxide rising; each microbe gently haloed in a different color (no readable text), at the left a maguey plant pouring its golden aguamiel into the olla like a stream, the fermentation made visible, NO abstract landscape, NO empty desert"
  },
  {
    slug: "noticias-verdes-restauracion-y-polinizadores",
    title: "Noticias verdes: restauración y polinizadores",
    palette: "monarca orange, native bee yellow-black, salvia magenta, leaf green, sky cyan, restored soil ochre, water blue, hummingbird red",
    subjects: "one continuous Mexican meadow scene at midday filled with active pollinators and a small restored stream running through — a monarch butterfly nectar-feeding on a salvia flower at the center, two native bees crawling on a yellow flor de cempasuchil, a small hummingbird hovering at a red bottle-brush flower above, a campesina at the right gently transplanting native flowers into restored soil with a wooden trowel, a vermicomposting bin nearby and a tiny constructed wetland with totoras and water lilies at the side, ONE continuous edge-to-edge scene, NO grid, NO panels, NO comic strip layout, NO multi-frame composition",
  },
  {
    slug: "humedales-urbanos-manual-de-bolsillo",
    title: "Humedales urbanos: manual de bolsillo",
    palette: "city silhouette grey-red, wetland reed green, pond blue, lily pad green, sky cyan, frog jade, water lily pink, paving stone grey",
    subjects: "a small urban Mexican humedal at the edge of a city park — the cityscape skyline rises in the distance as a low silhouette of mid-rise buildings, but in the foreground a healthy constructed wetland filled with floating lily pads, pink water lilies, tall green totoras and reeds filtering rainwater from the city's storm drains, a small frog perched on a stone, a dragonfly hovering, a child crouching at the edge watching a clear stream of filtered water flow back toward the city, one continuous scene",
  },
  {
    slug: "suelos-vivos",
    title: "Suelos vivos",
    palette: "humus dark brown, mycelium white, root cream, worm pink, leaf green, soil black, water droplet blue, fungal cap red",
    subjects: "a vertical cross-section illustration of a healthy Mexican forest soil profile filling the entire canvas top to bottom as ONE continuous slice — at the top a layer of fallen oak leaves and pine needles being broken down by tiny insects, below that the rich dark humus layer with white mycelium threads weaving everywhere, plant roots extending downward like a network, a fat pink earthworm tunneling diagonally, beetles and springtails and rolled-up cochinillas active in the dark, droplets of water and small bubbles of air between particles, a tiny red mushroom emerging on the surface, the deep mineral soil and bedrock at the bottom; ONE continuous cross-section, NO grid, NO panels, NO multi-frame layout",
  },
  {
    slug: "tierra-compactada-btc-rammed-earth",
    title: "Tierra compactada (BTC / Rammed Earth)",
    palette: "rammed earth ochre, compacted brown, rebar grey, wood form red, dust beige, sky cyan, mountain blue, machine blue",
    subjects: "a Mexican rural construction site at midday with two workers operating a manual ram (pisón) to compact moist earth inside a tall wooden formwork (encofrado) for a rammed-earth wall — the worker on top is bringing down the heavy ram, the other is adding a measured scoop of red-brown moist earth from a bucket, in the foreground a finished section of stratified rammed-earth wall showing horizontal layers in different earth tones, a stack of BTC (bloques de tierra compactada) blocks nearby, a small electric block-press machine at the side, distant adobe houses and pine-clad mountains behind, one continuous scene",
  },
  {
    slug: "cadena-de-valor-del-maguey",
    title: "Cadena de valor del maguey",
    palette: "maguey jade, aguamiel honey, pulque cream, mezcal copper amber, ixtle fiber gold, miel agave amber, terracotta clay red, sky cyan",
    subjects: "one continuous Mexican rural still-life scene showing all the products from a single maguey plant — at the center a huge agave with thick pencas, around it arranged in a half-circle: a clay olla of milky pulque, a glass bottle of clear mezcal, a small bowl of golden miel de agave syrup, bundles of cream-white ixtle fiber rope, a small dish of escamoles ant larvae, a roasted maguey heart cut open showing its fibrous interior, a piece of mixiote leaf wrapping; a campesino tlachiquero at one side overseeing it all with his acocote gourd in hand, no urban elements, NO labels, NO text",
  },
  {
    slug: "donde-el-aire-duele-el-pino-hartwegii-y-el-refugio-secreto-de-la-monarca",
    title: "Donde el aire duele: el pino Hartwegii y el refugio secreto de la monarca",
    palette: "pine deep green, frost white, bark charcoal black, monarca orange, cold cyan sky, resin amber, volcanic ash grey, dawn pink",
    subjects: "a high-altitude Mexican timberline forest of Pinus hartwegii pines clinging to a volcanic slope above the clouds at dawn — tall gnarled trees with thick cracked dark bark and long rigid blue-green needles dusted with white frost, an elderly campesino in a wool sarape and straw hat standing among the trunks touching sticky amber resin oozing from a fresh cut on a trunk, his frozen breath rising as halftone vapor in the bitter air, the ground covered in a thick layer of black fallen pine needles and patches of ice and frost, and high in the treetops dense clusters of orange-and-black monarch butterflies (Danaus plexippus) blanketing the upper branches — a few taking flight against the cold cyan sky, the snow-capped cone of a volcano (Iztaccíhuatl) rising in the background above a sea of clouds, one continuous edge-to-edge scene, no urban elements, no text",
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
