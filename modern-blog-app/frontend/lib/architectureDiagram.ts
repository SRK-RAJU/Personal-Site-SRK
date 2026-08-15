const KROKI_RENDER_URL = process.env.KROKI_RENDER_URL || 'https://kroki.io/plantuml/png';
const MAX_LABEL_LENGTH = 80;

type DiagramLearningMode = 'basic' | 'intermediate' | 'advanced' | 'all-levels';

interface ArchitectureDiagramInput {
  toolName: string;
  postTitle?: string;
  category?: string;
  description?: string;
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
    { background: '#FDF2F8', accent: '#C026D3', panel: '#FCE7F3' },
    { background: '#EEF2FF', accent: '#4F46E5', panel: '#E0E7FF' },
  ];
  const hash = Array.from(toolName).reduce((total, character) => total + character.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

function categoryArchitectureProfile(category: string): {
  entry: string[];
  core: string[];
  ops: string[];
  accentTitle: string;
  flowLabel: string;
} {
  const lowered = (category || '').toLowerCase();

  if (lowered.includes('ai') || lowered.includes('ml') || lowered.includes('llm')) {
    return {
      entry: ['Users', 'Applications', 'Data Sources'],
      core: ['Prompt / Input Layer', 'Model Layer', 'Inference Engine', 'Context Store', 'Evaluation Layer', 'Feedback Loop'],
      ops: ['Safety Checks', 'Monitoring', 'Versioning', 'Ops Dashboard'],
      accentTitle: 'AI orchestration architecture',
      flowLabel: 'model and data workflow',
    };
  }

  if (lowered.includes('security') || lowered.includes('zero') || lowered.includes('identity') || lowered.includes('devsecops')) {
    return {
      entry: ['Users', 'Identity Providers', 'Policy Gateways'],
      core: ['Authentication', 'Authorization', 'Session Control', 'Policy Engine', 'Audit Trail', 'Risk Signals'],
      ops: ['Threat Detection', 'Access Logs', 'Compliance Reporting', 'Admin Console'],
      accentTitle: 'Secure access architecture',
      flowLabel: 'identity and access flow',
    };
  }

  if (lowered.includes('cloud') || lowered.includes('infrastructure') || lowered.includes('automation')) {
    return {
      entry: ['Developers', 'Workload Requests', 'Service Mesh'],
      core: ['Compute Layer', 'Network Layer', 'Storage Layer', 'Config Layer', 'Deployment Layer', 'Scaling Layer'],
      ops: ['Cost Insights', 'Observability', 'Auto Recovery', 'Governance'],
      accentTitle: 'Cloud platform architecture',
      flowLabel: 'infrastructure delivery flow',
    };
  }

  if (lowered.includes('container') || lowered.includes('orchestration') || lowered.includes('service mesh')) {
    return {
      entry: ['Developers', 'Git Events', 'Workload Schedules'],
      core: ['Control Plane', 'Worker Nodes', 'Registry', 'Ingress', 'Network Policy', 'Runtime Layer'],
      ops: ['Autoscaling', 'Health Checks', 'Backups', 'Ops Console'],
      accentTitle: 'Container orchestration architecture',
      flowLabel: 'workload lifecycle flow',
    };
  }

  if (lowered.includes('ci') || lowered.includes('cd') || lowered.includes('pipeline') || lowered.includes('devops')) {
    return {
      entry: ['Developers', 'Git Events', 'Change Requests'],
      core: ['Code Repo', 'Build Pipeline', 'Artifact Store', 'Deployment Engine', 'Environment Routing', 'Release Checks'],
      ops: ['Logs', 'Alerts', 'Rollbacks', 'Ops Dashboard'],
      accentTitle: 'Delivery automation architecture',
      flowLabel: 'delivery and release flow',
    };
  }

  if (lowered.includes('monitor') || lowered.includes('observability')) {
    return {
      entry: ['Services', 'Users', 'Platform Events'],
      core: ['Telemetry Collectors', 'Metrics Store', 'Tracing Layer', 'Alert Rules', 'Dashboard Layer', 'Incident Workflow'],
      ops: ['SLO Tracking', 'Health Rules', 'Root Cause Analysis', 'Ops Actions'],
      accentTitle: 'Observability architecture',
      flowLabel: 'telemetry and response flow',
    };
  }

  if (lowered.includes('database') || lowered.includes('data streaming') || lowered.includes('data engineering') || lowered.includes('data')) {
    return {
      entry: ['Apps', 'Analysts', 'Services'],
      core: ['API Layer', 'Query Engine', 'Storage Engine', 'Replication', 'Cache Layer', 'Backup Recovery'],
      ops: ['Performance Metrics', 'Data Security', 'Monitoring', 'Admin Controls'],
      accentTitle: 'Data platform architecture',
      flowLabel: 'data access and reliability flow',
    };
  }

  if (lowered.includes('network') || lowered.includes('gateway') || lowered.includes('proxy')) {
    return {
      entry: ['Clients', 'Edge Traffic', 'Internal Services'],
      core: ['Ingress Layer', 'Load Balancer', 'Service Proxy', 'Routing Policy', 'Security Layer', 'Upstream Services'],
      ops: ['Traffic Metrics', 'Availability Checks', 'Policy Enforcement', 'Runtime Insights'],
      accentTitle: 'Network traffic architecture',
      flowLabel: 'request routing and resilience flow',
    };
  }

  if (lowered.includes('developer') || lowered.includes('editor') || lowered.includes('tool')) {
    return {
      entry: ['Developers', 'Workspace', 'Code Changes'],
      core: ['IDE/CLI', 'Version Control', 'Build Tools', 'Local Runner', 'Collaboration Layer', 'Automation Hooks'],
      ops: ['Debugging', 'Linting', 'Testing', 'Release Workflow'],
      accentTitle: 'Developer workflow architecture',
      flowLabel: 'code-to-delivery flow',
    };
  }

  if (lowered.includes('configuration') || lowered.includes('iac') || lowered.includes('infrastructure as code')) {
    return {
      entry: ['Teams', 'Config Sources', 'Environment Inputs'],
      core: ['Templates', 'State Layer', 'Provisioning Engine', 'Resource Graph', 'Policy Validation', 'Drift Detection'],
      ops: ['Change Tracking', 'Approvals', 'Rollback', 'Compliance'],
      accentTitle: 'Infrastructure as code architecture',
      flowLabel: 'configuration and provisioning flow',
    };
  }

  return {
    entry: ['Users', 'App Layer', 'Platform Access'],
    core: ['Core Services', 'Integration Layer', 'Config Engine', 'Control Plane', 'Data Services', 'User Experience'],
    ops: ['Policies', 'Monitoring', 'Governance', 'Operations'],
    accentTitle: 'Platform architecture',
    flowLabel: 'platform interaction flow',
  };
}

function toolAwareArchitectureHints(toolName: string, category: string): {
  entry: string[];
  core: string[];
  ops: string[];
} {
  const name = (toolName || '').toLowerCase();
  const categoryLower = (category || '').toLowerCase();

  if (name.includes('github') || name.includes('gitlab') || name.includes('bitbucket')) {
    return {
      entry: ['Developers', 'Repo Events', 'Pull Requests'],
      core: ['Repository', 'CI Runners', 'Artifact Registry', 'Review Checks', 'Deployment Jobs', 'Release Pipeline'],
      ops: ['Security Scans', 'Approval Gates', 'Rollback Logic', 'Release Notes'],
    };
  }

  if (name.includes('kubernetes') || name.includes('docker') || name.includes('openshift') || name.includes('helm')) {
    return {
      entry: ['Developers', 'GitOps Events', 'Workload Specs'],
      core: ['Control Plane', 'Scheduler', 'Worker Nodes', 'Ingress', 'Service Mesh', 'Persisted Storage'],
      ops: ['Autoscaling', 'Health Checks', 'Secrets', 'Runtime Alerts'],
    };
  }

  if (name.includes('aws') || name.includes('azure') || name.includes('gcp') || name.includes('cloud') || name.includes('terraform')) {
    return {
      entry: ['Teams', 'Provisioning Requests', 'Config Inputs'],
      core: ['IAM / Access', 'Compute', 'Network', 'Storage', 'Managed Services', 'Monitoring'],
      ops: ['Cost Controls', 'Policy Guardrails', 'Drift Detection', 'Resilience Checks'],
    };
  }

  if (name.includes('postgres') || name.includes('mysql') || name.includes('mongodb') || name.includes('redis') || name.includes('snowflake') || name.includes('bigquery') || name.includes('clickhouse')) {
    return {
      entry: ['Apps', 'Queries', 'ETL Jobs'],
      core: ['Connection Layer', 'Query Engine', 'Data Storage', 'Indexing', 'Replication', 'Cache Layer'],
      ops: ['Backups', 'Monitoring', 'Access Policies', 'Performance Tuning'],
    };
  }

  if (name.includes('datadog') || name.includes('newrelic') || name.includes('grafana') || name.includes('splunk') || name.includes('prometheus') || name.includes('elastic')) {
    return {
      entry: ['Services', 'Logs', 'Metrics'],
      core: ['Telemetry Collectors', 'Metrics Store', 'Trace Pipeline', 'Alert Rules', 'Dashboards', 'Incident Correlation'],
      ops: ['SLO Tracking', 'Root Cause Analysis', 'Pager Routing', 'Ops Automation'],
    };
  }

  if (name.includes('okta') || name.includes('auth0') || name.includes('keycloak') || name.includes('oauth') || name.includes('sso') || name.includes('azure ad')) {
    return {
      entry: ['Users', 'Enterprise Apps', 'External IdPs'],
      core: ['Identity Provider', 'Authentication Flow', 'Authorization Policy', 'Session Layer', 'Audit Log', 'Risk Engine'],
      ops: ['MFA Enforcement', 'Access Reviews', 'Anomaly Detection', 'Governance Reports'],
    };
  }

  if (name.includes('openai') || name.includes('anthropic') || name.includes('cohere') || name.includes('gemini') || name.includes('llm') || name.includes('model') || categoryLower.includes('ai') || categoryLower.includes('ml')) {
    return {
      entry: ['Users', 'Applications', 'Knowledge Sources'],
      core: ['Prompt Layer', 'Model Gateway', 'Inference Runtime', 'Context Retrieval', 'Safety Filters', 'Evaluation Loop'],
      ops: ['Prompt Versioning', 'Latency Metrics', 'Feedback Loop', 'Production Guardrails'],
    };
  }

  if (name.includes('snyk') || name.includes('sonar') || name.includes('checkmarx') || name.includes('veracode') || categoryLower.includes('security') || categoryLower.includes('devsecops')) {
    return {
      entry: ['Developers', 'Code Repos', 'Build Pipelines'],
      core: ['Static Analysis', 'Dependency Scanning', 'Secrets Detection', 'Policy Enforcement', 'Risk Prioritization', 'Remediation Workflow'],
      ops: ['Compliance Reports', 'Guardrail Alerts', 'Fix Tracking', 'Audit History'],
    };
  }

  return {
    entry: ['Users', 'App Layer', 'Service Access'],
    core: ['Core Service', 'Gateway', 'Control Plane', 'Data Layer', 'Automation Hooks', 'Ops Layer'],
    ops: ['Monitoring', 'Policy Checks', 'Alerts', 'Operations'],
  };
}

function buildToolSpecificProfile(toolName: string, category: string, components: string[], features: string[]): {
  entry: string[];
  core: string[];
  ops: string[];
  title: string;
  flowLabel: string;
} {
  const profile = categoryArchitectureProfile(category);
  const toolHints = toolAwareArchitectureHints(toolName, category);
  const hash = Array.from(toolName).reduce((total, character) => total + character.charCodeAt(0), 0);

  const entry = Array.from(new Set([...toolHints.entry, ...profile.entry, ...components.slice(0, 2)]));
  const core = Array.from(new Set([...toolHints.core, ...profile.core, ...components.slice(0, 6)]));
  const ops = Array.from(new Set([...toolHints.ops, ...profile.ops, ...features.slice(0, 4)]));

  const rotatedCore = core.slice(hash % 2 === 0 ? 0 : 1);
  const rotatedOps = ops.slice(hash % 3 === 0 ? 0 : 2);

  return {
    entry: entry.slice(0, 3),
    core: rotatedCore.slice(0, 6),
    ops: rotatedOps.slice(0, 4),
    title: `${toolName} — ${profile.accentTitle}`,
    flowLabel: profile.flowLabel,
  };
}

export function buildArchitecturePlantUml(input: ArchitectureDiagramInput): string {
  const toolName = cleanLabel(input.toolName, 'Technology Platform');
  const title = cleanLabel(input.postTitle || `${toolName} architecture`, `${toolName} architecture`);
  const category = cleanLabel(input.category || 'Technology', 'Technology');
  const description = cleanLabel(input.description || '', '');
  const audience = cleanLabel(input.audience || 'Engineers and technology learners', 'Engineers and technology learners');
  const useCase = cleanLabel(
    input.useCase || description || 'Enterprise deployment and operations',
    'Enterprise deployment and operations',
  );
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
  const mode = input.learningMode || 'all-levels';
  const theme = themeForTool(toolName);
  const profile = buildToolSpecificProfile(toolName, category, components, features);
  const layoutDirection = Array.from(toolName).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 2 === 0 ? 'left to right direction' : 'top to bottom direction';

  const componentIds = profile.core.map((_, index) => `component${index}`);
  const entryIds = profile.entry.map((_, index) => `entry${index}`);
  const opsIds = profile.ops.map((_, index) => `ops${index}`);
  const visibleFeatureIds = features.slice(0, 4).map((_, index) => `feature${index}`);

  const lines = [
    '@startuml',
    `title ${escapePlantUmlText(title)}`,
    layoutDirection,
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
    `rectangle "Users / Teams" as users`,
    'package "Entry and access" {',
  ];

  entryIds.forEach((id, index) => {
    lines.push(`  rectangle "${escapePlantUmlText(profile.entry[index])}" as ${id}`);
  });
  lines.push('}', 'package "Core platform" {');
  componentIds.forEach((id, index) => {
    lines.push(`  rectangle "${escapePlantUmlText(profile.core[index])}" as ${id}`);
  });
  lines.push('}', 'package "Operations and control" {');
  opsIds.forEach((id, index) => {
    lines.push(`  rectangle "${escapePlantUmlText(profile.ops[index])}" as ${id}`);
  });
  lines.push('}', 'package "Learning highlights" {');
  visibleFeatureIds.forEach((id, index) => {
    lines.push(`  rectangle "${escapePlantUmlText(features[index] || 'Operational intelligence')}" as ${id}`);
  });
  lines.push('}', `rectangle "${mode === 'basic' ? 'Basics' : mode === 'intermediate' ? 'Workflow' : 'Advanced Ops'}" as governance`);

  lines.push('users --> entry0');
  entryIds.forEach((id, index) => {
    if (index < entryIds.length - 1) {
      lines.push(`${id} --> ${entryIds[index + 1]}`);
    }
  });

  if (entryIds.length > 0 && componentIds.length > 0) {
    lines.push(`${entryIds[entryIds.length - 1]} --> ${componentIds[0]}`);
  }

  componentIds.forEach((id, index) => {
    if (index < componentIds.length - 1) {
      lines.push(`${id} --> ${componentIds[index + 1]}`);
    }
    if (opsIds.length > 0) {
      lines.push(`${id} ..> ${opsIds[index % opsIds.length]}`);
    }
    if (visibleFeatureIds.length > 0) {
      lines.push(`${id} ..> ${visibleFeatureIds[index % visibleFeatureIds.length]}`);
    }
  });

  if (opsIds.length > 0 && componentIds.length > 0) {
    lines.push(`${opsIds[opsIds.length - 1]} --> governance`);
  }

  if (visibleFeatureIds.length > 0 && opsIds.length > 0) {
    lines.push(`${visibleFeatureIds[0]} ..> ${opsIds[0]} : feedback`);
  }

  lines.push(
    `note right of governance\nOriginal conceptual architecture for ${escapePlantUmlText(toolName)}\nCategory: ${escapePlantUmlText(category)}\nLearning: ${escapePlantUmlText(learningLabel(mode))}\nAudience: ${escapePlantUmlText(audience)}\nUse case: ${escapePlantUmlText(useCase)}\nend note`,
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
