const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// ── CSS (igual que antes) ─────────────────────────────────────────────────
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

// ── Contenido DIY mejorado ────────────────────────────────────────────────
const DIY = {

  "fermentos-tradicionales-mexicanos-sabores-que-sanan": {
    title: "Haz tu propio tepache de piña",
    intro: `¿Sabías que puedes hacer una bebida deliciosa y saludable con la cáscara de una piña que normalmente tiras a la basura? ¡Así es! El tepache es una bebida fermentada que las familias mexicanas han preparado por siglos. La fermentación significa que unos bichitos muy, muy pequeños llamados levaduras se comen el azúcar del piloncillo y de la piña, y al hacerlo producen burbujas y un sabor ácido-dulce riquísimo. En solo dos días tendrás una bebida refrescante llena de probióticos, que son microorganismos que cuidan tu barriga y te ayudan a estar sano. Lo mejor de todo es que solo necesitas cosas que seguramente ya tienes en casa.`,
    materials: [
      "Las cáscaras y el corazón de 1 piña madura — no tires esas partes, ¡son las más importantes!",
      "250 gramos de piloncillo (o azúcar mascabado) — es el alimento que comerán las levaduras",
      "2 litros de agua — si es de llave, déjala en una jarra destapada 30 minutos para que se vaya el cloro, porque el cloro mata las levaduras",
      "2 rajas de canela — le dan un sabor calientito y especiado",
      "5 clavos de olor — son pequeñas flores secas que añaden un aroma muy especial",
      "Un frasco de vidrio grande de 3 litros o una olla de barro — el vidrio y el barro son perfectos porque no le dan sabores raros al tepache",
      "Un pedazo de manta de cielo, tela de algodón o incluso un trapo limpio para cubrir el frasco",
    ],
    steps: [
      "Primero, lava la piña muy, muy bien con un cepillo y agua. Aunque no vayas a comer la cáscara, quieres que esté limpia porque esa cáscara va dentro de tu tepache. Frota con fuerza como si estuvieras lavando tus manos después de jugar en la tierra.",
      "Pela la piña y guarda todas las cáscaras y el corazón duro del centro. La pulpa puedes comerla o usarla para otra cosa. Corta el corazón en trozos pequeños para que quepan bien en el frasco.",
      "Coloca todas las cáscaras y el corazón dentro del frasco limpio. Agrégale el piloncillo partido en trozos, las rajas de canela y los clavos de olor. Si el piloncillo está muy duro, no te preocupes, se irá disolviendo solo con el agua.",
      "Vierte los 2 litros de agua a temperatura ambiente sobre todo lo que pusiste en el frasco. El agua no debe estar caliente porque el calor mataría a las levaduras que queremos que vivan y hagan su trabajo. Mezcla un poco con una cuchara limpia.",
      "Cubre el frasco con la manta de cielo y sujétala bien con una liga o cuerda. Es muy importante que NO uses una tapa con rosca hermética, porque la fermentación produce gas y si tapas el frasco puede explotar. La tela deja salir el gas pero no deja entrar insectos ni polvo.",
      "Coloca el frasco en un lugar de tu cocina que esté a temperatura ambiente, lejos de la luz directa del sol. En invierno ponlo en el lugar más cálido que encuentres. Después de 24 horas verás pequeñas burbujitas subir por el líquido, ¡eso significa que las levaduras están trabajando y todo va bien!",
      "Espera entre 48 y 72 horas en total. Cuando el líquido esté burbujeante y huela dulce-ácido, como una mezcla entre jugo de fruta y algo ligeramente fermentado, ¡está listo! Cuela el tepache con un colador para retirar las cáscaras, cuélalo en botellas o jarra y mételo al refrigerador.",
    ],
    tip: "Si después de 48 horas sabe muy dulce, déjalo un poco más. Si sabe muy ácido, la próxima vez lo catas antes. El tepache refrigerado dura hasta 3 días. Un secreto: puedes reusar las mismas cáscaras una segunda vez añadiendo agua nueva y la mitad del piloncillo, la segunda tanda fermenta más rápido porque las levaduras ya están activas.",
  },

  "aprovechamiento-del-agua-captacion-pluvial": {
    title: "Construye tu propio sistema para atrapar la lluvia",
    intro: `Imagina que cada vez que llueve, en vez de que toda esa agua se vaya al drenaje, tú la pudieras guardar para regar tus plantas, limpiar el patio o llenar el sanitario. ¡Eso es exactamente lo que hace un sistema de captación pluvial! El agua cae sobre tu techo, rueda por una canal hacia un tubo, pasa por un filtro que limpia la basura de las primeras lluvias (hojas, polvo, pajaritos que pasaron por ahí), y finalmente llega limpia a un tinaco donde la guardas. En zonas donde llueve moderadamente, un techo de apenas 50 metros cuadrados puede captar hasta 30,000 litros de agua al año. ¡Eso es suficiente para regar un jardín durante meses!`,
    materials: [
      "Canal de PVC de 4 pulgadas (grosor) — la compras en la ferretería cortada al largo de la orilla de tu techo",
      "Bajante de PVC de 4 pulgadas — el tubo vertical que lleva el agua de la canal hacia abajo",
      "Un 'first flush' o desvío de primera lluvia — puedes comprar uno hecho o hacerlo con un tubo ciego y codos de PVC; sirve para tirar los primeros 20 litros de lluvia que son los más sucios",
      "Un tinaco o cisterna de 1,000 a 5,000 litros con tapa — aquí se guarda el agua",
      "Malla anti-mosquitos para cubrir la entrada del tinaco — muy importante para que no entren mosquitos a poner huevecillos",
      "Pegamento especial para PVC, codos y soportes metálicos para colgar la canal",
    ],
    steps: [
      "Primero observa tu techo: elige la orilla por donde escurre más agua cuando llueve. Esa será tu zona de captación. Mide ese borde con una cinta métrica para saber cuántos metros de canal necesitas comprar.",
      "Instala los soportes metálicos en la pared o en la orilla del techo con tornillos. Estos soportes sostendrán la canal. Muy importante: la canal no debe quedar completamente horizontal, sino que debe tener una ligera inclinación de 1 centímetro por cada metro de largo. Esto hace que el agua ruede solita hacia el bajante y no se estanque.",
      "Coloca la canal sobre los soportes. En el extremo más bajo conecta el bajante de PVC vertical, que bajará el agua hacia tu filtro y tu tinaco.",
      "Instala el 'first flush' en la parte baja del bajante. Este artefacto funciona así: las primeras lluvias arrastran hojas, polvo y suciedad del techo, ese primer 'lavado' se desvía a un tubo ciego que se llena y luego, cuando ya está lleno, el agua limpia que sigue cayendo pasa directo al tinaco. Es como cuando te lavas las manos: primero el agua sale sucia y luego sale limpia.",
      "Conecta la salida limpia del first flush a tu tinaco. Cubre la entrada con malla anti-mosquitos y asegúrate de que la tapa del tinaco cierre bien. El agua estancada sin tapa atrae mosquitos que transmiten enfermedades.",
      "Prueba el sistema antes de que lleguen las lluvias: vierte cubetas de agua en la canal y observa que fluya bien por todo el recorrido, que no haya fugas en las conexiones y que el tinaco se llene correctamente.",
    ],
    tip: "El agua que captas es excelente para regar, limpiar y llenar el sanitario. Si quieres usarla para cocinar o beber, necesitas agregarle un filtro de carbón activado y unas gotitas de cloro o un filtro de luz UV. Limpia la canal y el tinaco una vez al año, antes de la temporada de lluvias, para retirar hojas y sedimentos acumulados.",
  },

  "maguey-usos-y-beneficios": {
    title: "Saca tus propias fibras de ixtle de una penca de maguey",
    intro: `El maguey es como una fábrica natural: dentro de sus pencas gruesas y carnosas se esconden miles de fibras larguísimas y muy resistentes llamadas ixtle. Estas fibras son como los huesos de la penca, le dan estructura y firmeza. Las personas que vivían en México antes de la conquista ya sabían sacar esas fibras y las usaban para hacer cuerdas, redes, sandalias, morrales y hasta ropa. Hoy en día puedes hacer lo mismo en casa y aprender de primera mano cómo funciona esta maravilla de la naturaleza. El proceso es fascinante: golpeas y raspas la penca, y de repente aparecen hebras blancas y brillantes como si fueran cabellos de plata.`,
    materials: [
      "1 penca de maguey adulto — busca una que esté en la parte exterior de la planta, las pencas maduras son más grandes y rígidas",
      "Un cuchillo bien afilado para un adulto — los niños siempre con supervisión",
      "Una piedra plana grande o una tabla de madera gruesa — será tu superficie de trabajo",
      "Un balde o cubeta con agua limpia",
      "Un peine de dientes anchos, un tenedor viejo o un palito de madera con punta",
      "Una cuerda o tendedero para secar las fibras al final",
    ],
    steps: [
      "Con mucho cuidado y siempre con ayuda de un adulto, corta la penca de la planta desde su base. Las espinas de los bordes y la punta son muy filosas. Puedes usar guantes gruesos o envolver tus manos con trapos para protegerte mientras la manipulas.",
      "Coloca la penca sobre tu piedra plana o tabla. Retira las espinas de los bordes cortándolas con el cuchillo, dejando solo la parte plana y carnosa. La espina de la punta también quítala.",
      "Ahora golpea la penca varias veces con una piedra o con el mango de tu cuchillo. No la golpees con furia, sino con golpes firmes y repetidos por toda la superficie. Verás cómo se empieza a aplanar y a ablandar. Esto rompe las células de la pulpa y libera las fibras.",
      "Con el filo del cuchillo, empieza a raspar la superficie de la penca con movimientos largos desde la base hacia la punta. Verás cómo la pulpa verde y aguada cae a los lados y van apareciendo fibras blancas. Sigue raspando con paciencia, como si estuvieras cepillando algo delicadamente.",
      "Cuando hayas sacado las fibras de un lado, voltea la penca y repite el proceso del otro lado. Al terminar tendrás un manojo de fibras blancas y húmedas pegadas entre sí.",
      "Lleva las fibras al balde con agua y enjuágalas bien moviendo tus manos entre ellas para retirar todos los restos de pulpa verde. El agua se pondrá turbia y verdosa, eso es normal.",
      "Pasa el peine o el palito por entre las fibras húmedas para separarlas, igual que cuando te peinas el cabello enredado. Hazlo con suavidad para no romperlas.",
      "Cuelga las fibras extendidas en el tendedero bajo el sol. En 2 o 3 días estarán completamente secas y tendrán un color blanco brillante. ¡Listas para usar!",
    ],
    tip: "Una penca mediana puede darte entre 50 y 200 gramos de ixtle seco. Con esas fibras puedes trenzarlas a mano para hacer un cordón, enrollarlas para hacer una estropajo natural para lavar trastes, o incluso tejerlas si aprendes los nudos básicos. Las fibras secas duran años si las guardas en un lugar seco.",
  },

  "bioconstruccion-tecnicas-sostenibles": {
    title: "Haz tu primer bloque de tierra cruda con tus manos",
    intro: `¿Sabías que la tierra que pisas todos los días puede convertirse en un ladrillo sólido para construir? Así es como se construían las casas hace miles de años en todo el mundo, y todavía hoy millones de personas viven en casas hechas de tierra. El secreto está en la arcilla, que es un tipo especial de tierra que cuando se moja se vuelve pegajosa y moldeable como plastilina, y cuando se seca se endurece fuerte. Al mezclarla con paja, las fibras de la paja actúan como refuerzo, igual que el acero en el concreto moderno. Hacer tu primer bloque es como hacer escultura con la tierra, y cuando lo veas seco y sólido semanas después, sentirás el orgullo de haber creado material de construcción con tus propias manos.`,
    materials: [
      "Tierra arcillosa — búscala donde el suelo sea de color rojizo o amarillento; si tomas un puñado húmedo y lo aprietas y mantiene la forma, tiene suficiente arcilla",
      "Paja seca picada o zacate seco — córtala en pedazos de 10 a 15 centímetros, no más larga porque si no se enreda todo",
      "Agua — la cantidad justa, no mucha ni poca",
      "Un molde de madera — puedes hacer uno con tablas clavadas, tamaño aproximado 30×15×10 centímetros (largo×ancho×alto)",
      "Una lona, plástico viejo o nylon grande para mezclar en el suelo",
      "Tus pies o tus manos — ¡esta es la herramienta más importante!",
    ],
    steps: [
      "Primero haz la prueba de la arcilla: toma un puñado de tierra seca y quítale piedras y palitos. Humedécela poco a poco mientras la amasas. Si puedes formar una bola que no se rompe al apretarla y no se pega demasiado a tus manos, ¡esa tierra tiene la cantidad correcta de arcilla! Si se desmenuza mucho, necesitas tierra más arcillosa.",
      "Extiende la lona en el suelo. Pon encima 3 partes de tierra cernida por cada 1 parte de paja seca. Por ejemplo: 3 cubetas de tierra y 1 cubeta de paja. Mezcla la tierra y la paja en seco primero, con tus manos o con una pala, hasta que la paja quede distribuida por toda la tierra.",
      "Ahora agrega agua poco a poco, como un chorrillo, mientras sigues mezclando. La mejor forma es amasar con los pies: párate encima de la mezcla y camina sobre ella, doblando las rodillas para apretar bien. Es como pisar uvas para hacer vino, pero con tierra. Sigue agregando un poquito de agua hasta que la mezcla se sienta como barro firme: que no se parta cuando la doblas, pero que tampoco se pegue tanto a tus pies que no puedas despegarte.",
      "Humedece el interior del molde de madera con agua para que el bloque no se pegue. Llena el molde con el barro, apretando bien con las manos en las esquinas y los bordes donde se forman huecos. Cuando esté lleno, pasa una regla o tablita por la superficie superior para dejarla plana y pareja.",
      "Levanta el molde con cuidado jalando hacia arriba. El bloque debe quedarse solo, manteniendo su forma. Si se derrumba, la mezcla tiene demasiada agua; déjala secar un rato antes de volver a intentarlo.",
      "Coloca los bloques en un lugar plano a la sombra, nunca bajo el sol directo las primeras dos semanas porque se secan muy rápido por fuera y se agrietan. Voltéalos después de 5 días para que se sequen parejos en todos lados.",
      "Después de 3 a 4 semanas de secado, toca el bloque: debe sentirse duro como piedra y sonar hueco cuando lo golpeas con los nudillos. ¡Ya está listo para usar en tu proyecto de construcción!",
    ],
    tip: "Para saber si tu mezcla está bien antes de hacer muchos bloques, haz solo una bola del tamaño de tu puño y déjala caer desde 1 metro de altura. Si no se rompe ni se aplana demasiado, ¡la mezcla es perfecta! Si se revienta en pedazos, le falta arcilla o agua. Si se aplana como torta, tiene demasiada agua.",
  },

  "la-milpa-agricultura": {
    title: "Siembra tu propia milpa aunque sea en una cubeta grande",
    intro: `La milpa es el sistema de cultivo más inteligente que los pueblos originarios de México inventaron hace miles de años. El secreto es que en la milpa se siembran juntas tres plantas que se ayudan entre sí como si fueran amigas: el maíz crece alto y le da al frijol un palo natural donde trepar; el frijol tiene una habilidad mágica para tomar el nitrógeno del aire y regalárselo a la tierra para que sea más fértil; y la calabaza extiende sus hojas grandes como una cobija sobre el suelo para que no se seque y para que no crezcan hierbas que compitan con las otras plantas. ¡Tres amigas que viven juntas y se cuidan mutuamente! Puedes experimentar esta sabiduría ancestral incluso en el patio de tu casa o en tu balcón.`,
    materials: [
      "Semillas de maíz criollo — búscalas en tianguis, mercados orgánicos o con agricultores locales; las variedades criollas son más resistentes que las de bolsita de súper",
      "Semillas de frijol negro, bayo o el que consigas — cualquier frijol que no sea demasiado híbrido",
      "Semillas de calabaza criolla o de pipián",
      "Un contenedor grande de al menos 60 centímetros de diámetro y 40 de profundidad, o un espacio de tierra en el patio",
      "Tierra negra mezclada con composta o estiércol seco — necesitas tierra suelta y nutritiva",
      "Agua para riego",
    ],
    steps: [
      "Llena tu contenedor o prepara tu espacio de tierra mezclando 2 partes de tierra negra con 1 parte de composta o estiércol seco. La tierra debe quedar suelta, sin terrones duros. Si aprietas un puñado en tu mano y luego lo sueltas, debe deshacerse fácilmente.",
      "Siembra las semillas de maíz primero. Haz 3 o 4 hoyitos en el centro del contenedor con tu dedo, a unos 5 centímetros de profundidad (aproximadamente el largo de tu dedo pulgar hasta la primera articulación). Pon 1 semilla en cada hoyito y tápalo con tierra. Riega suavemente.",
      "Espera pacientemente. En una semana comenzarán a salir brotes verdes. Cuídalos regando cada 2 o 3 días. Cuando las plantas de maíz tengan unos 20 centímetros de altura, aproximadamente en 2 o 3 semanas, es el momento de sembrar el frijol.",
      "Siembra 2 o 3 semillas de frijol a unos 5 centímetros del tallo del maíz, enterradas a 3 centímetros de profundidad. El frijol empezará a crecer y buscará al maíz para treparlo como si fuera una escalera.",
      "Una semana después de sembrar el frijol, siembra las semillas de calabaza en los bordes del contenedor o en las orillas del espacio de tierra. La calabaza se extenderá hacia afuera y cubrirá el suelo con sus hojas grandes.",
      "Riega en las mañanas, directo a la tierra y no sobre las hojas. Observa cada día cómo las plantas crecen y se ayudan entre sí. En unos 3 meses tendrás tus primeras cosechas.",
    ],
    tip: "Guarda siempre las mejores semillas de tu cosecha para el siguiente ciclo. Elige las mazorcas más llenas, los frijoles más grandes y las calabazas más sanas. Así mejoras tu semilla año tras año como lo han hecho los agricultores mexicanos por generaciones. La semilla criolla que guardas y siembras cada año se adapta cada vez mejor a tu suelo y clima específico.",
  },

  "el-renacer-de-la-tierra": {
    title: "Crea un jardín de flores para atraer abejas y mariposas",
    intro: `Las abejas, mariposas y colibríes son como los carteros de las plantas: llevan el polen de flor en flor para que las plantas puedan reproducirse y dar frutos. Sin ellos, no habría manzanas, aguacates, chiles, ni calabazas. El problema es que las ciudades cada vez tienen menos flores y estos animales están perdiendo su alimento. ¡Tú puedes ayudarlos creando un jardín de polinizadores! No necesitas mucho espacio ni dinero: con 3 macetas y algunas semillas de flores nativas puedes crear un pequeño restaurante y hotel para abejas y mariposas. Cuando los veas llegar a tu jardín, sabrás que estás haciendo algo muy importante para el planeta.`,
    materials: [
      "3 a 5 macetas medianas o grandes de al menos 20 centímetros de diámetro — más grande, mejor",
      "Tierra mezclada con composta",
      "Semillas o plantas de flores nativas: cempasúchil, lavanda, salvia roja, tagetes amarillos, girasoles — las nativas son mejores porque los insectos las reconocen desde hace miles de años",
      "Un trozo de madera de al menos 20 centímetros de largo con agujeros taladrados de diferentes tamaños (3 a 8 milímetros) — este será el hotel de abejas solitarias",
      "Un plato hondo o recipiente poco profundo",
      "Piedras medianas limpias",
    ],
    steps: [
      "Elige el lugar más soleado de tu balcón, azotea o patio. Los polinizadores aman el sol y las flores necesitan mínimo 4 a 6 horas de luz solar directa al día para crecer bien y producir néctar abundante.",
      "Llena las macetas con la mezcla de tierra y composta. Deja unos 3 centímetros sin llenar hasta el borde para que cuando riegues el agua no se derrame toda.",
      "Siembra las flores o trasplanta las plantas que ya vienen en macetita. Un truco importante: siembra grupos de la misma flor en cada maceta, no mezcles muchas especies distintas. Las abejas y mariposas se orientan mejor cuando ven manchas de un solo color.",
      "Coloca el trozo de madera con agujeros en un lugar protegido de la lluvia directa, como bajo un alero o una repisa, a una altura de 1 a 1.5 metros del suelo, con los agujeros apuntando horizontalmente. Las abejas solitarias pondrán sus huevecillos ahí adentro. Son completamente inofensivas, no pican.",
      "Pon el plato hondo con piedras y agua limpia cerca de las flores. Las abejas necesitan beber pero se ahogan en el agua profunda; las piedras les dan un lugar donde pararse para beber sin caerse.",
      "Riega temprano en la mañana, antes de que salga el sol fuerte, y riega directo a la tierra, no sobre las flores. Si riegas las flores del medio día se pueden quemar.",
      "Siéntate cerca y observa en silencio. En pocos días empezarán a llegar los primeros visitantes. Con el tiempo tendrás un pequeño ecosistema funcionando en tu espacio.",
    ],
    tip: "¡Nunca uses insecticidas, ni siquiera los 'naturales' si no sabes bien cómo usarlos! Los insecticidas matan a todos los insectos sin distinguir entre los malos y los buenos. Si ves que alguna planta tiene plagas, puedes mezclar agua con unas gotitas de jabón líquido neutro y rociar en la noche, cuando las abejas no están volando. Al día siguiente enjuaga las plantas con agua limpia.",
  },

  "el-pulque-tradicion": {
    title: "Fermenta aguamiel en casa para hacer tu propio pulque",
    intro: `El pulque es una de las bebidas más antiguas de México, tan antigua que los aztecas la consideraban sagrada y solo la podían tomar los ancianos y los sacerdotes en ceremonias especiales. Se hace con el aguamiel, que es el jugo dulce y transparente que produce el maguey desde su centro. Cuando el aguamiel queda expuesto al aire, unos microorganismos invisibles llamados levaduras y bacterias empiezan a comérselo y a transformarlo: lo hacen ligeramente alcohólico, ácido, con una textura un poquito espesa y un sabor único que no se parece a ninguna otra cosa en el mundo. Si consigues aguamiel fresco en un mercado o directamente con un productor, puedes repetir en casa este proceso milenario.`,
    materials: [
      "1 litro de aguamiel fresco — busca en mercados tradicionales, tianguis o directamente con productores de maguey; cuanto más fresco mejor, el mismo día de la extracción es ideal",
      "Un frasco de vidrio de boca ancha de al menos 2 litros — el vidrio no le da sabores extraños a tu pulque",
      "Manta de cielo, tela de algodón limpia o gasa",
      "Una liga gruesa o un trozo de cuerda",
      "Una cuchara de madera — el metal puede alterar ligeramente el sabor",
      "Un colador fino para al final",
    ],
    steps: [
      "Lava muy bien el frasco de vidrio con agua caliente y jabón. Enjuágalo varias veces hasta que no quede nada de jabón. Cualquier residuo de jabón puede arruinar tu fermentación matando los microorganismos.",
      "Vierte el aguamiel fresco dentro del frasco limpio. Huele el aguamiel: debe oler dulce y fresco, como melaza ligera. Si huele raro o agrio desde el principio, pregunta al vendedor cuándo fue extraído.",
      "Cubre la boca del frasco con la manta de cielo y sujétala bien con la liga. Este paso es crucial: la tela permite que entre el oxígeno que necesitan las levaduras para empezar a trabajar, y también que salga el gas que producen, pero no deja entrar moscas, mosquitos ni polvo.",
      "Coloca el frasco en un lugar de tu cocina a temperatura ambiente, entre 20 y 28 grados. No lo pongas en el refrigerador porque el frío detiene la fermentación. Tampoco lo pongas en el sol directo porque el calor excesivo puede matar los microorganismos.",
      "Revuelve suavemente con la cuchara de madera una vez cada día. Al revolver introduces pequeñas cantidades de aire que ayudan a las levaduras. Observa cada vez: ¿hay burbujas? ¿Cómo huele? A las 24 horas ya deberías ver pequeñas burbujitas y oler algo ligeramente ácido-afrutado.",
      "Entre las 36 y 48 horas tu pulque está listo. Sabrás que está bien cuando: tiene burbujas activas, huele ácido-dulce y ligeramente alcohólico (no a vinagre fuerte), tiene una textura ligeramente viscosa o espesa si agitas el frasco, y sabe agridulce con un toque a fermentado.",
      "Cuela el pulque para retirar cualquier partícula que haya caído, mételo al refrigerador y consúmelo en los siguientes 2 días.",
    ],
    tip: "El pulque fresco tiene entre 2 y 6 grados de alcohol, menos que una cerveza. Si lo dejas fermentar más tiempo se pone más ácido y con más alcohol. Un truco de los tlachiqueros: reserva siempre una taza del pulque que hiciste para usarla como 'madre' en tu próxima tanda. La madre ya tiene todas las levaduras activas y acelerará mucho la fermentación.",
  },

  "delapencaaljarro": {
    title: "Haz pulque casero paso a paso como un tlachiquero",
    intro: `El tlachiquero es la persona que raspa el maguey y extrae el aguamiel para hacer pulque. Es un oficio muy especial que se aprende de generación en generación. Cuando el tlachiquero sabe que un maguey ya está maduro para raspar, le abre el corazón con su raspino (un cuchillo curvo) y espera a que el maguey empiece a producir aguamiel, que puede ser entre 1 y 5 litros diarios durante meses. Ese aguamiel se lleva al tinacal, que es donde fermenta en grandes recipientes de barro. Tú puedes reproducir este proceso en pequeño en tu casa si consigues aguamiel fresco, y entenderás por qué el pulque es tan especial y diferente a cualquier otra bebida.`,
    materials: [
      "2 litros de aguamiel fresco — consíguelo el mismo día que lo vas a usar, el aguamiel se empieza a fermentar solo desde que se extrae del maguey",
      "Una olla de barro o un frasco de vidrio de 3 litros — el barro es ideal porque mantiene la temperatura estable y tiene una microbiota natural que ayuda a la fermentación",
      "Media taza de 'madre de pulque' — es pulque ya fermentado que le donas a tu nuevo aguamiel para acelerar el proceso; consíguelo en pulquerías o con productores",
      "Manta de cielo para cubrir",
      "Cuchara o palita de madera",
    ],
    steps: [
      "Si tienes olla de barro, enjuágala con agua caliente y déjala escurrir boca abajo 10 minutos. No la jabones porque el jabón destruiría la microbiota natural del barro que ayuda a fermentar.",
      "Vierte la media taza de madre de pulque en el fondo de la olla o frasco. La madre es como un starter de pan: ya contiene todas las levaduras y bacterias activas que necesitas.",
      "Agrega los 2 litros de aguamiel fresco encima de la madre. Mezcla muy suavemente con la cuchara de madera, solo para integrar un poco, no revuelvas fuerte.",
      "Cubre con la manta de cielo y coloca en un lugar cálido y tranquilo donde no lo vayan a mover mucho. La temperatura ideal es entre 22 y 28 grados.",
      "A las 8 horas verifica: debe empezar a burbujear. Si no burbujea aún, está bien, depende de la temperatura. A las 12 horas sí debería tener actividad visible.",
      "Revuelve suavemente una vez al día para oxigenar y homogenizar la fermentación.",
      "Entre las 24 y 36 horas tu pulque está listo: tiene textura ligeramente viscosa (como leche un poco espesa), color blanco lechoso, olor ácido-afrutado y sabor agridulce único. Cuela y refrigera.",
    ],
    tip: "Siempre reserva media taza de tu pulque para usarla como madre en la siguiente tanda. Así mantienes viva tu propia comunidad de microorganismos que se va adaptando a tu agua, a tu temperatura y a tu aguamiel. Con el tiempo tu pulque casero tendrá un sabor único e irrepetible que ningún otro tendrá.",
  },

  "guiadeadobe": {
    title: "Fabrica tus propios adobes de tierra y paja",
    intro: `El adobe es quizás el material de construcción más antiguo que existe. Antes del cemento, antes del tabique de barro cocido, la gente construía sus casas mezclando tierra con paja y agua, llenando moldes y dejando secar al sol. Miles de edificios históricos en México, en Egipto, en Perú y en todo el mundo están hechos de adobe y siguen en pie después de cientos de años. El secreto del adobe es simple pero fascinante: la arcilla de la tierra actúa como pegamento natural, y la paja actúa como esqueleto, como los huesos que le dan resistencia al bloque. Es un material que regula naturalmente la temperatura de las casas: las mantiene frescas en verano y calientitas en invierno, sin necesitar aire acondicionado ni calefacción.`,
    materials: [
      "Tierra arcillosa — busca tierra de color rojizo, amarillo intenso o naranja; evita tierra negra porque tiene mucha materia orgánica que se pudre",
      "Paja seca de trigo, avena o zacate — córtala en pedazos de 10 a 15 centímetros con tijeras o machete",
      "Agua",
      "Un molde de madera — puedes hacerlo con 4 tablas clavadas; tamaños comunes: 30×15×10 cm o 40×20×10 cm",
      "Una lona grande o plástico para amasar",
      "Una tabla plana para colocar los adobes a secar",
    ],
    steps: [
      "Busca la tierra correcta: toma un puñado húmedo y apriétalo. Si mantiene la forma de tu mano con claridad y la superficie queda un poco brillante, tiene buena arcilla. Si se deshace como arena, no sirve para adobe sin mezclarla con tierra más arcillosa.",
      "Cierne la tierra sobre la lona usando una malla o un costro de alambre para retirar piedras mayores a 1 centímetro. Las piedras grandes hacen que el adobe se rompa.",
      "Mezcla en seco sobre la lona: 4 partes de tierra cernida con 1 parte de paja picada. Revuelve con las manos o con una pala hasta que la paja quede distribuida de manera uniforme por toda la tierra.",
      "Agrega agua poco a poco, como si estuvieras regando, mientras pisas y amasas la mezcla con tus pies. El pisado es la técnica tradicional y la más efectiva: tus pies sienten perfectamente la consistencia. La mezcla está lista cuando: al agarrar un puñado y apretarlo se forma una bola firme que no se pega en la mano ni se rompe; si la tiras al suelo desde la altura de tu cintura, no se deshace pero sí se aplana un poco.",
      "Humedece el interior del molde con agua para evitar que el adobe se pegue. Llena el molde echando la mezcla en partes, apretando con fuerza en las esquinas donde siempre se forman bolsas de aire. Cuando esté lleno, pasa una tablita o regla por la superficie para emparejarla.",
      "Levanta el molde jalando hacia arriba en movimiento recto. Si el bloque se queda de pie, ¡perfecto! Si se cae, la mezcla tiene mucha agua; déjala secar 20 minutos y vuelve a intentar.",
      "Deja los adobes a la sombra en un lugar plano durante la primera semana, lejos del sol directo que los agrieta. A los 5 días voltéalos para que el lado de abajo también seque. Después de la primera semana pueden estar al sol. En 3 a 4 semanas estarán completamente duros.",
    ],
    tip: "Haz siempre una prueba antes de producir muchos: haz 2 o 3 adobes de prueba, espera que sequen y golpéalos con un martillo. Si no se agrietan ni se parten, tu mezcla es buena. Si se agrietan mucho, necesita más paja. Si es muy frágil y se deshace, necesita más arcilla. Afinar la mezcla antes de hacer 200 adobes te ahorra mucho trabajo.",
  },

  "microbiotadelpulque": {
    title: "Observa con tus sentidos los microorganismos del pulque",
    intro: `Los microorganismos son seres vivos tan pequeños que no los puedes ver a simple vista, pero puedes observar todo lo que hacen porque dejan señales muy claras: burbujas, olores, cambios de sabor y textura. En el pulque trabajan principalmente dos tipos: las levaduras, que son hongos microscópicos que se comen el azúcar y producen alcohol y gas (el CO₂ que crea las burbujas), y las bacterias lácticas, que producen el ácido láctico que le da el sabor ácido característico. Observar una fermentación es como ver una película en cámara lenta de lo que pasa dentro de un ecosistema microscópico completo. No necesitas microscopio: tus ojos, nariz y lengua son suficientes para ser un científico del pulque.`,
    materials: [
      "Medio litro de pulque fresco o aguamiel recién obtenido",
      "Un frasco de vidrio transparente de 1 litro — que sea transparente para poder ver lo que pasa adentro",
      "Un termómetro de cocina para medir la temperatura",
      "Manta de cielo para cubrir",
      "Un cuaderno y lápiz para anotar tus observaciones como científico",
    ],
    steps: [
      "Vierte el pulque o aguamiel en el frasco limpio y anota en tu cuaderno: la hora, la temperatura del líquido, el color (¿blanco lechoso?, ¿transparente como agua?), el olor (¿dulce?, ¿neutro?) y el sabor si pruebas una cucharada (¿dulce?, ¿sin sabor especial?).",
      "Cubre con la manta de cielo y coloca a temperatura constante entre 22 y 26 grados. Pon el termómetro cerca para registrar la temperatura. Las levaduras trabajan mejor en este rango: si hace más frío se duermen, si hace más calor se mueren.",
      "Cada 8 horas regresa al frasco y anota todo lo que observas: ¿hay burbujas?, ¿cuántas?, ¿son grandes o pequeñas?, ¿cómo huele ahora?, ¿el color cambió?, ¿si mueves el frasco el líquido se ve más espeso?",
      "A las 12 a 24 horas verás burbujeo activo — algunas burbujitas suben constantemente. Esto es el CO₂ producido por las levaduras en plena actividad. Si pones tu mano sobre el frasco (sin quitarle la tela) sentirás las burbujas llegar. Esta es la fase de fermentación acelerada.",
      "A las 36 a 48 horas el burbujeo se calma un poco y la textura del líquido se vuelve ligeramente más espesa y viscosa. Las bacterias lácticas están tomando el control y produciendo el ácido que caracteriza al pulque maduro. Prueba con una cuchara limpia: ¿notas la diferencia de sabor respecto al principio?",
      "Escribe tus conclusiones en el cuaderno: ¿en qué momento fue la mayor actividad de burbujas?, ¿cómo cambió el olor de inicio a fin?, ¿en qué etapa te gustó más el sabor?",
    ],
    tip: "Si en algún momento notas que aparece una capa de color rosado, anaranjado o verde en la superficie, o si el pulque huele a acetona (como quitaesmalte) o a algo claramente descompuesto, tíralo: fue contaminado por microorganismos no deseados. El pulque sano siempre huele a fermento ácido-afrutado agradable. Aprende a distinguir el olor bueno del malo: esa habilidad es la más importante para hacer fermentos.",
  },

  "noticias-verdes-restauracion": {
    title: "Monta tu estación de polinizadores con plantas y un hotel de abejas",
    intro: `Las abejas solitarias son uno de los polinizadores más eficientes del mundo. A diferencia de las abejas melíferas que viven en colmenas grandes, las abejas solitarias viven solas: la hembra encuentra un pequeño túnel o agujero, lo llena de polen y miel como alimento, pone sus huevecillos ahí dentro y lo sella. Estas abejas no tienen miel que defender, así que prácticamente nunca pican. Un simple trozo de madera con agujeros colocado en tu patio puede convertirse en el hogar de decenas de ellas, y a cambio polinizarán todas tus plantas de los alrededores. Combinado con flores nativas, crearás un pequeño refugio que puede marcar la diferencia para la biodiversidad de tu colonia o pueblo.`,
    materials: [
      "3 a 5 macetas de al menos 20 centímetros — mientras más grandes mejor",
      "Tierra negra con composta",
      "Plantas nativas en flor: lavanda, tomillo, cempasúchil, salvia roja, tagetes — las encuentras en mercados o viveros",
      "Un trozo de madera dura (roble, pino grueso, bambú) de al menos 20 × 10 centímetros y 15 de profundidad — pidele a alguien que te ayude a taladrar agujeros de 3 a 8 milímetros de diámetro y 10 a 15 centímetros de profundidad",
      "Un plato hondo o charola poco profunda",
      "Piedritas o canicas para poner en el plato del agua",
    ],
    steps: [
      "Escoge el lugar más soleado de tu espacio. Las plantas necesitan sol y las abejas también lo buscan para calentarse por la mañana antes de salir a trabajar. Un lugar con sol de la mañana y un poco de sombra en las tardes muy calurosas es perfecto.",
      "Llena las macetas con tierra y composta. Trasplanta las plantas nativas con cuidado, sácalas de su maceta original apretando por debajo para no lastimar las raíces. Siembra plantas de diferentes alturas para crear un pequeño jardín con capas.",
      "Riega bien las plantas recién trasplantadas y coloca las macetas agrupadas, no separadas. Un grupo de flores es mucho más atractivo para los polinizadores que flores sueltas aquí y allá.",
      "Prepara el hotel de abejas: si la madera no tiene corteza, puedes dejarla así o pintarla con colores brillantes en la cara delantera para hacerla más visible. Todos los agujeros deben ser ciegos (cerrados en un extremo, abiertos en el otro). Fíjate bien que los agujeros estén limpios y sin astillas adentro.",
      "Cuelga el hotel de abejas en un lugar protegido de la lluvia directa, que le dé el sol de la mañana y que esté a 1 a 1.5 metros del suelo, con los agujeros apuntando horizontalmente o ligeramente hacia abajo para que no entre el agua.",
      "Coloca el plato con piedritas y agua limpia cerca de las flores. Cambia el agua cada 2 días para evitar que se conviertan en criadero de mosquitos.",
      "Siéntate a observar con paciencia. En los primeros días pueden llegar mariposas y abejas melíferas. Con el tiempo, si el hotel está bien ubicado, verás abejas solitarias entrando y saliendo de los agujeros llevando pelotitas de polen en sus patas traseras.",
    ],
    tip: "Anota en un cuaderno qué insectos llegan, a qué hora y en qué flores. Con el tiempo tendrás un registro fascinante de la vida que creaste. El hotel de abejas necesita limpiarse una vez al año en otoño: retira los cocones viejos vacíos para dejar espacio a las nuevas inquilinas de la siguiente temporada.",
  },

  "humedales-urbanos": {
    title: "Construye un humedal de tres cajones para filtrar agua en casa",
    intro: `Un humedal es un ecosistema donde el agua se mueve lentamente a través de capas de grava, arena y tierra mientras las raíces de las plantas la van limpiando de manera natural. Los humedales son los riñones del planeta: filtran el agua sucia y la devuelven limpia. Puedes recrear este proceso en miniatura en tu patio o azotea con tres cajones grandes. El agua del lavabo, que solo tiene jabón y suciedad suave, entra por un cajón, viaja lentamente por las capas de los tres cajones mientras raíces de plantas y microorganismos la van purificando, y sale por el último cajón lista para regar tus plantas. Es magia natural que puedes observar y tocar.`,
    materials: [
      "3 cajones de madera, cubetas grandes o macetas de 50 litros cada una — deben poder estar a diferentes alturas para que el agua fluya por gravedad",
      "Grava gruesa (piedras de 1 a 3 centímetros) — una bolsa grande",
      "Arena de río lavada — una bolsa mediana",
      "Tierra negra o composta",
      "Plantas de humedal o acuáticas: tule, papiro, menta acuática, berro, espadaña — búscalas en viveros o en ríos y lagos cercanos",
      "Manguera delgada o tubo de PVC de media pulgada para conectar los cajones",
      "Un taladro o clavo grueso para hacer los agujeros de conexión",
    ],
    steps: [
      "Coloca los tres cajones en escalera: el primero en el nivel más alto (puede estar en una tabla o ladrillo elevado), el segundo a nivel medio y el tercero en el nivel más bajo. El agua fluirá sola de arriba hacia abajo gracias a la gravedad, sin necesitar bomba.",
      "En cada cajón pon las capas en este orden de abajo hacia arriba: primero 5 centímetros de grava gruesa (deja que drene el exceso de agua), luego 5 centímetros de arena de río (filtra partículas pequeñas), y finalmente 10 centímetros de tierra o composta (donde vivirán las raíces y los microorganismos).",
      "Haz un agujero en la parte inferior de los cajones 1 y 2 para conectarlos con la manguera. El agua debe poder fluir del fondo del cajón 1 hacia el cajón 2, y del fondo del cajón 2 hacia el cajón 3. Usa un poco de silicón o cinta impermeable si las conexiones gotean.",
      "Siembra las plantas acuáticas en los cajones 2 y 3, donde más humedad habrá. El tule y el papiro van bien en espacios que siempre tienen agua cerca de las raíces. La menta acuática y el berro también son excelentes.",
      "Para iniciar el sistema, vierte agua lentamente por el cajón 1 y observa que fluya hacia los otros dos. Las primeras veces el agua saldrá turbia porque arrastra tierra; eso es normal y se aclara en unos días.",
      "Después de 2 semanas las raíces de las plantas habrán creado una capa de microorganismos llamada biofilm que es la que realmente limpia el agua. A partir de ahí puedes empezar a usar el agua gris del lavabo para que entre por el primer cajón.",
    ],
    tip: "El agua que sale del tercer cajón sirve perfectamente para regar plantas de jardín o árboles frutales. No la uses para regar hortalizas que van a comer crudas. Poda las plantas cada mes cortando los tallos más viejos a ras del suelo; esas podas son excelente composta. Tu humedal en 6 meses se habrá convertido en un ecosistema completamente autosuficiente con microorganismos, plantas e incluso insectos acuáticos.",
  },

  "bambu-estructural": {
    title: "Aprende a curar bambú para que dure décadas",
    intro: `El bambú es una de las plantas más sorprendentes del mundo: crece rapidísimo (hasta 1 metro por día en algunas especies), es más resistente que muchas maderas, es flexible sin romperse y se puede usar para construir casas, muebles, puentes y hasta bicicletas. Pero tiene un problema: si no se cura correctamente, los gorgojos lo perforan y la humedad lo pudre en solo meses. El secreto está en eliminar los almidones y azúcares que tiene naturalmente y que son el alimento favorito de los insectos. Con bórax y ácido bórico, dos sales minerales baratas y poco tóxicas de ferretería, puedes curar el bambú para que dure 20 o 30 años sin problemas.`,
    materials: [
      "Cañas de bambú maduras — el bambú maduro tiene al menos 3 años de edad; se reconoce porque la caña es de color verde oscuro que se va volviendo amarillo, y al golpearla suena hueco y sólido",
      "1 kilogramo de bórax (borato de sodio) — ferretería grande o tienda de productos químicos",
      "1 kilogramo de ácido bórico — mismo lugar",
      "10 litros de agua caliente",
      "Una tina, cajón de madera impermeabilizado o zanja cubierta con plástico para sumergir las cañas",
      "Plástico para cubrir las cañas mientras están sumergidas",
    ],
    steps: [
      "Corta el bambú en luna menguante si puedes. Los agricultores tradicionales saben que en luna menguante la savia baja hacia las raíces y el tronco tiene menos azúcares, haciéndolo menos atractivo para los insectos. Si no puedes esperar a esa luna, no te preocupes mucho, el bórax compensará.",
      "Disuelve el kilogramo de bórax y el kilogramo de ácido bórico en 10 litros de agua caliente. Revuelve bien con un palo hasta que no veas cristales en el fondo. Esta solución se llama 'solución bórica' y es la que protegerá el bambú. Puedes usar guantes de hule para este paso.",
      "Coloca las cañas de bambú en la tina y vierte la solución bórica encima hasta que queden completamente cubiertas. Las cañas flotarán, así que ponles piedras pesadas encima o usa el plástico para cubrirlas y aplanarlas para que queden sumergidas.",
      "Déjalas sumergidas durante 72 horas completas, es decir, 3 días enteros. Durante este tiempo la solución penetrará por los poros de la caña y reemplazará los azúcares que atraen a los insectos.",
      "Saca las cañas y ponlas de pie, verticalmente, apoyadas en una pared, para que escurra el líquido excedente durante 24 horas. Si puedes ponerlas bajo un techo para que no les caiga lluvia, mejor.",
      "Tiende las cañas horizontalmente en un lugar con buena ventilación y sombra, no bajo el sol directo. Colócalas sobre soportes para que el aire circule también por abajo. Gíralas un cuarto de vuelta cada semana para que sequen de manera pareja. En 4 a 6 semanas estarán listas.",
    ],
    tip: "El bambú curado listo para usar tiene un color uniforme dorado o amarillento, sin manchas, y suena completamente sólido y seco al golpearlo. Consérvalo en un lugar seco y ventilado. Si lo vas a usar en exterior, dale una mano de aceite de linaza o barniz cada año para protegerlo de la lluvia y del sol.",
  },

  "polinizacion-del-maiz": {
    title: "Poliniza maíz criollo a mano para asegurar mazorcas llenas",
    intro: `El maíz se poliniza normalmente con el viento: el polen cae desde la espiga (la parte de arriba de la planta) hasta los pelos sedosos del elote que crecen en medio del tallo. Cada pelo corresponde exactamente a un grano del elote: si ese pelo no recibe su grano de polen, ese espacio queda vacío. Por eso a veces ves elotes con granos faltantes. Cuando siembras pocas plantas de maíz en un espacio pequeño, el viento a veces no es suficiente y hay poco polen disponible. Ayudar a la polinización a mano es un proceso fascinante que te enseña exactamente cómo funciona la reproducción de las plantas, y garantiza mazorcas completamente llenas de punta a punta.`,
    materials: [
      "Plantas de maíz que ya estén en floración — la espiga de arriba está abierta y suelta un polvo amarillo cuando la sacudes; los elotes ya tienen sus pelos sedosos visibles saliendo",
      "Bolsas de papel pequeñas o sobres de papel — el papel absorbe el pol que es húmedo y lo conserva mejor que el plástico",
      "Cinta adhesiva para cerrar las bolsas si quieres guardar el polen",
    ],
    steps: [
      "Sal al jardín o huerto muy temprano en la mañana, antes de las 9, porque el pol del maíz se produce principalmente en las mañanas frescas. En el calor del mediodía ya se deteriora. Busca las plantas cuyas espigas ya están completamente abiertas y con las ramitas extendidas.",
      "Sostén con una mano la bolsa de papel abierta justo debajo de la espiga. Con la otra mano, sacude suavemente el tallo de la espiga hacia la bolsa. Verás caer un polvo fino amarillo-dorado dentro de la bolsa. Ese polvo son millones de granos de polen.",
      "Recoge el polen de 3 a 5 plantas diferentes para mezclar el material genético. Esto es muy importante: si solo usas el polen de una planta, las semillas de esos elotes serán menos vigorosas. La diversidad genética hace plantas más sanas.",
      "Ahora acércate a un elote que tenga los pelos sedosos bien visibles y frescos — deben verse brillantes y un poco húmedos, no secos ni cafés. Inclina suavemente la bolsa con el pollen sobre los pelos y sacúdela levemente para que el polvo caiga directamente sobre ellos.",
      "Repite esta operación con todos los elotes que tengan pelos frescos en tus plantas. Hazlo durante 3 a 5 días consecutivos mientras dure la floración, porque no todos los pelos maduran al mismo tiempo.",
      "Marca con un estambre o cintita las plantas que polinizaste a mano para identificar sus mazorcas al momento de la cosecha. En unos 2 meses verás el resultado: mazorcas completamente llenas de granos bien formados hasta las puntas.",
    ],
    tip: "Cuando coseches, selecciona las mazorcas más llenas y sanas de las plantas más vigorosas para guardar como semilla. Déjalas secar completamente en la planta y luego cuélgalas en un lugar seco y ventilado. Cuando los granos estén completamente duros y secos, desgránalos y guárdalos en un frasco de vidrio con una bolsita de arroz crudo para absorber la humedad. Así tendrás semilla criolla para los próximos años.",
  },

  "suelos-vivos": {
    title: "Haz tu propia composta en casa y convierte basura en tierra dorada",
    intro: `La composta es el abono más poderoso y nutritivo que existe, y lo mejor de todo es que se hace casi solo con la basura orgánica que produces en casa. Cuando echas al suelo cáscaras de fruta, restos de verdura, cartón y hojas secas, millones de microorganismos (bacterias, hongos) y pequeños animales (lombrices, cochinillas, milpiés) empiezan a descomponer esos materiales y los transforman en humus: una tierra oscura, esponjosa y llena de nutrientes que hace que cualquier planta crezca fuerte y sana. Es como si la naturaleza tuviera su propia fábrica de fertilizante que funciona gratis con tus desechos. Hacer composta también reduce a la mitad la basura que generas en casa.`,
    materials: [
      "Un cajón de madera de al menos 50×50×50 centímetros, o una cubeta grande de 100 litros con agujeros en los lados, o simplemente un rincón de tierra en tu patio",
      "Materiales VERDES (húmedos y ricos en nitrógeno): cáscaras de frutas y verduras, restos de cocina, posos de café con su filtro de papel, cáscaras de huevo trituradas",
      "Materiales CAFÉS (secos y ricos en carbono): cartón corrugado picado, papel periódico arrugado, hojas secas del jardín, tallos secos",
      "Un puñado de tierra de jardín o composta ya hecha (para agregar cada semana)",
      "Un palo grueso o varilla de metal para revolver",
      "Una regadera o botella con agujeros para humedecer",
    ],
    steps: [
      "Coloca tu compostera en un lugar semi-sombrado, con contacto directo con la tierra si es posible (para que las lombrices del suelo puedan entrar). Empieza poniendo una capa de 10 centímetros de material café en el fondo: cartón picado, hojas secas o papel.",
      "Encima agrega una capa de 5 centímetros de material verde: las cáscaras del día, los posos de café, las cáscaras de huevo. La proporción ideal es siempre 2 partes de material café por 1 parte de material verde. Si pones demasiado verde sin café, la composta se pone fea y huele mal.",
      "Encima de los materiales agrega un puñado de tierra de jardín. Esta tierra trae consigo millones de microorganismos que son los trabajadores de tu compostera.",
      "Revisa la humedad: aprieta un puñado de la mezcla en tu mano. Debe sentirse húmedo pero no soltar agua, como una esponja exprimida. Si está muy seco, riégalo un poco. Si está muy mojado, agrega más material seco.",
      "Cada semana agrega los nuevos materiales siguiendo siempre la proporción 2 cafés:1 verde, y revuelve toda la pila con el palo para oxigenarla. El oxígeno es el combustible de los microorganismos: sin aire se asfixian y la composta deja de funcionar.",
      "En 4 a 6 semanas verás que el fondo de la pila empieza a oscurecerse y a verse diferente al material que pusiste: ya no reconocerás las cáscaras originales. Ese material oscuro de abajo es composta joven. En 2 a 3 meses tendrás composta completamente lista: oscura, esponjosa, con olor a tierra de bosque después de la lluvia.",
    ],
    tip: "¡Nunca metas a la compostera carnes, huesos, pescado, lácteos, aceites ni excrementos de perros y gatos! Estos materiales atraen animales, generan malos olores y traen bacterias dañinas. Las cáscaras de naranja, limón y otros cítricos se pueden usar pero en pequeñas cantidades porque contienen aceites que ralentizan la descomposición. Una compostera bien manejada nunca huele mal: si huele feo, le falta material café o le falta oxígeno.",
  },

  "tierra-compactada-btc": {
    title: "Fabrica un bloque de tierra comprimida (BTC) y prueba su resistencia",
    intro: `Un bloque de tierra comprimida o BTC es como un adobe pero mucho más resistente porque en vez de secarse al sol, se comprime con mucha fuerza en el momento de hacerlo. Esa compresión hace que las partículas de arcilla, arena y cal se unan muy apretadamente, creando un bloque que puede resistir más de 20 kilogramos por centímetro cuadrado, más que muchos tabiques de barro cocido. Las casas hechas con BTC son frescas en verano, calientitas en invierno, resistentes a los sismos si se construyen bien, y tienen una huella de carbono mucho menor que las de concreto. Hacer tu primer BTC a mano es un experimento fascinante que te conecta directamente con la tradición constructiva de los pueblos del mundo.`,
    materials: [
      "Tierra arcillosa cernida — con 15 a 20% de arcilla; haz la prueba del rollito: amasa la tierra húmeda y forma un rollito de 3 milímetros de grosor y 10 de largo; si no se rompe al doblarlo, tiene suficiente arcilla",
      "Cal apagada en polvo — 5 a 8% del volumen de tierra; esto equivale a unos 2 o 3 kilos de cal por cada 30 kilos de tierra",
      "Agua — solo la necesaria, aproximadamente 15 a 18% del peso total",
      "Un molde de madera reforzado con ángulos metálicos en las esquinas, o una prensa CINVA-Ram si consigues una",
      "Un pisón de madera (un tronco redondo de unos 10 centímetros de diámetro y 50 de largo) o de metal",
    ],
    steps: [
      "Cierne la tierra sobre una lona para eliminar piedras mayores a 1 centímetro. Las piedritas grandes rompen la compresión y debilitan el bloque.",
      "Mezcla en seco primero: vierte la tierra cernida en la lona y agrega la cal en polvo. Revuelve muy bien con una pala o con tus manos durante varios minutos hasta que todo quede de un color uniforme. La cal actúa como cemento natural: reacciona con la arcilla y el agua para crear compuestos muy resistentes.",
      "Agrega el agua muy poco a poco, como un chorrillo, mientras sigues mezclando. La mezcla tiene la humedad correcta cuando: al apretar fuerte un puñado en la mano forma una bola que no se deshace al soltarla; al frotar los dedos después de soltarla no quedan pegajosos; y si tiras la bola al suelo desde la altura de tus rodillas, la bola se aplana un poco pero no se desmorona.",
      "Llena el molde con la mezcla en tres capas: echa un tercio de la mezcla, comprime con el pisón dando golpes firmes y repetidos por toda la superficie, echa el segundo tercio y vuelve a pisonar, finalmente el último tercio y pisonar fuerte hasta que la superficie quede completamente dura.",
      "Desmolda inmediatamente jalando el molde hacia arriba. A diferencia del adobe, el BTC se desmolda en el acto porque la compresión le da firmeza desde el principio. El bloque debe quedarse solo sin inclinarse ni agrietarse.",
      "Coloca los bloques a la sombra en un lugar donde no les llueva. Durante los primeros 7 días húmedecelos ligeramente con una esponja o una regadera fina cada 2 días. Este proceso se llama curado y es fundamental: la cal necesita humedad para reaccionar y endurecer correctamente.",
    ],
    tip: "Para hacer la prueba de resistencia de tu BTC: después de 7 días de curado, apoya el bloque entre dos superficies con solo los extremos y párate encima. Un BTC bien hecho aguanta el peso de un adulto sin quebrarse. Después de 28 días de curado tendrá toda su resistencia final. Si se raja con facilidad, necesita más cal o la tierra no tiene suficiente arcilla.",
  },

  "cadena-de-valor-del-maguey": {
    title: "Aprende a raspar un maguey y extraer el aguamiel como tlachiquero",
    intro: `Raspar el maguey es el arte más antiguo de la cultura pulquera. El tlachiquero necesita saber exactamente cuándo el maguey está listo para dar su aguamiel, cómo abrir el corazón sin matar la planta, con qué fuerza raspar para estimular la producción sin dañar los tejidos, y cómo extraer el líquido diariamente durante meses. Es una relación profunda entre el humano y la planta que se aprende con años de práctica y observación. Si tienes acceso a un maguey adulto que esté por echar su quiote (el tallo floral que sale en el centro), tienes la oportunidad de aprender directamente este saber milenario. El aguamiel que obtengas puedes beberlo fresco, endulzarlo para hacer curados, o dejarlo fermentar para hacer pulque.`,
    materials: [
      "Un maguey adulto de al menos 8 años — sabrás que está listo porque las pencas del centro se empiezan a aflojar y el corazón se siente esponjoso al tocarlo",
      "Un raspino o cuchillo raspador curvo — la herramienta tradicional del tlachiquero; si no tienes, un cuchillo curvo o una cuchara de metal resistente funciona",
      "Un acocote — es una calabaza seca hueca que sirve de succionador; si no tienes, una manguera delgada de 1 metro y una cubeta funciona igual",
      "Un recipiente limpio de boca ancha con tapa",
      "Un lienzo o tela para cubrir el cajete y protegerlo de insectos",
    ],
    steps: [
      "Identifica el maguey maduro: acércate al centro de la planta y con cuidado toca las pencas más internas. Si se mueven con facilidad y el corazón del centro tiene aspecto esponjoso y blanquecino, el maguey está produciendo la savia que pronto se convertiría en el quiote floral. Este es el momento exacto para raspar.",
      "Con el raspino o cuchillo, corta cuidadosamente las 3 o 4 pencas del centro que están tapando el cajete (la cavidad donde se acumula el aguamiel). Corta desde la base de cada penca. Guarda esas pencas porque también tienen muchos usos.",
      "Una vez expuesto el cajete, raspa el fondo con movimientos circulares y firmes usando el raspino. Este raspado estimula a la planta a producir más aguamiel. Raspa con la fuerza suficiente para retirar la capa superficial oxidada pero sin llegar a las fibras profundas del corazón.",
      "Cubre el cajete inmediatamente con el lienzo y asegúralo con una piedra o lazo para que no entren moscas, avispas ni lluvia. Deja pasar 24 horas.",
      "Al día siguiente regresa. Retira el lienzo con cuidado y observa: el cajete estará lleno de aguamiel, un líquido transparente a ligeramente turbio, dulce y fresco. Con el acocote (o la manguera), extrae el aguamiel por succión llevándolo directamente a tu recipiente limpio.",
      "Antes de volver a cubrir el cajete, raspa nuevamente el fondo para estimular la producción del día siguiente. Esta rutina diaria de raspado y extracción se repite durante 3 a 6 meses, que es lo que dura la producción de un maguey.",
    ],
    tip: "El mejor aguamiel es el de las primeras horas de la mañana: es el más dulce y fresco. Conforme avanza el día se empieza a fermentar solito. Consúmelo el mismo día que lo extraes o refrigéralo máximo 2 días. Recuerda que raspar el maguey implica que la planta morirá al final de su ciclo de producción porque usa toda su energía en producir aguamiel en lugar de florecer y reproducirse. Por eso los tlachiqueros siempre siembran más magueyes de los que raspa, para asegurar la continuidad de la plantación.",
  },
};

