import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'lib/architectureDiagram.ts');
const source = fs.readFileSync(filePath, 'utf8');

const requiredFragments = [
  'package "Tool surface"',
  'package "Core execution"',
  'package "Data and integrations"',
  'package "Operations and governance"',
  'Tool-wise architecture diagram'
];

const forbiddenFragments = [
  'users --> entry0',
  'package "Core platform"',
  'package "Operations and control"',
  'package "Learning highlights"',
  'Original conceptual architecture for'
];

const missing = requiredFragments.filter((fragment) => !source.includes(fragment));
const forbidden = forbiddenFragments.filter((fragment) => source.includes(fragment));

if (missing.length || forbidden.length) {
  console.error('Architecture diagram verification failed.');
  if (missing.length) {
    console.error('Missing required fragments:', missing.join(', '));
  }
  if (forbidden.length) {
    console.error('Found legacy flowchart fragments:', forbidden.join(', '));
  }
  process.exit(1);
}

console.log('Architecture diagram generator matches the new tool-wise architecture layout.');
