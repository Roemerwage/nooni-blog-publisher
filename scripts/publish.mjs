/**
 * Usage:
 *   node scripts/publish.mjs --today                   # runs today's scheduled topic (used by GitHub Actions)
 *   node scripts/publish.mjs "Topic one" "Topic two"   # run specific topics immediately
 *   node scripts/publish.mjs scripts/plan-june.json    # run all topics in a plan file
 */

import { marked } from 'marked';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local when running locally — in GitHub Actions, secrets are injected directly
try {
  const envPath = resolve(__dirname, '../.env.local');
  const lines = readFileSync(envPath, 'utf-8').split('\n').filter(l => l.includes('='));
  for (const line of lines) {
    const [k, ...v] = line.split('=');
    if (k && !process.env[k.trim()]) process.env[k.trim()] = v.join('=').trim();
  }
} catch {}

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BLOG_ID      = '104268136791';
const SHOPIFY_SHOP = 'getnooni.myshopify.com';

// ─── Argument parsing ─────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const todayOnly = args.includes('--today');
const cleanArgs = args.filter(a => a !== '--today');

let TOPICS = [];

if (todayOnly) {
  const today = new Date().toISOString().split('T')[0];
  const planFiles = readdirSync(__dirname).filter(f => f.startsWith('plan-') && f.endsWith('.json'));
  for (const file of planFiles) {
    const items = JSON.parse(readFileSync(resolve(__dirname, file), 'utf-8'));
    TOPICS.push(...items.filter(t => t.date === today));
  }
  if (!TOPICS.length) {
    console.log(`Geen blog gepland voor vandaag (${today}). Klaar.`);
    process.exit(0);
  }
} else if (cleanArgs.length === 1 && cleanArgs[0].endsWith('.json')) {
  TOPICS = JSON.parse(readFileSync(resolve(cleanArgs[0]), 'utf-8'));
} else if (cleanArgs.length > 0) {
  TOPICS = cleanArgs.map(t => ({ topic: t, date: null }));
} else {
  console.error('Gebruik: node scripts/publish.mjs --today | "Topic" | plan-*.json');
  process.exit(1);
}

// ─── Brand config ─────────────────────────────────────────────────────────────

const BRAND_TONE = `
Minimaal. Zelfverzekerd. Schoon. Nooit opdringerig. Identity-driven, niet transactioneel.
Als het leest als een supplement-advertentie: herschrijf het.

ZINSBOUW: Kort. Periodiek. Vaak één clausule. Een punt doet meer werk dan een uitroepteken. Vertrouwen is punctuatie.
WOORDTEST: Als je het op een podium zou zeggen — schrap het. Als je het zou zeggen tegen een vriend aan een keukentafel — houd het.

WE ARE: Minimaal · Zelfverzekerd · Speels maar niet flauw · Elite, niet massa · Sensorisch en specifiek.
WE ARE NOT: Opdringerig of schreeuwerig · Wellness-guru cliché · Bro-science energie · Overuitgelegd · Desperate for clicks.

Schrijf in correct, helder Nederlands. Spreek de lezer aan met "je" en "jij".
`.trim();

