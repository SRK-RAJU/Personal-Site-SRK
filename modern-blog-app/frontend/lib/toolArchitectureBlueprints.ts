export interface ToolArchitectureBlueprint {
  title: string;
  entry: string[];
  core: string[];
  data: string[];
  ops: string[];
}

const normalize = (value: string): string =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const TOOL_FAMILY_BLUEPRINTS: Record<string, ToolArchitectureBlueprint> = {
  default: {
    title: 'Platform architecture',
    entry: ['Users', 'Applications', 'Workflow Entry'],
    core: ['Core Service', 'Domain Logic', 'Control Plane', 'Execution Layer'],
    data: ['Integrations', 'Data Storage', 'Config Layer', 'Event Stream'],
    ops: ['Security', 'Monitoring', 'Recovery', 'Governance'],
  },
  'ai/ml': {
    title: 'AI / ML architecture',
    entry: ['Developers', 'Applications', 'Inference Inputs'],
    core: ['Prompt Layer', 'Model Gateway', 'Inference Runtime', 'Retrieval Layer', 'Agent Layer', 'Evaluation Layer'],
    data: ['Vector Store', 'Knowledge Base', 'Feature Store', 'Model Registry', 'Embedding Cache', 'Conversation State'],
    ops: ['Safety Filters', 'Observability', 'Feedback Loop', 'Model Governance', 'Prompt Versioning', 'Usage Controls'],
  },
  cloud: {
    title: 'Cloud platform architecture',
    entry: ['Users', 'API Requests', 'Deployment Events', 'Control Plane Requests'],
    core: ['Identity & Access', 'Compute Layer', 'Networking', 'Runtime Services', 'Regions', 'Autoscaling'],
    data: ['Storage', 'Databases', 'Caching', 'Queues', 'Object Buckets', 'Secrets'],
    ops: ['Monitoring', 'Security Policies', 'Scaling', 'Cost Controls', 'Resilience', 'Governance'],
  },
  'infrastructure as code': {
    title: 'Infrastructure as code architecture',
    entry: ['Developers', 'Git Repo', 'Config Inputs', 'Environment Specs'],
    core: ['IaC Templates', 'State Layer', 'Provisioning Engine', 'Resource Graph', 'Policy Engine', 'Change Planner'],
    data: ['Secrets Store', 'Environment Config', 'Policy Rules', 'Change History', 'Drift Snapshot', 'Approval Logs'],
    ops: ['Validation', 'Drift Detection', 'Rollback', 'Compliance Checks', 'Audits', 'Automation'],
  },
  'ci/cd': {
    title: 'CI/CD architecture',
    entry: ['Developers', 'Git Events', 'Change Requests', 'Merge Triggers'],
    core: ['Source Control', 'Build Pipeline', 'Test Stage', 'Artifact Store', 'Deployment Engine', 'Release Workflow'],
    data: ['Release Metadata', 'Environment Config', 'Deploy Target', 'Approval Gates', 'Build Cache', 'Release Notes'],
    ops: ['Release Checks', 'Rollback Logic', 'Monitoring', 'Audit Trail', 'Canary Deploy', 'Incident Recovery'],
  },
  'monitoring/observability': {
    title: 'Observability architecture',
    entry: ['Services', 'Users', 'Platform Events', 'Telemetry Sources'],
    core: ['Collectors', 'Metrics Pipeline', 'Tracing Layer', 'Alert Engine', 'Log Aggregation', 'Analysis Rules'],
    data: ['Logs Store', 'Metrics DB', 'Trace Backend', 'Dashboards', 'SLO Store', 'Incident Timeline'],
    ops: ['SLO Tracking', 'Incident Response', 'Root Cause Analysis', 'Ops Automation', 'Alert Routing', 'Health Checks'],
  },
  'security/zero-trust': {
    title: 'Zero-trust security architecture',
    entry: ['Users', 'Devices', 'Workloads', 'Applications'],
    core: ['Identity Provider', 'Policy Engine', 'Access Gateway', 'Risk Engine', 'Session Broker', 'Trust Engine'],
    data: ['Session Logs', 'Audit Trail', 'Secrets Vault', 'Threat Intel', 'Device Registry', 'Policy State'],
    ops: ['MFA', 'Conditional Access', 'Threat Detection', 'Compliance Reporting', 'Access Reviews', 'Incident Response'],
  },
  'container/orchestration': {
    title: 'Container orchestration architecture',
    entry: ['Developers', 'GitOps Events', 'Container Registry', 'Workload Specs'],
    core: ['Control Plane', 'Scheduler', 'Worker Nodes', 'Ingress Layer', 'Service Mesh', 'Runtime Agents'],
    data: ['Image Registry', 'Secrets Store', 'Persistent Storage', 'Service Mesh', 'Config Map', 'Volume Layer'],
    ops: ['Autoscaling', 'Health Checks', 'Rollbacks', 'Runtime Monitoring', 'Load Balancing', 'Resource Tuning'],
  },
  database: {
    title: 'Database architecture',
    entry: ['Applications', 'Jobs', 'Analysts', 'API Clients'],
    core: ['Connection Layer', 'Query Engine', 'Storage Engine', 'Index Layer', 'Transaction Manager', 'Schema Layer'],
    data: ['Replication', 'Cache Layer', 'Backups', 'Data Warehouse', 'Read Replicas', 'Data Mart'],
    ops: ['Access Control', 'Monitoring', 'Recovery', 'Performance Tuning', 'Integrity Checks', 'Backup Policy'],
  },
  'data streaming': {
    title: 'Streaming data architecture',
    entry: ['Producers', 'Events', 'Sensors', 'Change Streams'],
    core: ['Ingress Layer', 'Broker', 'Stream Processor', 'Consumer Groups', 'Partitions', 'Schema Validation'],
    data: ['Event Store', 'Retention', 'Schema Registry', 'Replay Queue', 'Message Topics', 'Offsets'],
    ops: ['Delivery Checks', 'Replay', 'Backpressure', 'Monitoring', 'Dead Letter Queue', 'Latency Tracking'],
  },
  'data engineering': {
    title: 'Data engineering architecture',
    entry: ['Sources', 'ETL Jobs', 'Analysts', 'External Feeds'],
    core: ['Ingestion', 'Transformation', 'Validation', 'Scheduling', 'Workflow Orchestration', 'Quality Rules'],
    data: ['Raw Storage', 'Curated Data', 'Warehouse', 'Pipelines', 'Lakehouse', 'Data Catalog'],
    ops: ['Quality Checks', 'Lineage', 'Monitoring', 'Retry Logic', 'SLA Tracking', 'Data Governance'],
  },
  networking: {
    title: 'Networking architecture',
    entry: ['Clients', 'Edge Traffic', 'Internal Services', 'Gateway Traffic'],
    core: ['Ingress', 'Load Balancer', 'Routing Layer', 'Policy Engine', 'Proxy Layer', 'Service Discovery'],
    data: ['DNS', 'Service Discovery', 'Traffic Logs', 'Telemetry', 'Certificate Store', 'Topology State'],
    ops: ['Availability', 'TLS', 'Latency Tracking', 'Failover', 'Rules Enforcement', 'Performance Tuning'],
  },
  'identity & access': {
    title: 'Identity and access architecture',
    entry: ['Users', 'Applications', 'External IdPs', 'Directories'],
    core: ['Identity Provider', 'Auth Flow', 'Session Layer', 'Policy Engine', 'Token Service', 'Directory Sync'],
    data: ['User Directory', 'Consent', 'Audit Logs', 'Risk Signals', 'Group Policies', 'Access Tokens'],
    ops: ['MFA', 'Access Reviews', 'Token Revocation', 'Compliance', 'Risk Detection', 'Revocation'],
  },
  'devsecops': {
    title: 'DevSecOps architecture',
    entry: ['Developers', 'Code Repos', 'Pipelines', 'Artifacts'],
    core: ['Static Analysis', 'Dependency Scan', 'Secrets Detection', 'Policy Controls', 'Risk Prioritization', 'Remediation Workflow'],
    data: ['Findings DB', 'Remediation Queue', 'SBOM', 'Compliance Reports', 'Vulnerability DB', 'Change Timeline'],
    ops: ['Guardrails', 'Vulnerability Fixing', 'Alerts', 'Audit Trails', 'Approval Gates', 'Runtime Checks'],
  },
  'developer tools': {
    title: 'Developer workflow architecture',
    entry: ['Developers', 'Workspace', 'Repositories', 'IDE Sessions'],
    core: ['Editor / IDE', 'Version Control', 'Build Tools', 'Testing Layer', 'Package Manager', 'Task Runner'],
    data: ['Config Files', 'Artifacts', 'Docs', 'Local Cache', 'Dependency Graph', 'Generated Output'],
    ops: ['Linting', 'Debugging', 'Release Steps', 'Developer Productivity', 'Code Review', 'Automation'],
  },
  automation: {
    title: 'Automation architecture',
    entry: ['Operators', 'Event Sources', 'Triggers', 'Workflow Inputs'],
    core: ['Automation Engine', 'Workflow Orchestrator', 'Task Runner', 'Decision Logic', 'Execution Queue', 'State Machine'],
    data: ['Configs', 'Logs', 'State Store', 'Notifications', 'Run History', 'Task Metadata'],
    ops: ['Retries', 'Monitoring', 'Scheduling', 'Approval Gates', 'Recovery Logic', 'Runbook Automation'],
  },
  analytics: {
    title: 'Analytics architecture',
    entry: ['Users', 'Events', 'Sources', 'Dashboards'],
    core: ['Event Collector', 'Aggregation Layer', 'Query Engine', 'Model Layer', 'Visualization Layer', 'Reporting Layer'],
    data: ['Raw Event Log', 'Warehouse', 'Metric Store', 'Data Marts', 'Semantic Layer', 'BI Cache'],
    ops: ['Governance', 'Quality Checks', 'Alerting', 'Retention Policy', 'Sync Jobs', 'Access Controls'],
  },
  crm: {
    title: 'CRM architecture',
    entry: ['Sales Teams', 'Customers', 'Support Tickets', 'Campaign Data'],
    core: ['Lead Engine', 'Contact Layer', 'Pipeline Manager', 'Workflow Automation', 'Customer Records', 'Engagement Layer'],
    data: ['Customer DB', 'Deal History', 'Interactions', 'Campaign Logs', 'Tasks', 'Notes'],
    ops: ['Segmentation', 'Lifecycle Rules', 'Activity Tracking', 'Retention', 'Compliance', 'Support Routing'],
  },
  support: {
    title: 'Support workflow architecture',
    entry: ['Customers', 'Agents', 'Tickets', 'Requests'],
    core: ['Ticket Intake', 'Routing Engine', 'Knowledge Base', 'Priority Logic', 'Case Manager', 'Response Layer'],
    data: ['Ticket Store', 'Customer Profile', 'Conversation History', 'Issue Logs', 'Escalations', 'Resolution Notes'],
    ops: ['SLAs', 'Escalations', 'Automation', 'Monitoring', 'Quality Checks', 'Feedback Loop'],
  },
  marketing: {
    title: 'Marketing platform architecture',
    entry: ['Campaigns', 'Audience', 'Channels', 'Leads'],
    core: ['Campaign Engine', 'Audience Segmentation', 'Content Layer', 'Automation Layer', 'Attribution Logic', 'Personalization'],
    data: ['Lead DB', 'Campaign Metrics', 'Audience Profiles', 'Event Streams', 'Attribution Data', 'Landing Pages'],
    ops: ['Conversion Tracking', 'Experimentation', 'Delivery Rules', 'Budget Controls', 'Performance Reporting', 'Lifecycle Automation'],
  },
  ecommerce: {
    title: 'E-commerce architecture',
    entry: ['Customers', 'Catalog', 'Cart', 'Checkout'],
    core: ['Catalog Service', 'Cart Engine', 'Checkout Layer', 'Order Service', 'Payment Gateway', 'Pricing Rules'],
    data: ['Product DB', 'Inventory', 'Orders', 'Customer Profiles', 'Discounts', 'Payments'],
    ops: ['Fulfillment', 'Shipping Rules', 'Returns', 'Monitoring', 'Tax Logic', 'Fraud Checks'],
  },
  productivity: {
    title: 'Productivity workflow architecture',
    entry: ['Users', 'Tasks', 'Workflows', 'Teams'],
    core: ['Workspace Layer', 'Task Engine', 'Collaboration Layer', 'Project Planner', 'Notifications', 'Search'],
    data: ['Documents', 'Calendar', 'Tasks', 'Projects', 'History', 'Shared State'],
    ops: ['Permissions', 'Sync', 'Notifications', 'Automation', 'Access Controls', 'Audit Trail'],
  },
  design: {
    title: 'Design workflow architecture',
    entry: ['Designers', 'Assets', 'Research', 'Ideas'],
    core: ['Design System', 'Canvas Layer', 'Component Library', 'Collaboration Tools', 'Asset Manager', 'Review Flow'],
    data: ['Design Tokens', 'Assets', 'Variants', 'Brand Rules', 'Annotations', 'Library Versions'],
    ops: ['Review', 'Feedback', 'Versioning', 'Approval', 'Publishing', 'Governance'],
  },
};

