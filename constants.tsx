
import { Brand, GalleryImage } from './types';

export const BRAND_CONFIG = {
  [Brand.NOONI]: {
    color: 'bg-[#274472]',
    hoverColor: 'hover:bg-[#1e3660]',
    accent: 'text-[#274472]',
    description: 'Functionele paddenstoelenmixen — coffee, matcha, cacao. Help others become their best self.',
    catalogUrl: 'https://getnooni.com/collections/all',
    tone: `
      Minimaal. Zelfverzekerd. Schoon. Nooit opdringerig. Identity-driven, niet transactioneel.
      Als het leest als een supplement-advertentie: herschrijf het.

      ZINSBOUW: Kort. Periodiek. Vaak één clausule. Een punt doet meer werk dan een uitroepteken. Vertrouwen is punctuatie.
      WOORDTEST: Als je het op een podium zou zeggen — schrap het. Als je het zou zeggen tegen een vriend aan een keukentafel — houd het.

      WE ARE: Minimaal · Zelfverzekerd · Speels maar niet flauw · Elite, niet massa · Sensorisch en specifiek.
      WE ARE NOT: Opdringerig of schreeuwerig · Wellness-guru cliché · Bro-science energie · Overuitgelegd · Desperate for clicks.

      Schrijf in correct, helder Nederlands. Spreek de lezer aan met "je" en "jij".
    `,
    guidelines: `
      - DOELGROEP: Gezondheidsgerichte consumenten, koffieliefhebbers die betere energie zoeken, mensen die stress of slechte slaap willen aanpakken op een natuurlijke manier. Contemporary, youthful, leaning elite.
      - DOEL VAN NOONI: "Help others become their best self." Waarden: Kwaliteit & Transparantie.

      - SCHRIJFSTIJL (NIET-ONDERHANDELBAAR):
        * FOCUS OP DE TITEL: De inhoud moet 100% aansluiten bij het specifieke onderwerp.
        * EDUCATIEF EERST: Leg altijd uit WAAROM iets werkt — het mechanisme, de werkzame stof — niet alleen dát het werkt.
        * WETENSCHAPPELIJK MAAR TOEGANKELIJK: Gebruik termen als NGF of beta-glucanen, maar leg ze direct simpel uit.
        * SENSORISCH & SPECIFIEK: Beschrijf effecten concreet. Niet "geeft energie" maar "geen crash om 14:00 uur".
        * NUANCEER: Nooit absolute claims. Schrijf "kan ondersteunen", "studies suggereren", "traditioneel gebruikt voor".

      - COPY-INVALSHOEKEN (KIES PER BLOG):
        * Pijn-oplossing: "Koffie zonder de 2-uurs crash." / "Kan niet slapen? Reishi helpt."
        * Identity-led: "Niet iedereen drinkt dezelfde koffie. Goed." / "De koffie die je toekomstige zelf al drinkt."
        * Ingredient-led: "Lion's Mane. Chaga. Tremella. Dat is het." / "100% vruchtlichamen. Nul vulmiddel."
        * Sensorisch/ritueel: "Sommige ochtenden verdienen een betere kop." / "Wind down. Je hebt het verdiend."
        * Curiosity: "Wanneer heb je voor het laatst gecheckt wat er in je ochtendkopje zit?"

      - PRODUCTEN (NOEM ALLEEN ALS RELEVANT VOOR DE TITEL):
        * ☕ Mushroom Coffee (#E4CFBB · AM): Lion's Mane (450mg) + Chaga (300mg) + Tremella (300mg) + Maca (50mg). USP: Energie, focus & breinperformance. Steady energy, geen crash, 70% minder cafeïne.
        * 🍵 Mushroom Matcha (#688662 · MID): Reishi + Lion's Mane + Tremella. USP: Vitaliteit, productiviteit & immuunsysteem. Aanhoudende focus, immuunondersteuning, skin glow.
        * 🍫 Mushroom Cacao (#274472 · PM): Tremella + Lion's Mane + Reishi. USP: Ontspannen, herstel & slaap. Wind down, diepe slaap, recovery.
        * Capsules: Premium paddenstoelenmix voor dagelijks gebruik.

      - KWALITEITSDIFFERENTIATORS (VERMELD ALS RELEVANT):
        * Dubbele extractie: water (beta-glucanen) + alcohol (triterpenen) — haalt alle werkzame stoffen eruit.
        * 100% vruchtlichamen — geen mycelium op graan. Hogere concentratie werkzame stoffen.
        * Derde partij getest. Gemaakt in Nederland. Non-GMO. Vegan.
        * 4.8/5 Trustpilot.

      - ANTI-CLICHÉ (CRUCIAAL):
        * VERBODEN INTRO: Begin NOOIT met "Wist je dat...", "Al eeuwenlang...", "In de wereld van wellness...", of "Als je op zoek bent naar...".
        * VERBODEN TOON: Geen wellness-guru taal, geen bro-science, geen overdreven enthousiasme.
        * DIRECTE FOCUS: Begin de eerste zin DIRECT met het kernonderwerp uit de titel.
        * ELKE BLOG UNIEK: Varieer de invalshoek — mechanisme, historische context, wetenschappelijk onderzoek, praktische toepassing.

      - EXTERNE BRONNEN:
        * PRIMAIRE BRON: PubMed (pubmed.ncbi.nlm.nih.gov) of vergelijkbaar peer-reviewed journal.
        * Focus op functionele paddenstoelen, adaptogenen, cognitieve gezondheid, slaap.
    `,
    knowledgeBase: `
      NOONI KENNISBANK:
      - MERK: "Help others become their best self." Geproduceerd in Nederland. 4.8/5 Trustpilot. Marktgebied: NL · BE · DE.
      - TECHNOLOGIE: Dubbele extractie (water + alcohol) → beta-glucanen (immuun/cognitief) + triterpenen (adaptogeen/anti-inflammatoir). 100% vruchtlichamen — geen mycelium op graan.

      - LION'S MANE (Hericium erinaceus):
        * Stimuleert NGF (Nerve Growth Factor) en BDNF — eiwitten die brein nieuwe verbindingen laten maken.
        * Ondersteunt myelineschede — de "isolatielaag" van zenuwcellen.
        * Voordelen: focus, concentratie, geheugen, vermindering hersenmist.
        * Zit in: Coffee (450mg) · Matcha · Cacao.

      - REISHI (Ganoderma lucidum):
        * Krachtig adaptogeen — helpt het lichaam omgaan met stress (cortisol).
        * Beta-glucanen voor immuunmodulatie. Ondersteunt slaapkwaliteit via GABA-paden.
        * Historisch: "Paddenstoel van onsterfelijkheid" in de Traditionele Chinese Geneeskunde.
        * Zit in: Matcha · Cacao.

      - CHAGA (Inonotus obliquus):
        * Hoogste ORAC-antioxidantwaarde van alle bekende voedingsmiddelen.
        * Bevat betulinezuur, melaninen en polysacchariden.
        * Groeit op berken in koude klimaten (Siberië, Scandinavië). "The King of the Forest".
        * Voordelen: immuunsysteem, anti-inflammatoir, bescherming tegen oxidatieve stress.
        * Zit in: Coffee (300mg).

      - CORDYCEPS (Cordyceps sinensis/militaris):
        * Verhoogt ATP-productie en verbetert zuurstofopname (VO2max).
        * Ondersteunt mitochondriale functie. Traditioneel gebruikt door Tibetaanse herders en topsporters.
        * Voordelen: energie, uithoudingsvermogen, fysieke prestaties.

      - TREMELLA (Tremella fuciformis):
        * "De schoonheidspaddenstoel" — hydraterend effect vergelijkbaar met hyaluronzuur.
        * Ondersteunt huidhydratatie en collageen. Antioxidant.
        * Zit in: Coffee (300mg) · Matcha · Cacao.

      - MUSHROOM COFFEE SPECS: 150g · 60 porties · Per portie (2.5g): 1250mg paddenstoelenextract + 1400mg Arabica + 50mg Maca.
      - ACTIEVE AANBIEDING: 20% korting (limited time) · Abonnement: bespaar 37%.
    `
  }
};