const BRAND_GUIDELINES = `
- DOELGROEP: Gezondheidsgerichte consumenten, koffieliefhebbers die betere energie zoeken, mensen die stress of slechte slaap willen aanpakken op een natuurlijke manier. Contemporary, youthful, leaning elite.
- DOEL VAN NOONI: "Help others become their best self." Waarden: Kwaliteit & Transparantie.

- SCHRIJFSTIJL (NIET-ONDERHANDELBAAR):
  * FOCUS OP DE TITEL: De inhoud moet 100% aansluiten bij het specifieke onderwerp.
  * EDUCATIEF EERST: Leg altijd uit WAAROM iets werkt — het mechanisme, de werkzame stof — niet alleen dát het werkt.
  * WETENSCHAPPELIJK MAAR TOEGANKELIJK: Gebruik termen als NGF of beta-glucanen, maar leg ze direct simpel uit.
  * SENSORISCH & SPECIFIEK: Beschrijf effecten concreet. Niet "geeft energie" maar "geen crash om 14:00 uur".
  * NUANCEER: Nooit absolute claims. Schrijf "kan ondersteunen", "studies suggereren", "traditioneel gebruikt voor".

- PRODUCTEN (NOEM ALLEEN ALS RELEVANT VOOR DE TITEL):
  * ☕ Mushroom Coffee: Lion's Mane (450mg) + Chaga (300mg) + Tremella (300mg) + Maca (50mg). USP: Energie, focus & breinperformance.
  * 🍵 Mushroom Matcha: Reishi + Lion's Mane + Tremella. USP: Vitaliteit, productiviteit & immuunsysteem.
  * 🍫 Mushroom Cacao: Tremella + Lion's Mane + Reishi. USP: Ontspannen, herstel & slaap.

- KWALITEITSDIFFERENTIATORS:
  * Dubbele extractie: water (beta-glucanen) + alcohol (triterpenen).
  * 100% vruchtlichamen — geen mycelium op graan.
  * Derde partij getest. Gemaakt in Nederland. Non-GMO. Vegan. 4.8/5 Trustpilot.

- ANTI-CLICHÉ (CRUCIAAL):
  * VERBODEN INTRO: Begin NOOIT met "Wist je dat...", "Al eeuwenlang...", "In de wereld van wellness...", of "Als je op zoek bent naar...".
  * VERBODEN TOON: Geen wellness-guru taal, geen bro-science, geen overdreven enthousiasme.
  * DIRECTE FOCUS: Begin de eerste zin DIRECT met het kernonderwerp uit de titel.
`.trim();

const KNOWLEDGE_BASE = `
NOONI KENNISBANK:
- MERK: "Help others become their best self." Geproduceerd in Nederland. 4.8/5 Trustpilot. Marktgebied: NL · BE · DE.
- TECHNOLOGIE: Dubbele extractie (water + alcohol) → beta-glucanen + triterpenen. 100% vruchtlichamen — geen mycelium op graan.

- LION'S MANE: Stimuleert NGF en BDNF. Ondersteunt myelineschede. Voordelen: focus, concentratie, geheugen, vermindering hersenmist.
- REISHI: Krachtig adaptogeen. Ondersteunt slaapkwaliteit via GABA-paden. Beta-glucanen voor immuunmodulatie.
- CHAGA: Hoogste ORAC-antioxidantwaarde. Bevat betulinezuur. "The King of the Forest". Voordelen: immuunsysteem, anti-inflammatoir.
- CORDYCEPS: Verhoogt ATP-productie, verbetert zuurstofopname (VO2max). Energie, uithoudingsvermogen.
- TREMELLA: "De schoonheidspaddenstoel" — hydraterend effect vergelijkbaar met hyaluronzuur. Ondersteunt huidhydratatie en collageen.
`.trim();

const BLOG_FRAMEWORK = `
STRUCTUUR (STRIKT VOLGEN):
1. Titel — pakkend en SEO-geoptimaliseerd. Kort. Specifiek. Geen clickbait.
2. Introductie — 2-3 zinnen. Begin DIRECT met het onderwerp.
3. Body — gebruik ## voor H2, ### voor H3. Koppen zijn KORT (max 5-6 woorden).
4. Alinea's — kort. Max 3-4 zinnen per alinea.
5. Conclusie — sluit concreet af. Call-to-action naar getnooni.com.

VERBODEN:
- Geen "In dit artikel leer je..."
- Geen wellness-guru taal
- Geen bro-science
- Gebruik EM-dash (—) maximaal 1–2 keer per blog.
`.trim();

const BLOG_TOOL = {
  name: 'write_blog',
  description: 'Schrijf een volledig SEO-blog voor Nooni en geef het terug als gestructureerde data.',
  input_schema: {
    type: 'object',
    properties: {
      title:           { type: 'string', description: 'Pakkende, SEO-geoptimaliseerde blogtitel.' },
      introduction:    { type: 'string', description: '2-3 zinnen. Begin direct met het onderwerp. Max 100 woorden.' },
      body:            { type: 'string', description: 'Volledige body in Markdown. Gebruik ## voor H2, ### voor H3.' },
      conclusion:      { type: 'string', description: 'Afsluitende alinea met CTA naar getnooni.com.' },
      metaTitle:       { type: 'string', description: 'SEO meta title. Strikt max 60 tekens.' },
      metaDescription: { type: 'string', description: 'SEO meta description. Strikt max 160 tekens.' },
      urlSlug:         { type: 'string', description: 'URL handle in kebab-case.' },
    },
    required: ['title', 'introduction', 'body', 'conclusion', 'metaTitle', 'metaDescription', 'urlSlug'],
  },
};

