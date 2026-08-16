const fs = require('fs');
const path = require('path');

// Load industry tools
const industryPath = path.join(__dirname, '../data/industry-tools.json');
const industryData = JSON.parse(fs.readFileSync(industryPath, 'utf8'));

// Extract all tools with their category
const tools = [];
for (const category of industryData.categories || []) {
  const categoryName = category.displayName || category.id;
  for (const tool of category.tools || []) {
    tools.push({
      name: tool.name,
      category: categoryName,
      description: tool.description || '',
      url: tool.officialUrl || ''
    });
  }
}

const escape = (str) => str.replace(/'/g, "''");

let sql = `-- Generated UPSERT for ${tools.length} tools from industry catalog\n`;
sql += `-- Auto-generated at: ${new Date().toISOString()}\n\n`;
sql += `INSERT INTO tools_coverage_metadata (\n`;
sql += `  tool_name,\n`;
sql += `  category,\n`;
sql += `  description,\n`;
sql += `  official_url,\n`;
sql += `  documentation_url,\n`;
sql += `  github_url,\n`;
sql += `  priority,\n`;
sql += `  is_active,\n`;
sql += `  architecture_family,\n`;
sql += `  architecture_metadata,\n`;
sql += `  updated_at\n`;
sql += `)\nVALUES\n`;

const sqlLines = [];
for (const tool of tools) {
  const line = `  ('${escape(tool.name)}', '${escape(tool.category)}', '${escape(tool.description)}', '${escape(tool.url)}', NULL, NULL, 5, TRUE, NULL, '{}'::jsonb, NOW())`;
  sqlLines.push(line);
}

sql += sqlLines.join(',\n');
sql += `\nON CONFLICT (tool_name) DO UPDATE\n`;
sql += `SET\n`;
sql += `  category = EXCLUDED.category,\n`;
sql += `  description = EXCLUDED.description,\n`;
sql += `  official_url = EXCLUDED.official_url,\n`;
sql += `  documentation_url = EXCLUDED.documentation_url,\n`;
sql += `  github_url = EXCLUDED.github_url,\n`;
sql += `  priority = EXCLUDED.priority,\n`;
sql += `  is_active = EXCLUDED.is_active,\n`;
sql += `  architecture_family = EXCLUDED.architecture_family,\n`;
sql += `  architecture_metadata = EXCLUDED.architecture_metadata,\n`;
sql += `  updated_at = NOW();\n\n`;
sql += `-- Total rows: ${tools.length}\n`;

fs.writeFileSync(path.join(__dirname, '../../../478-tools-upsert.sql'), sql, 'utf8');
console.log(`Generated ${tools.length} tools UPSERT SQL at: ${path.join(__dirname, '../../../478-tools-upsert.sql')}`);
