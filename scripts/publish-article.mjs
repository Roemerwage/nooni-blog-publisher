/**
 * Usage: node scripts/publish-article.mjs <articleId>
 * Publishes a single Shopify article (sets published: true).
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import https from 'https';

const envPath = resolve(decodeURIComponent(new URL('.', import.meta.url).pathname), '../.env.local');
const envVars = readFileSync(envPath, 'utf-8').split('\n').filter(l => l.includes('='));
for (const line of envVars) { const [k,...v]=line.split('='); process.env[k.trim()]=v.join('=').trim(); }

const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const BLOG_ID = '104268136791';
const articleId = process.argv[2];
if (!articleId) { console.error('Geef een article ID mee'); process.exit(1); }

const body = JSON.stringify({ article: { id: articleId, published: true } });
const req = https.request({
  hostname: 'getnooni.myshopify.com',
  path: `/admin/api/2024-10/blogs/${BLOG_ID}/articles/${articleId}.json`,
  method: 'PUT',
  headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, (res) => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    const r = JSON.parse(d);
    if (r.article?.published_at) {
      console.log(`✓ Gepubliceerd: ${r.article.title} (${r.article.published_at})`);
    } else {
      console.error('✗ Mislukt:', JSON.stringify(r));
      process.exit(1);
    }
  });
});
req.on('error', e => { console.error(e); process.exit(1); });
req.write(body); req.end();