// ─── Blog generation ──────────────────────────────────────────────────────────

async function generateBlog(topic) {
  const systemPrompt = `Je bent de vaste senior SEO copywriter voor nooni. Je schrijft blogs die naadloos aansluiten bij het merk.

MERK IDENTITEIT:
${BRAND_TONE}

RICHTLIJNEN:
${BRAND_GUIDELINES}

KENNISBANK:
${KNOWLEDGE_BASE}

BLOG LENGTE — kies automatisch op basis van de titel:
KORT (800–1.000 woorden): titels met "wat is", "verschil", "vs", specifieke vraag.
MIDDEL (1.200–1.500 woorden): titels over werking, voordelen, ervaringen, dosering.
LANG (1.600–2.000 woorden): alleen voor "complete gids", "alles wat je moet weten", pillar-onderwerpen.

BLOG FRAMEWORK:
${BLOG_FRAMEWORK}

Gebruik de write_blog tool om je output te structureren. Schrijf uitsluitend in correct Nederlands.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: systemPrompt,
    tools: [BLOG_TOOL],
    tool_choice: { type: 'any' },
    messages: [{ role: 'user', content: `Schrijf een blog over: "${topic}"` }],
  });

  const toolBlock = response.content?.find(c => c.type === 'tool_use' && c.name === 'write_blog');
  if (!toolBlock?.input) throw new Error('Geen blog tool output ontvangen van Claude.');

  const b = toolBlock.input;
  const clean = v => (v ? String(v).replace(/\*\*/g, '').trim() : '');
  return {
    title:           clean(b.title),
    introduction:    clean(b.introduction),
    body:            clean(b.body),
    conclusion:      clean(b.conclusion),
    metaTitle:       clean(b.metaTitle),
    metaDescription: clean(b.metaDescription),
    urlSlug:         clean(b.urlSlug),
  };
}

// ─── Image generation ─────────────────────────────────────────────────────────

function detectHeroSubject(title) {
  const t = title.toLowerCase();
  if (t.includes('chaga'))                                                                      return 'a dramatic raw chaga mushroom specimen with dark charred exterior and rich amber interior, placed on a minimal white cylindrical pedestal';
  if (t.includes("lion's mane") || t.includes('lions mane') || t.includes('lion mane'))       return "a fresh lion's mane mushroom with cascading white icicle-like tendrils, placed on a minimal white cylindrical pedestal";
  if (t.includes('reishi'))                                                                     return 'a glossy lacquered reishi mushroom with deep reddish-brown cap, placed on a minimal white cylindrical pedestal';
  if (t.includes('tremella'))                                                                   return 'a delicate cloud-like tremella mushroom cluster, pale gold and translucent, placed on a minimal white cylindrical pedestal';
  if (t.includes('cordyceps'))                                                                  return 'dried cordyceps militaris mushrooms with vibrant orange color, placed on a minimal white cylindrical pedestal';
  if (t.includes('koffie') || t.includes('coffee'))                                            return 'a minimal matte black ceramic cup filled with dark mushroom coffee, placed on a white cylindrical pedestal, steam rising';
  if (t.includes('matcha'))                                                                     return 'a traditional ceramic matcha bowl with vibrant green powder and a bamboo whisk, placed on a minimal white pedestal';
  if (t.includes('cacao'))                                                                      return 'raw cacao pods split open with dark nibs, accompanied by dried mushroom pieces, arranged on a minimal white pedestal';
  if (t.includes('slaap') || t.includes('sleep'))                                              return 'dried reishi mushroom slices with calming botanical elements, placed on a minimal white cylindrical pedestal';
  if (t.includes('focus') || t.includes('concentratie') || t.includes('brein'))               return "a lion's mane mushroom specimen with cascading white tendrils, placed on a minimal white cylindrical pedestal";
  if (t.includes('stress') || t.includes('adaptogen'))                                         return 'a collection of adaptogenic mushroom roots and dried reishi slices, arranged on a minimal white cylindrical pedestal';
  if (t.includes('immuun') || t.includes('immune'))                                            return 'chaga and reishi mushroom specimens together, placed on a minimal white cylindrical pedestal';
  if (t.includes('energie') || t.includes('energy'))                                           return 'cordyceps mushrooms with raw coffee beans, arranged on a minimal white cylindrical pedestal';
  return 'dried functional mushroom specimens arranged on a minimal white cylindrical pedestal';
}

async function generateImage(title) {
  const subject = detectHeroSubject(title);
  const prompt = `Hyperrealistic studio product photography composed for a wide 16:9 landscape banner. ${subject}. Warm neutral beige-grey background with a soft gradient. Dramatic directional studio lighting from the right side. Wide cinematic crop, nothing important near the top or bottom edges. Ultra-sharp detail. Premium editorial photography for a Scandinavian wellness brand. CRITICAL: absolutely no text, no letters, no words, no writing, no numbers, no labels anywhere in the image. No people, no hands, no logos, no watermarks.`;

  const response = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    n: 1,
    size: '1536x1024',
    output_format: 'png',
  });

  return response.data[0].b64_json;
}

// ─── Shopify publish ──────────────────────────────────────────────────────────

async function publishBlog(blog, imageB64, scheduleDate = null) {
  const cleanBody = blog.body.replace(/!\[.*?\]\(.*?\)/g, '');
  const bodyHtml  = await marked.parse(cleanBody);
  const fullHtml  = `<p><em>${blog.introduction}</em></p>${bodyHtml}<h2>Conclusie</h2><p>${blog.conclusion}</p>`;

  const article = {
    title:        blog.title,
    body_html:    fullHtml,
    handle:       blog.urlSlug,
    summary_html: blog.metaDescription,
    metafields: [
      { namespace: 'global', key: 'title_tag',       value: blog.metaTitle,       type: 'single_line_text_field' },
      { namespace: 'global', key: 'description_tag', value: blog.metaDescription, type: 'single_line_text_field' },
    ],
    published:    true,
    published_at: scheduleDate ? `${scheduleDate}T09:00:00+02:00` : new Date().toISOString(),
  };

  if (imageB64) {
    article.image = { attachment: imageB64, filename: `${blog.urlSlug}-hero.png` };
  }

  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const res   = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-10/blogs/${BLOG_ID}/articles.json`, {
    method:  'POST',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ article }),
  });

  const data = await res.json();
  if (!data.article?.id) {
    const err = JSON.stringify(data);
    if (err.includes('has already been taken')) {
      console.log(`Al gepubliceerd (handle bestaat al): ${article.handle} — overgeslagen.`);
      return null;
    }
    throw new Error(data.error || err);
  }
  return { url: `https://getnooni.com/blogs/news/${data.article.handle}`, articleId: data.article.id, fullHtml };
}

