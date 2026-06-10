/**
 * Generates next month's Mon/Wed/Fri blog plan using Claude, then commits + pushes it.
 * Usage: node scripts/generate-plan.mjs
 * Called automatically by GitHub Actions on the 20th of each month.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envPath = resolve(__dirname, '../.env.local');
  const lines = readFileSync(envPath, 'utf-8').split('\n').filter(l => l.includes('='));
  for (const line of lines) {
    const [k, ...v] = line.split('=');
    if (k && !process.env[k.trim()]) process.env[k.trim()] = v.join('=').trim();
  }
} catch {}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getNextMonthDates() {
  const now = new Date();
  const year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const month = (now.getMonth() + 1) % 12; // 0-indexed

  const dates = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    const dow = d.getDay(); // 0=Sun, 1=Mon, 3=Wed, 5=Fri
    if (dow === 1 || dow === 3 || dow === 5) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    d.setDate(d.getDate() + 1);
  }
  return { dates, year, month };
}

function monthSlug(year, month) {
  const names = ['january','february','march','april','may','june',
                 'july','august','september','october','november','december'];
  return names[month];
}

// ─── Load past topics to avoid duplicates ─────────────────────────────────────

function loadPastTopics() {
  const planFiles = readdirSync(__dirname).filter(f => f.startsWith('plan-') && f.endsWith('.json'));
  const topics = [];
  for (const file of planFiles) {
    try {
      const items = JSON.parse(readFileSync(resolve(__dirname, file), 'utf-8'));
      topics.push(...items.map(i => i.topic));
    } catch {}
  }
  return topics;
}

// ─── Generate topics via Claude ───────────────────────────────────────────────

async function generateTopics(count, pastTopics) {
  const pastList = pastTopics.map(t => `- ${t}`).join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Je schrijft blogonderwerpen voor Nooni, een Nederlands merk dat functionele paddenstoelen verkoopt (getnooni.com).

Producten: Mushroom Coffee, Matcha, Cacao, Capsules
Paddenstoelen: Lion's Mane, Reishi, Chaga, Cordyceps, Tremella
USPs: dubbele extractie, 100% vruchtlichamen, derde-partij getest, gemaakt in NL
Toon: eerlijk, wetenschappelijk onderbouwd, geen fluff

Genereer precies ${count} unieke Nederlandstalige blogonderwerpen. Vermijd deze al gebruikte onderwerpen:
${pastList}

Geef alleen een JSON-array terug, zonder uitleg, codeblok of markdown. Exact dit formaat:
["onderwerp 1", "onderwerp 2", ...]`
    }]
  });

  const raw = message.content[0].text.trim();
  return JSON.parse(raw);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const { dates, year, month } = getNextMonthDates();
const slug = monthSlug(year, month);
const outFile = resolve(__dirname, `plan-${slug}.json`);

if (existsSync(outFile)) {
  console.log(`Plan already exists: plan-${slug}.json — skipping.`);
  process.exit(0);
}

console.log(`Generating plan for ${slug} ${year}: ${dates.length} dates`);

const pastTopics = loadPastTopics();
const topics = await generateTopics(dates.length, pastTopics);

if (topics.length !== dates.length) {
  console.error(`Expected ${dates.length} topics, got ${topics.length}`);
  process.exit(1);
}

const plan = dates.map((date, i) => ({ topic: topics[i], date }));
writeFileSync(outFile, JSON.stringify(plan, null, 2) + '\n', 'utf-8');
console.log(`Written: scripts/plan-${slug}.json`);

// ─── Git commit + push ────────────────────────────────────────────────────────

execSync(`git config user.email "actions@github.com"`, { stdio: 'inherit' });
execSync(`git config user.name "GitHub Actions"`, { stdio: 'inherit' });
execSync(`git add scripts/plan-${slug}.json`, { stdio: 'inherit' });
execSync(`git commit -m "chore: add blog plan for ${slug} ${year}"`, { stdio: 'inherit' });
execSync(`git push`, { stdio: 'inherit' });
console.log('Pushed to repo.');