export const PRODUCT_CATALOG = {
  [Brand.NOONI]: {
    "mushroom coffee": "https://getnooni.com/products/super-mushroom-coffee-blend",
    "mushroom cacao": "https://getnooni.com/products/nooni-mushroom-cacao",
    "mushroom matcha": "https://getnooni.com/products/matcha-mushroom-super-blend",
    "capsules": "https://getnooni.com/products/premium-functional-mushroom-blend-capsules",
    "paddenstoelenmix": "https://getnooni.com/collections/all",
    "functionele paddenstoelen": "https://getnooni.com/collections/all",
    "lion's mane": "https://getnooni.com/collections/all",
    "reishi": "https://getnooni.com/collections/all",
    "chaga": "https://getnooni.com/collections/all",
    "cordyceps": "https://getnooni.com/collections/all"
  }
};

import { NOONI_GALLERY as NOONI_DATA } from './data/gallery';

export const NOONI_GALLERY: GalleryImage[] = NOONI_DATA;

export const BLOG_FRAMEWORK = `
STRUCTUUR (STRIKT VOLGEN):
1. Titel — pakkend en SEO-geoptimaliseerd. Kort. Specifiek. Geen clickbait.
2. Introductie — 2-3 zinnen. Begin DIRECT met het onderwerp. Geen opwarmvragen. Geen "Wist je dat...".
3. Body — gebruik ## voor H2, ### voor H3. Koppen zijn KORT en SPECIFIEK (max 5-6 woorden). Geen vraagzin-koppen tenzij het echt scherp is.
4. Alinea's — kort. Maximaal 3-4 zinnen per alinea. Eén idee per alinea. Witregel tussen alinea's.
5. Conclusie — sluit concreet af. Call-to-action naar getnooni.com. Direct, niet slijmerig.

ZINSNIVEAU:
- Kort. Periodiek. Soms één clausule op een eigen regel.
- Geen dikgedrukte woorden midden in lopende tekst.
- Gebruik EM-dash (—) maximaal 1–2 keer per blog. Alleen voor een echt scherpe bijzin. Meer is een AI-signaal.
- Vertrouwen is punctuatie. Een punt doet meer werk dan een uitroepteken.

VERBODEN:
- Geen "In dit artikel leer je..."
- Geen "Conclusie is duidelijk: ..."
- Geen wellness-guru taal ("transformeer je leven", "unlock your potential")
- Geen bro-science ("supercharge je brein")
- Geen opeenhoping van superlatifs ("de krachtigste, meest effectieve, meest bewezen...")

Kwaliteitseis: Correct Nederlands. Één dominante invalshoek per blog — niet alles tegelijk.
`;
