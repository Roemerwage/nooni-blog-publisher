import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { defineConfig, loadEnv } from 'vite';

function getShopifyToken(env: Record<string, string>): string {
  if (env.SHOPIFY_ACCESS_TOKEN) return env.SHOPIFY_ACCESS_TOKEN;
  try {
    const cfgPath = path.join(os.homedir(), 'Library/Preferences/shopify-cli-kit-nodejs/config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    const sessions = JSON.parse(cfg.sessionStore);
    const accounts = sessions['accounts.shopify.com'] || {};
    for (const acct of Object.values(accounts) as any[]) {
      const apps = acct.applications || {};
      for (const [appId, app] of Object.entries(apps) as any[]) {
        if (appId.includes('getnooni') && new Date((app as any).expiresAt) > new Date()) {
          return (app as any).accessToken;
        }
      }
    }
  } catch {}
  throw new Error('Niet ingelogd. Run: cd ~/nooni && node_modules/.bin/shopify theme dev --store getnooni.myshopify.com');
}
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'nooni-api',
        configureServer(server) {
          server.middlewares.use(async (req: any, res: any, next: any) => {

            // --- Shopify OAuth: start ---
            if (req.url === '/auth/shopify' && req.method === 'GET') {
              const shop = env.SHOPIFY_SHOP || 'getnooni.myshopify.com';
              const clientId = env.SHOPIFY_CLIENT_ID || 'd9ab494b5577c7111124256eeb7e7fc0';
              const scopes = 'write_content,read_content';
              const redirectUri = 'http://localhost:3000/auth/callback';
              const state = crypto.randomBytes(16).toString('hex');
              const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
              res.statusCode = 302;
              res.setHeader('Location', authUrl);
              res.end();
              return;
            }

            // --- Shopify OAuth: callback ---
            if (req.url?.startsWith('/auth/callback') && req.method === 'GET') {
              const urlObj = new URL(req.url, 'http://localhost:3000');
              const code = urlObj.searchParams.get('code');
              const shop = urlObj.searchParams.get('shop') || env.SHOPIFY_SHOP || 'getnooni.myshopify.com';
              if (!code) {
                const error = urlObj.searchParams.get('error');
                const errorDesc = urlObj.searchParams.get('error_description');
                res.statusCode = 400;
                res.setHeader('Content-Type', 'text/html');
                res.end(`<html><body style="font-family:monospace;padding:40px;background:#0f172a;color:#fff">
                  <h2 style="color:#f87171">OAuth fout — geen code ontvangen</h2>
                  <p><b>error:</b> ${error || '(geen)'}</p>
                  <p><b>error_description:</b> ${errorDesc || '(geen)'}</p>
                  <p><b>Volledige URL:</b> ${req.url}</p>
                  <p style="color:#94a3b8;margin-top:2em">Stuur dit naar Claude.</p>
                </body></html>`);
                return;
              }
              try {
                const { default: https } = await import('https');
                const tokenRes = await new Promise<any>((resolve, reject) => {
                  const body = JSON.stringify({
                    client_id: env.SHOPIFY_CLIENT_ID || 'd9ab494b5577c7111124256eeb7e7fc0',
                    client_secret: env.SHOPIFY_CLIENT_SECRET,
                    code,
                  });
                  const req2 = https.request({
                    hostname: shop,
                    path: '/admin/oauth/access_token',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
                  }, (r) => {
                    let d = '';
                    r.on('data', c => d += c);
                    r.on('end', () => resolve(JSON.parse(d)));
                  });
                  req2.on('error', reject);
                  req2.write(body);
                  req2.end();
                });

                if (!tokenRes.access_token) throw new Error(JSON.stringify(tokenRes));

                // Save token to .env.local
                const envPath = path.resolve(__dirname, '.env.local');
                let envContent = fs.readFileSync(envPath, 'utf-8');
                if (envContent.includes('SHOPIFY_ACCESS_TOKEN=')) {
                  envContent = envContent.replace(/SHOPIFY_ACCESS_TOKEN=.*/g, `SHOPIFY_ACCESS_TOKEN=${tokenRes.access_token}`);
                } else {
                  envContent += `\nSHOPIFY_ACCESS_TOKEN=${tokenRes.access_token}`;
                }
                fs.writeFileSync(envPath, envContent);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.end(`<html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:#fff">
                  <h2 style="color:#4ade80">✓ Shopify verbonden!</h2>
                  <p>Access token opgeslagen. Je kunt dit venster sluiten.</p>
                  <script>setTimeout(()=>window.close(),2000)</script>
                </body></html>`);
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/html');
                res.end(`<html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:#fff">
                  <h2 style="color:#f87171">✗ Fout</h2><pre style="color:#fca5a5">${err.message}</pre>
                </body></html>`);
              }
              return;
            }

            // --- Shopify: publish blog ---
            if (req.url === '/api/shopify-publish' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const token = getShopifyToken(env);
                  const shop = env.SHOPIFY_SHOP || 'getnooni.myshopify.com';
                  const article = JSON.parse(body);

                  const { default: https } = await import('https');

                  const shopifyGet = (p: string) => new Promise<any>((resolve, reject) => {
                    const r = https.request({ hostname: shop, path: p, headers: { 'X-Shopify-Access-Token': token } }, (res2) => {
                      let d = ''; res2.on('data', c => d += c); res2.on('end', () => resolve(JSON.parse(d)));
                    }); r.on('error', reject); r.end();
                  });

                  const shopifyPost = (p: string, data: any) => new Promise<any>((resolve, reject) => {
                    const payload = JSON.stringify(data);
                    const r = https.request({ hostname: shop, path: p, method: 'POST', headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, (res2) => {
                      let d = ''; res2.on('data', c => d += c); res2.on('end', () => resolve(JSON.parse(d)));
                    }); r.on('error', reject); r.write(payload); r.end();
                  });

                  // Get or create blog
                  let blogsData = await shopifyGet('/admin/api/2024-10/blogs.json');
                  let blogId = blogsData.blogs?.[0]?.id;
                  if (!blogId) {
                    const newBlog = await shopifyPost('/admin/api/2024-10/blogs.json', { blog: { title: 'Blog' } });
                    blogId = newBlog.blog?.id;
                  }
                  if (!blogId) throw new Error('Kon geen blog aanmaken');

                  const payload = JSON.stringify({ article });

                  const result = await new Promise<any>((resolve, reject) => {
                    const r2 = https.request({
                      hostname: shop,
                      path: `/admin/api/2024-10/blogs/${blogId}/articles.json`,
                      method: 'POST',
                      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
                    }, (res3) => { let d = ''; res3.on('data', c => d += c); res3.on('end', () => resolve(JSON.parse(d))); });
                    r2.on('error', reject); r2.write(payload); r2.end();
                  });

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            // --- Memory: GET ---
            if (req.url === '/api/memory' && req.method === 'GET') {
              const memoryPath = path.resolve(__dirname, 'memory.json');
              const data = fs.readFileSync(memoryPath, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
              return;
            }

            // --- Memory: POST ---
            if (req.url === '/api/memorize' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const newBlog = JSON.parse(body);
                  const memoryPath = path.resolve(__dirname, 'memory.json');
                  const data = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
                  const exists = data.blogs.some((b: any) => b.title === newBlog.title);
                  if (!exists) {
                    data.blogs.push({ ...newBlog, date: new Date().toISOString() });
                    fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
                  }
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (err) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: String(err) }));
                }
              });
              return;
            }

            // --- Toggle posted ---
            if (req.url === '/api/toggle-posted' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const { title } = JSON.parse(body);
                  const memoryPath = path.resolve(__dirname, 'memory.json');
                  const data = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
                  const blog = data.blogs.find((b: any) => b.title === title);
                  if (blog) blog.posted = !blog.posted;
                  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, posted: blog?.posted ?? false }));
                } catch (err) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: String(err) }));
                }
              });
              return;
            }

            // --- OpenAI image generation proxy ---
            if (req.url === '/api/openai-image' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const { prompt, size = '1024x1024' } = JSON.parse(body);
                  const { default: OpenAI } = await import('openai');
                  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
                  const response = await client.images.generate({
                    model: 'gpt-image-1',
                    prompt,
                    n: 1,
                    size: size as any,
                    output_format: 'png',
                  });
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ b64_json: response.data[0].b64_json }));
                } catch (err: any) {
                  const status = err?.status || 500;
                  res.statusCode = status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err?.message || String(err) }));
                }
              });
              return;
            }

            // --- Claude proxy ---
            if (req.url === '/api/claude' && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const payload = JSON.parse(body);
                  const { default: Anthropic } = await import('@anthropic-ai/sdk');
                  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
                  const response = await client.messages.create(payload);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(response));
                } catch (err: any) {
                  const status = err?.status || 500;
                  res.statusCode = status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err?.message || String(err) }));
                }
              });
              return;
            }

            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
