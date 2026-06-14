require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SOURCES = [
  {
    name: 'jidouteate',
    label: 'Child Allowance',
    url: 'https://www.cfa.go.jp/policies/child-family/jidouteate/',
  },
  {
    name: 'shussan',
    label: 'Childbirth Lump Sum',
    url: 'https://www.mhlw.go.jp/bunya/iryouhoken/iryouhoken13/index.html',
  },
  {
    name: 'ikukyu',
    label: 'Childcare Leave Benefit',
    url: 'https://www.hellowork.mhlw.go.jp/insurance/insurance_continue.html',
  },
];

async function scrapeSubsidy(source) {
  console.log('Fetching: ' + source.label);
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [
      {
        role: 'user',
        content: 'Search this URL and return ONLY a JSON object (no explanation, no markdown): ' + source.url + '\n\nReturn this exact format:\n{"name":"制度名in Japanese","category":"国の制度","amount":"支給額","target":"対象者","description":"概要100字以内","url":"' + source.url + '"}',
      },
    ],
  });

  const text = response.content
    .filter(function(b) { return b.type === 'text'; })
    .map(function(b) { return b.text; })
    .join('');

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found for: ' + source.label);
  return JSON.parse(match[0]);
}

async function main() {
  const results = [];
  for (let i = 0; i < SOURCES.length; i++) {
    const source = SOURCES[i];
    try {
      const data = await scrapeSubsidy(source);
      results.push(data);
      console.log('OK: ' + (data.name || source.label));
    } catch (e) {
      console.error('ERROR ' + source.label + ': ' + e.message);
    }
  }

  const outPath = path.join(__dirname, '../public/subsidies-static.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved: ' + outPath);
  console.log('Total: ' + results.length);
}

main();