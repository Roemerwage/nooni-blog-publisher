/**
 * One-off script: add English translations to all Dutch articles that don't have one yet.
 * Articles already written in English are skipped.
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
const SHOP = 'getnooni.myshopify.com';
const BLOG_ID = '104268136791';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

function shopifyGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: SHOP, path, headers: { 'X-Shopify-Access-Token': TOKEN } }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.end();
  });
}

function graphql(query, variables = {}) {
  const body = JSON.stringify({ query, variables });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SHOP, path: '/admin/api/2024-10/graphql.json', method: 'POST',
      headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function hasEnglishTranslation(articleId) {
  const res = await graphql(`{
    translatableResource(resourceId: "gid://shopify/Article/${articleId}") {
      translations(locale: "en") { key value }
    }
  }`);
  const translations = res.data?.translatableResource?.translations || [];
  return translations.some(t => t.key === 'title' && t.value);
}

async function getTranslatableDigests(articleId) {
  const res = await graphql(`{
    translatableResource(resourceId: "gid://shopify/Article/${articleId}") {
      translatableContent { key digest }
    }
  }`);
  const fields = res.data?.translatableResource?.translatableContent || [];
  return Object.fromEntries(fields.map(f => [f.key, f.digest]));
}

function extractTag(text, tag) {
  const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : '';
}

async function translateToEnglish(article) {
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `You are translating Dutch wellness blog content to English for Nooni, a Scandinavian functional mushroom brand. Keep the tone minimal, confident, and direct — never sound like a supplement ad.

Translate ALL fields from Dutch to English. For body_html: preserve all HTML tags exactly, only translate visible text. For handle: create an English SEO-friendly kebab-case URL slug.

Wrap each translated field in XML tags exactly like this:
<title>...</title>
<body_html>...</body_html>
<summary_html>...</summary_html>
<meta_title>...</meta_title>
<meta_description>...</meta_description>
<handle>...</handle>

DUTCH INPUT:
Title: ${article.title}
Handle: ${article.handle}
Summary: ${article.summary_html || ''}
Body HTML:
${article.body_html}`
    }]
  });

  const payload = Buffer.from(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': payload.length,
      }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        const r = JSON.parse(d);
        const text = r.content?.[0]?.text || '';
        const result = {
          title:            extractTag(text, 'title'),
          body_html:        extractTag(text, 'body_html'),
          summary_html:     extractTag(text, 'summary_html'),
          meta_title:       extractTag(text, 'meta_title'),
          meta_description: extractTag(text, 'meta_description'),
          handle:           extractTag(text, 'handle'),
        };
        if (!result.title) return reject(new Error('Geen vertaling ontvangen: ' + text.slice(0, 200)));
        resolve(result);
      });
    });
    req.on('error', reject); req.write(payload); req.end();
  });
}

async function registerTranslations(articleId, en, digestMap) {
  const translations = [
    { locale: 'en', key: 'title',           value: en.title,            translatableContentDigest: digestMap.title },
    { locale: 'en', key: 'body_html',        value: en.body_html,        translatableContentDigest: digestMap.body_html },
    { locale: 'en', key: 'summary_html',     value: en.summary_html,     translatableContentDigest: digestMap.summary_html },
    { locale: 'en', key: 'meta_title',       value: en.meta_title,       translatableContentDigest: digestMap.meta_title },
    { locale: 'en', key: 'meta_description', value: en.meta_description, translatableContentDigest: digestMap.meta_description },
    { locale: 'en', key: 'handle',           value: en.handle,           translatableContentDigest: digestMap.handle },
  ].filter(t => t.translatableContentDigest && t.value);

  const res = await graphql(`
    mutation translationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
      translationsRegister(resourceId: $resourceId, translations: $translations) {
        userErrors { field message }
      }
    }
  `, { resourceId: `gid://shopify/Article/${articleId}`, translations });

  const errors = res.data?.translationsRegister?.userErrors || [];
  if (errors.length) throw new Error(errors.map(e => e.message).join(', '));
}

// Detect if an article is already primarily in English
function isEnglish(article) {
  const englishHandles = [
    'coffee-gave-me-energy',
    'how-to-create-a-calming-night-routine',
    '5-simple-ways-to-embrace-wellness',
    'what-are-nootropic-mushrooms',
  ];
  return englishHandles.some(h => article.handle.startsWith(h));
}

// Main
const allArticles = await shopifyGet(`/admin/api/2024-10/blogs/${BLOG_ID}/articles.json?limit=50&fields=id,title,handle,body_html,summary_html`);
const articles = allArticles.articles || [];

console.log(`\n${articles.length} artikelen gevonden. Controleren welke een Engelse vertaling missen...\n`);

for (const article of articles) {
  if (isEnglish(article)) {
    console.log(`⏭  Overgeslagen (al Engels): ${article.title}`);
    continue;
  }

  const alreadyTranslated = await hasEnglishTranslation(article.id);
  if (alreadyTranslated) {
    console.log(`✓  Al vertaald: ${article.title}`);
    continue;
  }

  console.log(`▶  Vertalen: "${article.title}"`);
  try {
    const digestMap = await getTranslatableDigests(article.id);
    const en = await translateToEnglish(article);
    await registerTranslations(article.id, en, digestMap);
    console.log(`   ✓ Engels geregistreerd: "${en.title}"`);
  } catch (err) {
    console.error(`   ✗ Mislukt: ${err.message}`);
  }

  // Small delay to avoid rate limits
  await new Promise(r => setTimeout(r, 500));
}

console.log('\nKlaar.\n');