// ─── Shopify GraphQL helper ───────────────────────────────────────────────────

async function shopifyGraphQL(query, variables = {}) {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const res   = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-10/graphql.json`, {
    method:  'POST',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query, variables }),
  });
  return res.json();
}

// ─── Product metafield ────────────────────────────────────────────────────────

const PRODUCTS = {
  coffee: 'gid://shopify/Product/8907892523351',
  cacao:  'gid://shopify/Product/8907891114327',
  matcha: 'gid://shopify/Product/8907888394583',
};

function detectProduct(title) {
  const t = title.toLowerCase();
  if (t.includes('cacao') || t.includes('slaap') || t.includes('sleep') || t.includes('herstel')) return PRODUCTS.cacao;
  if (t.includes('matcha') || t.includes('reishi') || t.includes('vrouwen') || t.includes('hormoon') || t.includes('immuun')) return PRODUCTS.matcha;
  return PRODUCTS.coffee;
}

async function setProductMetafield(articleId, productGid) {
  const res = await shopifyGraphQL(`
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors { field message }
      }
    }
  `, {
    metafields: [{
      ownerId:   `gid://shopify/Article/${articleId}`,
      namespace: 'custom',
      key:       'featured_blog_post_product',
      type:      'product_reference',
      value:     productGid,
    }],
  });
  const errors = res.data?.metafieldsSet?.userErrors || [];
  if (errors.length) throw new Error(errors.map(e => e.message).join(', '));
}

// ─── Translation ──────────────────────────────────────────────────────────────

function extractTag(text, tag) {
  const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : '';
}

