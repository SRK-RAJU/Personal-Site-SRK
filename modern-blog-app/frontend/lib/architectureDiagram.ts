const KROKI_RENDER_URL = process.env.KROKI_RENDER_URL || 'https://kroki.io/plantuml/png';
const MAX_LABEL_LENGTH = 80;

type DiagramLearningMode = 'basic' | 'intermediate' | 'advanced' | 'all-levels';

interface ArchitectureDiagramInput {
  toolName: string;
  postTitle?: string;
  category?: string;
  components: string[];
  keyFeatures: string[];
  learningMode?: DiagramLearningMode;
  audience?: string;
  useCase?: string;
}

function cleanLabel(value: string, fallback: string): string {
  const cleaned = (value || fallback)
    .replace(/[\r\n{}]/g, ' ')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_LABEL_LENGTH);

  return cleaned || fallback;
}

function escapePlantUmlText(value: string): string {
  return value.replace(/[\r\n{}]/g, ' ').replace(/"/g, "'").trim();
}

function uniqueLabels(values: string[], fallback: string[]): string[] {
  const labels = values
    .map((value) => cleanLabel(value, 'Module'))
    .filter(Boolean);
  const unique = Array.from(new Set(labels));
  return (unique.length > 0 ? unique : fallback).slice(0, 8);
}

function learningLabel(mode: DiagramLearningMode = 'all-levels'): string {
  if (mode === 'basic') return 'Basics';
  if (mode === 'intermediate') return 'Workflow';
  if (mode === 'advanced') return 'Advanced Operations';
  return 'Basics | Workflow | Advanced Operations';
}

function themeForTool(toolName: string): { background: string; accent: string; panel: string } {
  const palettes = [
    { background: '#F0FDFA', accent: '#0F766E', panel: '#CCFBF1' },
    { background: '#EFF6FF', accent: '#1D4ED8', panel: '#DBEAFE' },
    { background: '#FFF7ED', accent: '#C2410C', panel: '#FFEDD5' },
    { background: '#F7FEE7', accent: '#4D7C0F', panel: '#ECFCCB' },
  ];
  const hash = Array.from(toolName).reduce((total, character) => total + character.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

export function buildArchitecturePlantUml(input: ArchitectureDiagramInput): string {
  const toolName = cleanLabel(input.toolName, 'Technology Platform');
  const title = cleanLabel(input.postTitle || `${toolName} architecture`, `${toolName} architecture`);
  const category = cleanLabel(input.category || 'Technology', 'Technology');
  const audience = cleanLabel(input.audience || 'Engineers and technology learners', 'Engineers and technology learners');
  const useCase = cleanLabel(input.useCase || 'Enterprise deployment and operations', 'Enterprise deployment and operations');
  const components = uniqueLabels(input.components, [
    `${toolName} Core`,
    'Control Plane',
    'Data Plane',
    'Integrations',
    'Observability',
  ]);
  const features = uniqueLabels(input.keyFeatures, [
    'Policy management',
    'Access control',
    'Automation',
    'Monitoring',
  ]);
  const componentIds = components.map((_, index) => `component${index}`);
  const featureIds = features.map((_, index) => `feature${index}`);
  const mode = input.learningMode || 'all-levels';
  const theme = themeForTool(toolName);
  const visibleComponents = mode === 'basic' ? components.slice(0, 4) : components;
  const visibleComponentIds = componentIds.slice(0, visibleComponents.length);
  const visibleFeatureIds = mode === 'basic' ? featureIds.slice(0, 3) : featureIds;

  const lines = [
    '@startuml',
    `title ${escapePlantUmlText(title)}`,
    mode === 'basic' ? 'top to bottom direction' : 'left to right direction',
    `skinparam backgroundColor ${theme.background}`,
    'skinparam shadowing false',
    'skinparam defaultFontName Arial',
    'skinparam defaultFontSize 16',
    `skinparam ArrowColor ${theme.accent}`,
    'skinparam ArrowThickness 2',
    'skinparam componentStyle rectangle',
    'skinparam rectangle {',
    `  BackgroundColor ${theme.background}`,
    `  BorderColor ${theme.accent}`,
    '  FontColor #0F172A',
    '  RoundCorner 12',
    '}',
    'skinparam package {',
    `  BackgroundColor ${theme.panel}`,
    `  BorderColor ${theme.accent}`,
    '  FontColor #0F172A',
    '}',
    `rectangle "Users / Endpoints" as users`,
    `rectangle "Internet / Edge" as edge`,
    'package "Platform Architecture" {',
  ];

  visibleComponentIds.forEach((id, index) => {
    lines.push(`  rectangle "${escapePlantUmlText(visibleComponents[index])}" as ${id}`);
  });

  lines.push('}', 'package "Capability Highlights" {');
  visibleFeatureIds.forEach((id, index) => {
    lines.push(`  rectangle "${escapePlantUmlText(features[index])}" as ${id}`);
  });
  lines.push('}', `rectangle "${mode === 'basic' ? 'Simple Outcome' : 'Monitoring / Governance'}" as governance`);
  lines.push('users --> edge');
  if (visibleComponentIds.length > 0) lines.push(`edge --> ${visibleComponentIds[0]}`);
  for (let index = 0; index < visibleComponentIds.length - 1; index += 1) {
    lines.push(`${visibleComponentIds[index]} --> ${visibleComponentIds[index + 1]}`);
  }
  visibleComponentIds.forEach((id, index) => {
    if (visibleFeatureIds.length > 0) lines.push(`${id} ..> ${visibleFeatureIds[index % visibleFeatureIds.length]}`);
    if (mode !== 'basic') lines.push(`${id} ..> governance`);
  });
  lines.push(
    mode === 'advanced' ? 'governance ..> edge : policy feedback' : 'governance ..> users : feedback',
    `note right of governance\nCategory: ${escapePlantUmlText(category)}\nLearning: ${escapePlantUmlText(learningLabel(mode))}\nAudience: ${escapePlantUmlText(audience)}\nUse case: ${escapePlantUmlText(useCase)}\nend note`,
    '@enduml',
  );

  return lines.join('\n');
}

export async function renderArchitectureDiagram(input: ArchitectureDiagramInput): Promise<{
  imageBuffer: Buffer;
  mimeType: string;
  renderer: string;
  source: string;
}> {
  const source = buildArchitecturePlantUml(input);
  const response = await fetch(KROKI_RENDER_URL, {
    method: 'POST',
    headers: {
      Accept: 'image/png',
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: source,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Kroki rendering failed: ${response.status} ${body.slice(0, 300)}`);
  }

  return {
    imageBuffer: Buffer.from(await response.arrayBuffer()),
    mimeType: 'image/png',
    renderer: 'plantuml-kroki',
    source,
  };
}