const TOOL_NAME_OVERRIDES: Record<string, string> = {
  openai: 'ai/ml',
  anthropic: 'ai/ml',
  gemini: 'ai/ml',
  claude: 'ai/ml',
  chatgpt: 'ai/ml',
  huggingface: 'ai/ml',
  pytorch: 'ai/ml',
  tensorflow: 'ai/ml',
  langchain: 'ai/ml',
  llamaindex: 'ai/ml',
  qdrant: 'ai/ml',
  weaviate: 'ai/ml',
  pinecone: 'ai/ml',
  github: 'developer tools',
  gitlab: 'developer tools',
  bitbucket: 'developer tools',
  vscode: 'developer tools',
  cursor: 'developer tools',
  jetbrains: 'developer tools',
  aws: 'cloud',
  azure: 'cloud',
  gcp: 'cloud',
  googlecloud: 'cloud',
  cloudflare: 'cloud',
  vercel: 'cloud',
  netlify: 'cloud',
  render: 'cloud',
  railway: 'cloud',
  kubernetes: 'container/orchestration',
  docker: 'container/orchestration',
  helm: 'container/orchestration',
  k8s: 'container/orchestration',
  openshift: 'container/orchestration',
  rancher: 'container/orchestration',
  postgres: 'database',
  mysql: 'database',
  mongodb: 'database',
  redis: 'database',
  elasticsearch: 'database',
  sqlite: 'database',
  snowflake: 'database',
  bigquery: 'database',
  clickhouse: 'database',
  kafka: 'data streaming',
  rabbitmq: 'data streaming',
  nats: 'data streaming',
  pulsar: 'data streaming',
  pubsub: 'data streaming',
  airflow: 'data engineering',
  dbt: 'data engineering',
  spark: 'data engineering',
  databricks: 'data engineering',
  prefect: 'data engineering',
  prometheus: 'monitoring/observability',
  grafana: 'monitoring/observability',
  datadog: 'monitoring/observability',
  newrelic: 'monitoring/observability',
  splunk: 'monitoring/observability',
  elastic: 'monitoring/observability',
  okta: 'security/zero-trust',
  zscaler: 'security/zero-trust',
  pingidentity: 'security/zero-trust',
  auth0: 'identity & access',
  keycloak: 'identity & access',
  oauth: 'identity & access',
  clerk: 'identity & access',
  suse: 'security/zero-trust',
  terraform: 'infrastructure as code',
  pulumi: 'infrastructure as code',
  ansible: 'infrastructure as code',
  cloudformation: 'infrastructure as code',
  githubactions: 'ci/cd',
  jenkins: 'ci/cd',
  gitlabci: 'ci/cd',
  argocd: 'ci/cd',
  circleci: 'ci/cd',
  teamcity: 'ci/cd',
  snyk: 'devsecops',
  trivy: 'devsecops',
  sonarqube: 'devsecops',
  dependabot: 'devsecops',
  nginx: 'networking',
  envoy: 'networking',
  istio: 'networking',
  traefik: 'networking',
  api: 'networking',
  salesforce: 'crm',
  hubspot: 'crm',
  zendesk: 'support',
  intercom: 'support',
  slack: 'productivity',
  notion: 'productivity',
  trello: 'productivity',
  clickup: 'productivity',
  figma: 'design',
  adobe: 'design',
  canva: 'design',
  mailchimp: 'marketing',
  hubspotmarketing: 'marketing',
  segment: 'marketing',
  stripe: 'ecommerce',
  shopify: 'ecommerce',
  woocommerce: 'ecommerce',
  paypal: 'ecommerce',
  tableau: 'analytics',
  powerbi: 'analytics',
  looker: 'analytics',
  mixpanel: 'analytics',
  amplitude: 'analytics',
};

