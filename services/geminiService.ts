import { Brand, BlogContent } from "../types";
import { BRAND_CONFIG, BLOG_FRAMEWORK, NOONI_GALLERY } from "../constants";
import { getMemory } from "./memoryService";

const MODEL = 'claude-sonnet-4-6';

const shuffleArray = (array: any[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getImageInstruction = (): string => {
  const validImages = NOONI_GALLERY.filter(img =>
    !img.description.includes("Error") && !img.description.includes("Rate Limit")
  );

  if (validImages.length === 0) {
    return "Geen afbeeldingen beschikbaar. Laat selectedImage1–5 leeg.";
  }

  const shuffled = shuffleArray(validImages).slice(0, 20);
  const galleryItems = shuffled
    .map(img => `- "${img.filename}": ${img.description}`)
    .join('\n');

  return `
BESCHIKBARE AFBEELDINGEN:
${galleryItems}

Kies exact 5 afbeeldingen: 3 relevant voor het blogonderwerp, 2 willekeurig.
Geef de bestandsnamen terug in selectedImage1 t/m selectedImage5.
  `.trim();
};

const BLOG_TOOL = {
  name: "write_blog",
  description: "Schrijf een volledig SEO-blog voor Nooni en geef het terug als gestructureerde data.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description: "Pakkende, SEO-geoptimaliseerde blogtitel. Specifiek en direct."
      },
      introduction: {
        type: "string",
        description: "2-3 zinnen. Begin direct met het onderwerp. Geen 'Wist je dat...'. Max 100 woorden."
      },
      body: {
        type: "string",
        description: "Volledige body in Markdown. Gebruik ## voor H2, ### voor H3. Geen afbeeldingen of **bold** tenzij echt nodig."
      },
      conclusion: {
        type: "string",
        description: "Afsluitende alinea. Concreet. CTA naar getnooni.com. Niet slijmerig."
      },
      metaTitle: {
        type: "string",
        description: "SEO meta title. Strikt max 60 tekens."
      },
      metaDescription: {
        type: "string",
        description: "SEO meta description. Strikt max 160 tekens."
      },
      urlSlug: {
        type: "string",
        description: "URL handle in kebab-case. Bijv: lion-s-mane-focus-en-hersenmist"
      },
      imageAltText: {
        type: "string",
        description: "Alt tekst voor de hoofdafbeelding"
      },
      selectedImage1: { type: "string" },
      selectedImage2: { type: "string" },
      selectedImage3: { type: "string" },
      selectedImage4: { type: "string" },
      selectedImage5: { type: "string" },
    },
    required: ["title", "introduction", "body", "conclusion", "metaTitle", "metaDescription", "urlSlug", "imageAltText"]
  }
};

export const generateBlogContent = async (
  brand: Brand,
  userTitle: string,
  extraContext: string,
): Promise<BlogContent> => {
  const config = BRAND_CONFIG[brand];

  const memory = await getMemory();
  const recentBlogs = memory.blogs
    .filter(b => b.brand === brand)
    .slice(-5)
    .map(b => `- "${b.title}" (/${b.urlSlug})`)
    .join('\n');

  const systemPrompt = `
Je bent de vaste senior SEO copywriter voor nooni. Je schrijft blogs die naadloos aansluiten bij het merk.

MERK IDENTITEIT:
${config.tone}

RICHTLIJNEN:
${config.guidelines}

KENNISBANK:
${config.knowledgeBase}

RECENT GEPUBLICEERD (vermijd overlap):
${recentBlogs || 'Nog geen geschiedenis.'}

${getImageInstruction()}

BLOG LENGTE — kies automatisch op basis van de titel:

KORT (800–1.000 woorden): gebruik dit voor titels met "wat is", "verschil", "vs", "of", een specifieke vraag, of een korte uitleg.
Structuur: intro + 2–3 H2's + conclusie.

MIDDEL (1.200–1.500 woorden): gebruik dit voor titels over werking, voordelen, ervaringen, dosering, combinaties.
Structuur: intro + 4–5 H2's (elk 2–3 alinea's) + conclusie.

LANG (1.600–2.000 woorden): gebruik dit alleen voor titels met "complete gids", "alles wat je moet weten", "gids voor beginners", of een duidelijk pillar-onderwerp.
Structuur: intro + 6–7 H2's (met H3's waar relevant) + conclusie.

Kies de categorie die past bij de titel — schrijf niet meer dan nodig. Kwaliteit boven kwantiteit.

BLOG FRAMEWORK:
${BLOG_FRAMEWORK}

Gebruik de write_blog tool om je output te structureren. Schrijf uitsluitend in correct Nederlands.
  `.trim();

  const userMessage = `Schrijf een blog over: "${userTitle}"${extraContext.trim() ? `\n\nExtra context/broninformatie:\n${extraContext}` : ''}`;

  const payload = {
    model: MODEL,
    max_tokens: 8000,
    system: systemPrompt,
    tools: [BLOG_TOOL],
    tool_choice: { type: "any" as const },
    messages: [{ role: "user" as const, content: userMessage }]
  };

  let attempt = 0;
  const maxRetries = 3;
  let lastError: any = null;

  while (attempt < maxRetries) {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        const msg = err.error || response.statusText;

        if (response.status === 429) throw new Error('RATE_LIMIT: ' + msg);
        if (response.status === 401) throw new Error('AUTH: ' + msg);
        throw new Error(msg);
      }

      const data = await response.json();

      // Extract tool use block
      const toolBlock = data.content?.find((c: any) => c.type === 'tool_use' && c.name === 'write_blog');
      if (!toolBlock?.input) {
        throw new Error('Geen blog tool output ontvangen van Claude.');
      }

      const b = toolBlock.input;
      const clean = (v: any) => (v ? String(v).replace(/\*\*/g, '').trim() : '');

      return {
        title: clean(b.title),
        introduction: clean(b.introduction),
        body: clean(b.body),
        conclusion: clean(b.conclusion),
        metaTitle: clean(b.metaTitle),
        metaDescription: clean(b.metaDescription),
        urlSlug: clean(b.urlSlug),
        imageAltText: clean(b.imageAltText),
        selectedImage1: clean(b.selectedImage1),
        selectedImage2: clean(b.selectedImage2),
        selectedImage3: clean(b.selectedImage3),
        selectedImage4: clean(b.selectedImage4),
        selectedImage5: clean(b.selectedImage5),
      };

    } catch (err: any) {
      lastError = err;
      attempt++;
      const msg = err?.message || '';

      if (msg.startsWith('RATE_LIMIT')) break;
      if (msg.startsWith('AUTH')) break;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  const msg = lastError?.message || String(lastError);
  if (msg.includes('RATE_LIMIT')) throw new Error('API-limiet bereikt. Wacht even en probeer opnieuw.');
  if (msg.includes('AUTH')) throw new Error('ANTHROPIC_API_KEY ongeldig. Controleer je .env.local bestand.');
  throw new Error(`Blog genereren mislukt na ${maxRetries} pogingen. Fout: ${msg}`);
};