async function translateToEnglish(blog, fullHtml) {
  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    messages: [{
      role:    'user',
      content: `You are translating Dutch wellness blog content to English for Nooni, a Scandinavian functional mushroom brand. Keep the tone minimal, confident, and direct — never sound like a supplement ad.

Translate ALL fields from Dutch to English. For body_html: preserve all HTML tags exactly, only translate the visible text. For handle: create an English SEO-friendly kebab-case URL slug.

Wrap each translated field in XML tags exactly like this:
<title>...</title>
<body_html>...</body_html>
<summary_html>...</summary_html>
<meta_title>...</meta_title>
<meta_description>...</meta_description>
<handle>...</handle>

DUTCH INPUT:
Title: ${blog.title}
Handle: ${blog.urlSlug}
Summary: ${blog.metaDescription}
Meta title: ${blog.metaTitle}
Body HTML:
${fullHtml}`,
    }],
  });

  const text   = response.content?.[0]?.text || '';
  const result = {
    title:            extractTag(text, 'title'),
    body_html:        extractTag(text, 'body_html'),
    summary_html:     extractTag(text, 'summary_html'),
    meta_title:       extractTag(text, 'meta_title'),
    meta_description: extractTag(text, 'meta_description'),
    handle:           extractTag(text, 'handle'),
  };
  if (!result.title) throw new Error('Geen vertaling ontvangen van Claude');
  return result;
}

async function registerEnglishTranslations(articleId, en) {
  const gid = `gid://shopify/Article/${articleId}`;

  const digestRes = await shopifyGraphQL(`{
    translatableResource(resourceId: "${gid}") {
      translatableContent { key digest }
    }
  }`);

  const fields    = digestRes.data?.translatableResource?.translatableContent || [];
  const digestMap = Object.fromEntries(fields.map(f => [f.key, f.digest]));

  const translations = [
    { locale: 'en', key: 'title',            value: en.title,            translatableContentDigest: digestMap.title },
    { locale: 'en', key: 'body_html',         value: en.body_html,        translatableContentDigest: digestMap.body_html },
    { locale: 'en', key: 'summary_html',      value: en.summary_html,     translatableContentDigest: digestMap.summary_html },
    { locale: 'en', key: 'meta_title',        value: en.meta_title,       translatableContentDigest: digestMap.meta_title },
    { locale: 'en', key: 'meta_description',  value: en.meta_description, translatableContentDigest: digestMap.meta_description },
    { locale: 'en', key: 'handle',            value: en.handle,           translatableContentDigest: digestMap.handle },
  ].filter(t => t.translatableContentDigest && t.value);

  const mutRes = await shopifyGraphQL(`
    mutation translationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
      translationsRegister(resourceId: $resourceId, translations: $translations) {
        userErrors { field message }
      }
    }
  `, { resourceId: gid, translations });

  const errors = mutRes.data?.translationsRegister?.userErrors || [];
  if (errors.length) throw new Error(errors.map(e => e.message).join(', '));
}

// ─── Main loop ────────────────────────────────────────────────────────────────

console.log(`\nPubliceren van ${TOPICS.length} blog(s)...\n`);

for (const { topic, date } of TOPICS) {
  console.log(`▶ Genereren: "${topic}"${date ? ` (gepland: ${date})` : ''}`);
  try {
    const blog = await generateBlog(topic);
    console.log(`  Titel: ${blog.title}`);

    console.log(`  Afbeelding genereren...`);
    let imageB64 = null;
    try {
      imageB64 = await generateImage(blog.title);
      console.log(`  Afbeelding klaar.`);
    } catch (imgErr) {
      console.warn(`  ⚠ Afbeelding mislukt (blog wordt zonder gepubliceerd): ${imgErr.message}`);
    }

    console.log(`  Publiceren naar Shopify...`);
    const result = await publishBlog(blog, imageB64, date);
    if (!result) continue;
    const { url, articleId, fullHtml } = result;
    console.log(`  ✓ Gepubliceerd: ${url}`);

    try {
      await setProductMetafield(articleId, detectProduct(blog.title));
      console.log(`  ✓ Product gekoppeld.`);
    } catch (metaErr) {
      console.warn(`  ⚠ Product koppelen mislukt: ${metaErr.message}`);
    }

    console.log(`  Vertalen naar Engels...`);
    try {
      const en = await translateToEnglish(blog, fullHtml);
      await registerEnglishTranslations(articleId, en);
      console.log(`  ✓ Engelse vertaling geregistreerd.\n`);
    } catch (transErr) {
      console.warn(`  ⚠ Vertaling mislukt: ${transErr.message}\n`);
    }
  } catch (err) {
    console.error(`  ✗ Mislukt: ${err.message}\n`);
  }
}
