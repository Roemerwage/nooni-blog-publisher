/**
 * Creates and sends the weekly Nooni Journal digest campaign in Klaviyo.
 * Runs every Friday via GitHub Actions after the blog is published.
 *
 * Requires: KLAVIYO_API_KEY in environment (GitHub Secret) or .env.local
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local when running locally
try {
  const envPath = resolve(__dirname, '../.env.local');
  const lines   = readFileSync(envPath, 'utf-8').split('\n').filter(l => l.includes('='));
  for (const line of lines) {
    const [k, ...v] = line.split('=');
    if (k && !process.env[k.trim()]) process.env[k.trim()] = v.join('=').trim();
  }
} catch {}

const API_KEY     = process.env.KLAVIYO_API_KEY || process.env.VITE_KLAVIYO_API_KEY;
const TEMPLATE_ID = 'QTJ7QL';   // Nooni Journal — Weekly Digest
const LIST_ID     = 'SUJMyZ';   // MainWebsite

if (!API_KEY) {
  console.error('✗ KLAVIYO_API_KEY niet gevonden.');
  process.exit(1);
}

async function klaviyo(method, path, body = null) {
  const res = await fetch(`https://a.klaviyo.com/api${path}`, {
    method,
    headers: {
      'Authorization':  `Klaviyo-API-Key ${API_KEY}`,
      'Content-Type':   'application/vnd.api+json',
      'revision':       '2024-10-15',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

// Campaign name: "Nooni Journal — Week 24 · 2026"
const now     = new Date();
const weekNum = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
const name    = `Nooni Journal — Week ${weekNum} · ${now.getFullYear()}`;

console.log(`\nKlaviyo digest: ${name}\n`);

// 1. Create campaign
const campaign = await klaviyo('POST', '/campaigns/', {
  data: {
    type: 'campaign',
    attributes: {
      name,
      audiences: { included: [LIST_ID] },
      sendOptions: { useSmartSending: true },
      campaignMessages: {
        data: [{
          type: 'campaign-message',
          attributes: {
            definition: {
              channel: 'email',
              content: {
                subject:     'Three reads for your week.',
                fromEmail:   'hello@getnooni.com',
                fromLabel:   'nooni',
                previewText: 'This week on the nooni journal.',
              },
            },
          },
        }],
      },
    },
  },
});

if (campaign.errors) {
  console.error('✗ Campaign aanmaken mislukt:', JSON.stringify(campaign.errors, null, 2));
  process.exit(1);
}

const campaignId = campaign.data?.id;
const messageId  = campaign.data?.relationships?.campaignMessages?.data?.[0]?.id;

if (!campaignId || !messageId) {
  console.error('✗ Geen campaign/message ID:', JSON.stringify(campaign, null, 2));
  process.exit(1);
}

console.log(`  Campaign: ${campaignId}`);
console.log(`  Message:  ${messageId}`);

// 2. Assign template
const assign = await klaviyo('POST', '/campaign-message-assign-template/', {
  data: {
    type: 'campaign-message-assign-template',
    attributes: {
      templateId:        TEMPLATE_ID,
      campaignMessageId: messageId,
    },
  },
});

if (assign.errors) {
  console.error('✗ Template toewijzen mislukt:', JSON.stringify(assign.errors, null, 2));
  process.exit(1);
}

console.log(`  Template toegewezen: ${TEMPLATE_ID}`);

// 3. Send campaign
const send = await klaviyo('POST', '/campaign-send-jobs/', {
  data: {
    type: 'campaign-send-job',
    relationships: {
      campaign: {
        data: { type: 'campaign', id: campaignId },
      },
    },
  },
});

if (send.errors) {
  console.error('✗ Verzenden mislukt:', JSON.stringify(send.errors, null, 2));
  process.exit(1);
}

console.log(`\n✓ Digest verzonden naar MainWebsite (${LIST_ID})\n`);