// ── Construir HTML de sección DIY ─────────────────────────────────────────
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

function findDIYKey(url) {
  for (const key of Object.keys(DIY)) {
    if (url.includes(key)) return key;
  }
  return null;
}

// ── Regex para reemplazar sección existente ───────────────────────────────
const DIY_SECTION_REGEX = /<section class="diy-section">[\s\S]*?<\/section>/;

const posts = JSON.parse(fs.readFileSync(path.join(ROOT, "posts.json"), "utf-8"));
let updated = 0;
let skipped = 0;

for (const post of posts) {
  const htmlPath = path.join(ROOT, post.url);
  if (!fs.existsSync(htmlPath)) { console.log(`SKIP (no existe): ${post.url}`); skipped++; continue; }

  const key = findDIYKey(post.url);
  if (!key) { console.log(`SKIP (sin DIY): ${post.url}`); skipped++; continue; }

  let html = fs.readFileSync(htmlPath, "utf-8");
  const newSection = buildDIYSection(DIY[key]);

  if (DIY_SECTION_REGEX.test(html)) {
    // Reemplazar sección existente
    html = html.replace(DIY_SECTION_REGEX, newSection.trim());
  } else {
    // Insertar antes del CTA (por si acaso)
    if (!html.includes(DIY_CSS.trim().slice(0, 30))) {
      html = html.replace("</style>", DIY_CSS + "\n  </style>");
    }
    html = html.replace("    <!-- CTA SUSCRIPCIÓN -->", newSection + "\n\n    <!-- CTA SUSCRIPCIÓN -->");
  }

  fs.writeFileSync(htmlPath, html, "utf-8");
  console.log(`OK: ${post.url}`);
  updated++;
}

console.log(`\nActualizados: ${updated} | Omitidos: ${skipped}`);
