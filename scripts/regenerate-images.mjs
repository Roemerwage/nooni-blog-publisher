/**
 * Regenerates hero images for specific articles and updates them in Shopify.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import https from 'https';

const envPath = resolve(decodeURIComponent(new URL('.', import.meta.url).pathname), '../.env.local');
const envVars = readFileSync(envPath, 'utf-8').split('\n').filter(l => l.includes('='));
for (const line of envVars) {
  const [k, ...v] = line.split('=');
  process.env[k.trim()] = v.join('=').trim();
}

const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const BLOG_ID = '104268136791';

const ARTICLES = [
  { id: 673351303511, title: "Focus verbeteren zonder cafeïne: 5 natuurlijke methoden" },
  { id: 673351172439, title: "Mushroom coffee vs koffie: de eerlijke vergelijking" },
  { id: 673351139671, title: "Chaga werking: de krachtigste antioxidant-paddenstoel?" },
  { id: 673246871895, title: "Reishi voor betere slaap: werkt het?" },
  { id: 673246740823, title: "Lion's Mane werking: wat doet het voor je hersenen?" },
];

function detectHeroSubject(title) {
  const t = title.toLowerCase();
  if (t.includes('chaga')) return 'a dramatic raw chaga mushroom specimen with dark charred exterior and rich amber interior, placed on a minimal white cylindrical pedestal';
  if (t.includes("lion's mane") || t.includes('lions mane') || t.includes('lion mane')) return "a fresh lion's mane mushroom with cascading white icicle-like tendrils, placed on a minimal white cylindrical pedestal";
  if (t.includes('reishi')) return 'a glossy lacquered reishi mushroom with deep reddish-brown cap, placed on a minimal white cylindrical pedestal';
  if (t.includes('matcha')) return 'a traditional ceramic matcha bowl with vibrant green powder and a bamboo whisk, placed on a minimal white pedestal';
  if (t.includes('koffie') || t.includes('coffee')) return 'a minimal matte black ceramic cup filled with dark mushroom coffee, placed on a white cylindrical pedestal, steam rising';
  if (t.includes('focus') || t.includes('concentratie') || t.includes('brein')) return "a fresh lion's mane mushroom with cascading white tendrils, placed on a minimal white cylindrical pedestal";
  if (t.includes('slaap') || t.includes('sleep')) return 'dried reishi mushroom slices with calming botanical elements, placed on a minimal white cylindrical pedestal';
  return 'dried functional mushroom specimens arranged on a minimal white cylindrical pedestal';
}

async function generateImage(title) {
  const subject = detectHeroSubject(title);
  const prompt = `Hyperrealistic studio product photography composed for a wide 16:9 landscape banner. ${subject}. Warm neutral beige-grey background with a soft gradient. Dramatic directional studio lighting from the right side. Wide cinematic crop, nothing important near the top or bottom edges. Ultra-sharp detail. Premium editorial photography for a Scandinavian wellness brand. CRITICAL: absolutely no text, no letters, no words, no writing, no numbers, no labels anywhere in the image. No people, no hands, no logos, no watermarks.`;

  const res = await fetch('http://localhost:3000/api/openai-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, size: '1536x1024' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }

  const { b64_json } = await res.json();
  return b64_json;
}

function shopifyPut(path, data) {
  const body = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'getnooni.myshopify.com',
      path,
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

console.log(`\nNieuwe afbeeldingen genereren voor ${ARTICLES.length} artikelen...\n`);

for (const article of ARTICLES) {
  console.log(`▶ "${article.title}"`);
  try {
    console.log(`  Afbeelding genereren...`);
    const b64 = await generateImage(article.title);

    console.log(`  Uploaden naar Shopify...`);
    const result = await shopifyPut(
      `/admin/api/2024-10/blogs/${BLOG_ID}/articles/${article.id}.json`,
      { article: { id: article.id, image: { attachment: b64, filename: `${article.id}-hero.png` } } }
    );

    if (result.article?.image?.src) {
      console.log(`  ✓ Klaar: ${result.article.image.src.split('?')[0]}\n`);
    } else {
      console.log(`  ⚠ Respons: ${JSON.stringify(result).slice(0, 100)}\n`);
    }
  } catch (err) {
    console.error(`  ✗ Mislukt: ${err.message}\n`);
  }

  await new Promise(r => setTimeout(r, 1000));
}

console.log('Klaar.\n');
