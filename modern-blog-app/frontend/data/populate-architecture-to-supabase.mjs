#!/usr/bin/env node
/**
 * Sync the tool catalog to Supabase.
 *
 * Reads from tool-architecture-registry.json and upserts every tool into
 * tools_coverage_metadata. This is the production-safe way to update existing
 * rows and insert missing rows without re-running the whole schema script.
 *
 * Usage:
 *   SUPABASE_URL="..." SUPABASE_SERVICE_KEY="..." node populate-architecture-to-supabase.mjs
 *
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_KEY environment variable
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const REGISTRY_FILE = './data/tool-architecture-registry.json';

const FAMILY_TO_CATEGORY = {
  'ai-ml': 'AI/ML',
  'cloud-platform': 'Cloud Platform',
  'infrastructure-as-code': 'Infrastructure as Code',
  'ci-cd-pipeline': 'CI/CD Pipeline',
  'monitoring-observability': 'Monitoring/Observability',
  'security-zero-trust': 'Security/Zero-Trust',
  'devsecops': 'DevSecOps',
  'container-orchestration': 'Container/Orchestration',
  'data-streaming': 'Data Streaming',
  'data-engineering': 'Data Engineering',
  'database': 'Database',
  'service-mesh': 'Service Mesh',
  'networking': 'Networking',
  'identity-access': 'Identity & Access',
  'developer-tools': 'Developer Tools',
  'automation': 'Automation',
  'api-gateway': 'API Gateway',
  'configuration-management': 'Configuration Management',
};

function mapCategoryFromFamily(family) {
  return FAMILY_TO_CATEGORY[family] || 'Developer Tools';
}

function buildArchitectureMetadata(toolName, toolData) {
  const officialDocs = Array.isArray(toolData.officialDocs) ? toolData.officialDocs.filter(Boolean) : [];
  return {
    family: toolData.family || '',
    productSet: Array.isArray(toolData.productSet) ? toolData.productSet : [],
    diagramBlueprint: toolData.diagramBlueprint || { entry: [], core: [], data: [], ops: [] },
    officialDocs: {
      home: officialDocs[0] || '',
      architecture: officialDocs[1] || '',
      documentation: officialDocs[2] || '',
    },
    description: toolData.description || toolData.notes || `${toolName} architecture overview`,
    notes: toolData.notes || '',
  };
}

function buildUpsertPayload(toolName, toolData) {
  const category = mapCategoryFromFamily(toolData.family);
  const docs = Array.isArray(toolData.officialDocs) ? toolData.officialDocs.filter(Boolean) : [];

  return {
    tool_name: toolName,
    category,
    description: toolData.description || toolData.notes || `${toolName} platform`,
    official_url: docs[0] || null,
    documentation_url: docs[1] || null,
    github_url: docs.find((value) => /github\.com|gitlab\.com|bitbucket\.org/i.test(value)) || null,
    priority: 5,
    is_active: true,
    architecture_family: toolData.family || category,
    architecture_metadata: buildArchitectureMetadata(toolName, toolData),
    updated_at: new Date().toISOString(),
  };
}

const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
console.log(`📚 Loaded registry: ${Object.keys(registry.tools || {}).length} tools`);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n📤 Upserting tool catalog into Supabase...\n');

  const rows = Object.entries(registry.tools || {}).map(([toolName, toolData]) => buildUpsertPayload(toolName, toolData));

  const { error } = await supabase
    .from('tools_coverage_metadata')
    .upsert(rows, { onConflict: 'tool_name' });

  if (error) {
    console.error('❌ Upsert failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Upserted ${rows.length} tool rows into tools_coverage_metadata`);
  console.log('Next: run the admin image generation flow to populate diagram_image_path and architecture fields for each tool.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
