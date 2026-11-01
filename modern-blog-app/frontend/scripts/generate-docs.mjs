#!/usr/bin/env node
/**
 * Generates the "what / why / where / how" guides shown in the knowledge base (/docs).
 * Output goes to data/tool-docs.json (committed to git). No database is used, so nothing counts against the
 * 500 MB Supabase limit.
 *
 * Run from modern-blog-app/frontend (needs GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local):
 *   npm run docs:generate                        every tool without a guide yet (safe to re-run: it resumes)
 *   npm run docs:generate -- --category cloud    one category (the id from data/industry-tools.json)
 *   npm run docs:generate -- --limit 5           at most 5 API calls (4 tools per call)
 *   npm run docs:generate -- --dry-run           show the plan without calling the API
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  process.loadEnvFile(path.join(root, '.env.local'));
} catch {
  // .env.local is optional when the variables are already set.
}

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : fallback;
};

const BATCH_SIZE = 4;
const DELAY_MS = Number(option('delay', 4500));
const LIMIT = Number(option('limit', Infinity));
const ONLY_CATEGORY = option('category', '');
const DRY_RUN = hasFlag('dry-run');
const MODEL = (process.env.AI_MODEL_NAME || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite').replace(/^gemini\//i, '');
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

const catalogPath = path.join(root, 'data', 'industry-tools.json');
const docsPath = path.join(root, 'data', 'tool-docs.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const docs = fs.existsSync(docsPath)
  ? JSON.parse(fs.readFileSync(docsPath, 'utf8'))
  : { generatedAt: null, note: '', tools: {} };
docs.tools = docs.tools || {};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');

const clean = (value, max) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
const list = (value, maxItems, maxLength) =>
  (Array.isArray(value) ? value : []).map((item) => clean(item, maxLength)).filter(Boolean).slice(0, maxItems);

function normalizeGuide(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const guide = {
    what: clean(raw.what, 600),
    why: list(raw.why, 4, 220),
    where: list(raw.where, 4, 220),
    how: list(raw.how, 5, 220),
    alternatives: list(raw.alternatives, 4, 60),
  };
  return guide.what && guide.why.length && guide.where.length && guide.how.length ? guide : null;
}

function buildPrompt(category, tools) {
  const lines = tools
    .map(
      (tool, index) =>
        `${index + 1}. ${tool.name}: ${tool.description || 'no description'} (category: ${category.displayName}; tags: ${(tool.tags || []).join(', ') || 'none'})`
    )
    .join('\n');

  return `You write concise, accurate, evergreen documentation for engineers and technical decision makers.
For EACH tool below return one JSON object. Return ONLY a JSON array, in the same order as the tools.

Object shape:
{"tool": "<exact tool name>", "what": "2-3 sentences: what the tool is", "why": ["3-4 short bullets: why teams choose it"], "where": ["3-4 short bullets: typical environments and use cases"], "how": ["4-5 short imperative steps to get started"], "alternatives": ["2-4 comparable tools"]}

Rules:
- Only state widely known, long-lived facts. No version numbers, prices, dates, statistics or market-share claims.
- If you are not sure what a tool does, keep the text general instead of guessing.
- No URLs, no markdown, no HTML. Plain sentences only.
- Steps must be safe to follow (nothing destructive, no secrets).

Tools:
${lines}`;
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096, responseMimeType: 'application/json' },
        }),
      });

      if (response.status === 429 || response.status >= 500) {
        console.warn(`  HTTP ${response.status}, waiting before retry ${attempt}/4...`);
        await sleep(attempt * 15000);
        continue;
      }
      if (!response.ok) {
        throw new Error(`Gemini HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
      }

      const data = await response.json();
      const text = (data?.candidates?.[0]?.content?.parts || []).map((part) => part.text || '').join('');
      if (text) return text;
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(attempt * 5000);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('Gemini returned no content');
}

function parseGuides(text, tools) {
  const json = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(json);
  const items = Array.isArray(parsed) ? parsed : [];
  const byName = new Map(items.map((item) => [normalize(item?.tool), item]));
  const result = [];
  for (const tool of tools) {
    const guide = normalizeGuide(byName.get(normalize(tool.name)));
    if (guide) result.push([tool.name, guide]);
  }
  return result;
}

function save() {
  docs.generatedAt = new Date().toISOString();
  docs.tools = Object.fromEntries(Object.entries(docs.tools).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(docsPath, `${JSON.stringify(docs, null, 2)}\n`);
}

// Plan: tools without a guide, grouped by category in batches of BATCH_SIZE.
const plan = [];
for (const category of catalog.categories) {
  if (ONLY_CATEGORY && category.id !== ONLY_CATEGORY) continue;
  const missing = category.tools.filter((tool) => !docs.tools[tool.name]);
  for (let index = 0; index < missing.length; index += BATCH_SIZE) {
    plan.push({ category, tools: missing.slice(index, index + BATCH_SIZE) });
  }
}

const toolCount = plan.reduce((sum, batch) => sum + batch.tools.length, 0);
console.log(`Model: ${MODEL} | tools without a guide: ${toolCount} | API calls needed: ${plan.length} | ~${Math.ceil((plan.length * DELAY_MS) / 60000)} min`);

if (ONLY_CATEGORY && !catalog.categories.some((category) => category.id === ONLY_CATEGORY)) {
  console.error(`Unknown category "${ONLY_CATEGORY}". Valid ids: ${catalog.categories.map((category) => category.id).join(', ')}`);
  process.exit(1);
}
if (DRY_RUN || plan.length === 0) {
  console.log(plan.length === 0 ? 'Nothing to do.' : 'Dry run: no API calls made.');
  process.exit(0);
}
if (API_KEY.length < 20 || /xxx|your|placeholder/i.test(API_KEY)) {
  console.error('No real Gemini key found. Set GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) in .env.local first.');
  process.exit(1);
}

let calls = 0;
let saved = 0;
for (const batch of plan) {
  if (calls >= LIMIT) break;
  calls += 1;
  const names = batch.tools.map((tool) => tool.name).join(', ');
  process.stdout.write(`[${calls}/${Math.min(plan.length, LIMIT)}] ${batch.category.displayName}: ${names} ... `);

  try {
    const guides = parseGuides(await callGemini(buildPrompt(batch.category, batch.tools)), batch.tools);
    for (const [name, guide] of guides) docs.tools[name] = guide;
    saved += guides.length;
    save();
    console.log(`${guides.length}/${batch.tools.length} saved`);
  } catch (error) {
    console.log(`failed (${error.message}); will retry on the next run`);
  }

  await sleep(DELAY_MS);
}

console.log(`Done. ${saved} guides saved. Total guides in data/tool-docs.json: ${Object.keys(docs.tools).length}.`);