export function getToolArchitectureBlueprint(toolName: string, category: string): ToolArchitectureBlueprint {
  const text = normalize(`${toolName} ${category}`);

  for (const [key, blueprint] of Object.entries(TOOL_FAMILY_BLUEPRINTS)) {
    if (key === 'default') continue;
    const familyText = normalize(key);
    if (text.includes(familyText)) {
      return blueprint;
    }
  }

  for (const [pattern, blueprintKey] of Object.entries(TOOL_NAME_OVERRIDES)) {
    if (text.includes(normalize(pattern))) {
      const blueprint = TOOL_FAMILY_BLUEPRINTS[blueprintKey];
      if (blueprint) return blueprint;
    }
  }

  const categoryText = normalize(category);
  const categoryHints: Record<string, string> = {
    ai: 'ai/ml',
    ml: 'ai/ml',
    llm: 'ai/ml',
    model: 'ai/ml',
    cloud: 'cloud',
    infra: 'infrastructure as code',
    kubernetes: 'container/orchestration',
    docker: 'container/orchestration',
    database: 'database',
    analytics: 'analytics',
    observability: 'monitoring/observability',
    security: 'security/zero-trust',
    identity: 'identity & access',
    ci: 'ci/cd',
    cd: 'ci/cd',
    devops: 'ci/cd',
    monitoring: 'monitoring/observability',
    crm: 'crm',
    support: 'support',
    marketing: 'marketing',
    ecommerce: 'ecommerce',
    product: 'productivity',
    productivity: 'productivity',
    design: 'design',
    automation: 'automation',
    api: 'networking',
    networking: 'networking',
  };

  for (const [hint, blueprintKey] of Object.entries(categoryHints)) {
    if (categoryText.includes(hint)) {
      const blueprint = TOOL_FAMILY_BLUEPRINTS[blueprintKey];
      if (blueprint) return blueprint;
    }
  }

  return TOOL_FAMILY_BLUEPRINTS.default;
}
